package net.schwehla.woerterbuch.generator;

import java.io.StringWriter;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.transform.OutputKeys;
import javax.xml.transform.Transformer;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.dom.DOMSource;
import javax.xml.transform.stream.StreamResult;

import org.w3c.dom.Document;
import org.xml.sax.InputSource;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;

public class PrettyPrinter {

    public static String prettyPrint(String input) throws Exception {
        try {
            if (input.trim().startsWith("<")) {
                // Assume it's XML
                return formatXml(input);
            } else if (input.trim().startsWith("{") || input.trim().startsWith("[")) {
                // Assume it's JSON
                return formatJson(input);
            } else {
                throw new IllegalArgumentException("Unsupported format: Only XML or JSON is supported.");
            }
        } catch (Exception e) {
            throw new Exception("Error while pretty printing input: " + input + "\nReason: " + e.getMessage(), e);
        }
    }

    private static String formatXml(String xml) throws Exception {
        try {
            DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
            factory.setIgnoringElementContentWhitespace(true);
            DocumentBuilder builder = factory.newDocumentBuilder();
            Document document = builder.parse(new InputSource(new java.io.StringReader(xml)));

            Transformer transformer = TransformerFactory.newInstance().newTransformer();
            transformer.setOutputProperty(OutputKeys.INDENT, "yes");
            transformer.setOutputProperty("{http://xml.apache.org/xslt}indent-amount", "2");

            StringWriter writer = new StringWriter();
            transformer.transform(new DOMSource(document), new StreamResult(writer));
            return writer.toString();
        } catch (Exception e) {
            throw new Exception("Error processing XML content:\n" + xml + "\nReason: " + e.getMessage(), e);
        }
    }

    private static String formatJson(String json) throws Exception {
        try {
            ObjectMapper mapper = new ObjectMapper();
            Object jsonObject = mapper.readValue(json, Object.class);
            mapper.enable(SerializationFeature.INDENT_OUTPUT);
            return mapper.writeValueAsString(jsonObject);
        } catch (Exception e) {
            throw new Exception("Error processing JSON content:\n" + json + "\nReason: " + e.getMessage(), e);
        }
    }

    public static void main(String[] args) {
        try {
            String xmlInput = "<root><child>content</child></root>"; // Valid XML
            String invalidXmlInput = "<root><child>content</root>";  // Invalid XML
            String jsonInput = "{\"name\":\"John\",\"age\":30}";     // Valid JSON
            String invalidJsonInput = "{\"name\":\"John\",\"age\":}"; // Invalid JSON

            System.out.println("Pretty XML:\n" + prettyPrint(xmlInput));
            System.out.println("Pretty JSON:\n" + prettyPrint(jsonInput));

            // Triggering errors
            System.out.println("Pretty Invalid XML:\n" + prettyPrint(invalidXmlInput));
            System.out.println("Pretty Invalid JSON:\n" + prettyPrint(invalidJsonInput));
        } catch (Exception e) {
            System.err.println(e.getMessage());
            e.printStackTrace();
        }
    }
}
