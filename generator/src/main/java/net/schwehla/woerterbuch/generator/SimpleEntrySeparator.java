package net.schwehla.woerterbuch.generator;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.FileReader;
import java.io.FileWriter;

public class SimpleEntrySeparator {



    public static void main(String[] args) {
        try (BufferedReader reader = new BufferedReader(new FileReader("D:\\github\\puscariu-etymologisches-woerterbuch\\allEntries.xml"))) {
            String line;
            StringBuilder entryContent = new StringBuilder();
            String entryNumber = null;

            while ((line = reader.readLine()) != null) {
                line = line.trim();

                // Check for the start of an <entry> tag
                if (line.startsWith("<entry ")) {
                    entryContent.setLength(0); // Clear previous entry content
                    entryContent.append(line).append("\n");

                    // Extract entry number
                    int start = line.indexOf("number=\"") + 8;
                    int end = line.indexOf("\"", start);
                    entryNumber = line.substring(start, end);
                } else if (line.startsWith("</entry>")) {
                    entryContent.append(line).append("\n");

                    // Write the current entry to a file
                    if (entryNumber != null) {
                    	
                    	String content = entryContent.toString().trim();
                    	content = PrettyPrinter.prettyPrint(content);
                    	
                        try (BufferedWriter writer = new BufferedWriter(new FileWriter("D:\\github\\puscariu-etymologisches-woerterbuch\\generator\\src\\main\\resources\\entries\\entry_" + entryNumber + ".xml"))) {
                            writer.write(content);
                        }
                        
                        System.out.println("Saved entry_" + entryNumber + ".xml");
                    }
                    entryNumber = null; // Reset for the next entry
                } else if (entryNumber != null) {
                    entryContent.append(line).append("\n");
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }


}


