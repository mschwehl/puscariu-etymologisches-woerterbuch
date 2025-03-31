package net.schwehla.woerterbuch.generator;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.StringReader;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.text.Normalizer; // Import Normalizer
import java.util.ArrayList;
import java.util.Comparator;
import java.util.Enumeration;
import java.util.List;
import java.util.jar.JarEntry;
import java.util.jar.JarFile;
import java.util.regex.Pattern; // Import Pattern
import java.util.stream.Collectors;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.transform.Transformer;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.dom.DOMSource;
import javax.xml.transform.stream.StreamResult;
import javax.xml.transform.stream.StreamSource;

import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;
import org.xml.sax.InputSource;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;

public class DictionaryProcessor {

	private static final String ENTRIES_SUBDIR = "entries";

	private static final String OUTPUT_INDEX_DATA_FILE = "index_data.json"; // Search data
	private static final ObjectMapper objectMapper = new ObjectMapper().enable(SerializationFeature.INDENT_OUTPUT);

	// Pattern for removing diacritics (Unicode)
	private static final Pattern DIACRITICS_PATTERN = Pattern.compile("\\p{InCombiningDiacriticalMarks}+");

	public static List<String> listResourceFiles(String folderName) throws Exception {
		List<String> fileNames = new ArrayList<>();

		var resourceUrl = DictionaryProcessor.class.getResource("/" + folderName);

		if (resourceUrl != null) {
			if ("file".equals(resourceUrl.getProtocol())) {
				// For file-based resources
				try (var paths = Files.list(Path.of(resourceUrl.toURI()))) {
					paths.forEach(path -> fileNames.add(path.getFileName().toString()));
				}
			} else if ("jar".equals(resourceUrl.getProtocol())) {
				// For JAR-packaged resources
				String jarPath = resourceUrl.getPath().substring(5, resourceUrl.getPath().indexOf("!"));
				try (var jarFile = new JarFile(jarPath)) {
					Enumeration<JarEntry> entries = jarFile.entries();
					while (entries.hasMoreElements()) {
						JarEntry entry = entries.nextElement();
						String entryName = entry.getName();
						if (entryName.startsWith(folderName) && !entryName.equals(folderName + "/")) {
							fileNames.add(entryName.substring(folderName.length() + 1));
						}
					}
				}
			}
		} else {
			throw new IOException("Folder not found: " + folderName);
		}

		return fileNames;
	}

	public static String readResourceFile(String fileName) throws Exception {

		var resourceUrl = DictionaryProcessor.class.getResource("/" + fileName);

		if (resourceUrl != null) {
			// Handle file-based resources (works locally)
			if ("file".equals(resourceUrl.getProtocol())) {
				return Files.readString(Path.of(resourceUrl.toURI()));
			}
			// Handle resources inside JARs
			else {
				try (var inputStream = resourceUrl.openStream();
						var reader = new BufferedReader(new InputStreamReader(inputStream))) {

					return reader.lines().collect(Collectors.joining("\n"));
				}
			}
		}

		throw new Exception("Resource not found: " + fileName);
	}

	public void generate(Path baseOutputPath) throws Exception {

		Path entriesOutputPath = baseOutputPath.resolve(ENTRIES_SUBDIR);
	

		Files.createDirectories(entriesOutputPath);

		DocumentBuilderFactory docFactory = DocumentBuilderFactory.newInstance();
		docFactory.setIgnoringComments(true); // Skip comments

		DocumentBuilder docBuilder = docFactory.newDocumentBuilder();

		TransformerFactory transFactory = TransformerFactory.newInstance();

		String stylesheet = readResourceFile("entry_transform.xsl");
		StreamSource xsltSource = new StreamSource(new StringReader(stylesheet));

		Transformer transformer = transFactory.newTransformer(xsltSource);

		List<IndexEntry> indexEntries = new ArrayList<>();

		listResourceFiles("words").stream().filter(p -> p.endsWith(".xml") && p.startsWith("entry_"))
				.sorted(Comparator.comparing(p -> extractEntryNumber(p))).forEach(xmlPath -> {

					try {
						System.out.println("Processing: " + xmlPath);
						String xmlContent = readResourceFile("entries/" + xmlPath);
						Document doc = docBuilder.parse(new InputSource(new StringReader(xmlContent)));

						doc.getDocumentElement().normalize();
						Element rootElement = doc.getDocumentElement();

						if (!"entry".equals(rootElement.getNodeName())) {
							throw new RuntimeException("Skipping non-entry XML: " + xmlPath);
						}

						String entryNumberStr = rootElement.getAttribute("number");
						// Ensure number is treated consistently (e.g., as String or consistently parse)
						// Using String here as it matches JSON output better
						String lemma = getElementTextContent(rootElement, "lemma", "N/A");
						String definition = getFirstDefinitionText(rootElement, "");
						String pos = getElementTextContent(rootElement, "pos", "");

						// --- NEW: Generate simplified lemma ---
						String simplifiedLemma = simplifyForSearch(lemma);

						// Transform XML to HTML
						DOMSource xmlSource = new DOMSource(doc);
						Path htmlFilePath = entriesOutputPath.resolve("entry_" + entryNumberStr + ".html");
						StreamResult htmlResult = new StreamResult(htmlFilePath.toFile());
						transformer.transform(xmlSource, htmlResult);

						// Collect data for index, including simplified lemma
						indexEntries.add(new IndexEntry(entryNumberStr, lemma, simplifiedLemma, definition, pos));

					} catch (Exception e) {

						// e.printStackTrace();

						throw new RuntimeException(e);
					}

				});

		// Generate index_data.json
		generateSearchIndexJson(indexEntries, baseOutputPath.resolve(OUTPUT_INDEX_DATA_FILE));

		System.out.println("\nProcessing complete.");
		System.out.println("HTML entries generated in: " + entriesOutputPath.toAbsolutePath());
		System.out
				.println("Search index generated: " + baseOutputPath.resolve(OUTPUT_INDEX_DATA_FILE).toAbsolutePath());

	}

	public static void main(String[] args) throws Exception {

		String folderPath = "..";

		if (args.length == 1) {
			folderPath = args[0];
		}

		// Convert to a Path object and normalize it
		Path path = Paths.get(folderPath).normalize();

		// Get the absolute path
		Path baseOutputPath = path.toAbsolutePath();

		Files.createDirectories(baseOutputPath);

		System.out.println("Processing folder: " + baseOutputPath.toString());

		try {
			new DictionaryProcessor().generate(baseOutputPath);
		} catch (Exception e) {
			e.printStackTrace();
		}

	}

	// Helper to remove diacritics using Unicode normalization
	private static String simplifyForSearch(String text) {
		if (text == null || text.isEmpty()) {
			return "";
		}
		String normalized = Normalizer.normalize(text, Normalizer.Form.NFD);
		return DIACRITICS_PATTERN.matcher(normalized).replaceAll("").toLowerCase(); // Convert to lowercase for
																					// case-insensitive search
	}

	// --- Keep extractEntryNumber, getElementTextContent, getFirstDefinitionText
	// helpers ---
	private static int extractEntryNumber(String fileName) {
		try {
			String numStr = fileName.replace("entry_", "").replace(".xml", "");
			return Integer.parseInt(numStr);
		} catch (NumberFormatException e) {
			return Integer.MAX_VALUE;
		}
	}

	private static String getElementTextContent(Element parent, String childTagName, String defaultValue) {
		NodeList nodeList = parent.getElementsByTagName(childTagName);
		for (int i = 0; i < nodeList.getLength(); i++) {
			Node node = nodeList.item(i);
			if (node.getNodeType() == Node.ELEMENT_NODE && node.getParentNode().isSameNode(parent)) {
				String text = node.getTextContent();
				return (text != null) ? text.trim() : defaultValue;
			}
		}
		return defaultValue;
	}

	private static String getFirstDefinitionText(Element parent, String defaultValue) {
		NodeList nodeList = parent.getElementsByTagName("definition");
		if (nodeList.getLength() > 0) {
			for (int i = 0; i < nodeList.getLength(); i++) {
				Node defNode = nodeList.item(i);
				Node defParent = defNode.getParentNode();
				if (defParent.isSameNode(parent)) {
					String text = defNode.getTextContent();
					return (text != null) ? text.trim().replace("„", "").replace("“", "").replace("\"", "")
							: defaultValue;
				} else if ("sense".equals(defParent.getNodeName())) {
					Node senseParent = defParent.getParentNode();
					if ("senses".equals(senseParent.getNodeName()) && senseParent.getParentNode().isSameNode(parent)) {
						String text = defNode.getTextContent();
						return (text != null) ? text.trim().replace("„", "").replace("“", "").replace("\"", "")
								: defaultValue;
					}
				}
			}
			String text = nodeList.item(0).getTextContent();
			return (text != null) ? text.trim().replace("„", "").replace("“", "").replace("\"", "") : defaultValue;
		}
		return defaultValue;
	}

	// Updated to include 'sl' (simplified lemma)
	private static void generateSearchIndexJson(List<IndexEntry> entries, Path outputPath) throws IOException {
		ArrayNode jsonArray = objectMapper.createArrayNode();
		for (IndexEntry entry : entries) {
			ObjectNode entryNode = objectMapper.createObjectNode();
			// Use put(String, String) for ID if it's consistently a string
			entryNode.put("id", entry.number); // Keep ID as it is (String or Number)
			entryNode.put("l", escapeJson(entry.lemma)); // Original lemma
			entryNode.put("sl", escapeJson(entry.simplifiedLemma)); // NEW: Simplified lemma
			entryNode.put("d", escapeJson(entry.definition)); // Definition
			if (entry.pos != null && !entry.pos.isEmpty()) {
				entryNode.put("p", escapeJson(entry.pos));
			} else {
				entryNode.putNull("p");
			}
			jsonArray.add(entryNode);
		}
		objectMapper.writerWithDefaultPrettyPrinter().writeValue(outputPath.toFile(), jsonArray);
	}

	// --- Remove or comment out generateIndexLinksHtml if not used ---
	/*
	 * private static void generateIndexLinksHtml(List<IndexEntry> entries, Path
	 * outputPath) throws IOException { // ... implementation (not strictly needed
	 * for Vue app) ... }
	 */

	// --- Keep escapeJson helper ---
	private static String escapeJson(String text) {
		if (text == null)
			return "";
		return text.replace("\\", "\\\\").replace("\"", "\\\"").replace("\b", "\\b").replace("\f", "\\f")
				.replace("\n", "\\n").replace("\r", "\\r").replace("\t", "\\t");
	}

	// Updated record to include simplifiedLemma
	record IndexEntry(String number, String lemma, String simplifiedLemma, String definition, String pos) {
	}
}