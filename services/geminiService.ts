
import { GoogleGenAI, Type } from "@google/genai";
import { LogbookEntry, ColumnDefinition } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const recognizeLogbookFormat = async (base64Image: string): Promise<Partial<ColumnDefinition>[]> => {
  const prompt = `
    Analyze this image of a pilot's flight logbook. Identify all column headers present in the logbook structure.
    For each column found, determine:
    1. A clear label.
    2. A suggested data type: 'text', 'number', or 'time'.
    
    Return the structure as a JSON array of objects.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              label: { type: Type.STRING },
              type: { type: Type.STRING, enum: ['text', 'number', 'time'] }
            },
            required: ["label", "type"]
          }
        }
      }
    });

    const jsonStr = response.text;
    if (!jsonStr) throw new Error("Could not detect logbook structure");
    
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Format Recognition Error:", error);
    throw error;
  }
};

export const extractLogbookData = async (base64Image: string, activeColumns: ColumnDefinition[], logbookYear: string): Promise<LogbookEntry[]> => {
  const columnDescriptions = activeColumns.map(c => `${c.label} (${c.type})`).join(', ');
  
  const prompt = `
    Extract flight logbook data from this image with high precision, specifically focusing on handwriting recognition.
    The logbook has the following columns: ${columnDescriptions}.
    
    CRITICAL INSTRUCTIONS FOR DEPARTURE/ARRIVAL (ROUTE):
    - AIRPORT IDENTIFIERS: These are typically 3 or 4 uppercase characters (e.g., KLAX, SFO, EGLL, 1O2).
    - HANDWRITING AMBIGUITY: Use aviation context to resolve characters. 
        - If in an identifier like 'KLAX', a '0' is likely an 'O'.
        - If in 'KSFO', a '5' might be an 'S'.
        - A '1' might be an 'I' or vice versa depending on common ICAO/IATA patterns.
    - SPLITTING ENTRIES: If the image has one "Route" column with "FROM-TO" style (e.g., "SFO-LAX" or "SFO LAX"), you MUST split them into 'routeFrom' (SFO) and 'routeTo' (LAX).
    - PRECISION: Ensure every letter is correctly identified. Airport codes are almost always uppercase.
    
    CRITICAL INSTRUCTIONS FOR SIGNATURES & CERTIFICATES:
    - SCAN FOR HANDWRITING: Pilots often sign in a "Signature" column, the "Remarks" column, or at the bottom of the page.
    - RECOGNIZE STYLES: Extract signatures even if they are in cursive, messy, or consist of just initials. 
    - CERTIFICATE NUMBERS: Look for strings like "CFI", "CFII", "MEI", "ATP", "Cert", "Certificate", or "#" followed by numbers.
    - VISUAL CUES: If a box contains a handwritten scribble that looks like a name or signature, extract it as accurately as possible. If illegible but clearly a signature, use "[Signature Present]".
    - CONSISTENCY: If a signature/certificate is provided once at the bottom of a block of rows to certify multiple flights, apply that same signature to all relevant rows in this extraction.
    - OUTPUT: Extract the full string (e.g., "John Smith CFI 1234567") into the 'signature' field.
    
    LANDINGS (NO. LDG COLUMN):
    - Within the "NO. LDG" or "LANDINGS" column, boxes are often divided by a DIAGONAL LINE.
    - TOP LEFT of the diagonal = DAY TIME LANDINGS ('ldgDay').
    - BOTTOM RIGHT of the diagonal = NIGHT TIME LANDINGS ('ldgNight').
    - If empty, input 0.
    
    OTHER INSTRUCTIONS:
    1. CONTEXT: Current year is ${logbookYear}. If entries only show month/day (e.g., "05/10"), assume the year is ${logbookYear}.
    2. REMARKS: Include any interesting flight details, and append the signature info at the end of the remarks for redundancy.
    
    Return the data as a JSON array of objects.
  `;

  try {
    const properties: Record<string, any> = {
      id: { type: Type.STRING },
      routeFrom: { type: Type.STRING },
      routeTo: { type: Type.STRING },
      signature: { type: Type.STRING },
      remarks: { type: Type.STRING },
      ldgDay: { type: Type.NUMBER },
      ldgNight: { type: Type.NUMBER }
    };
    
    activeColumns.forEach(col => {
      const coreKeys = ['id', 'routeFrom', 'routeTo', 'signature', 'remarks', 'ldgDay', 'ldgNight'];
      if (!coreKeys.includes(col.key)) {
        properties[col.key] = { 
          type: col.type === 'number' ? Type.NUMBER : Type.STRING 
        };
      }
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: properties
          }
        }
      }
    });

    const jsonStr = response.text;
    if (!jsonStr) throw new Error("No data extracted from image");
    
    const entries = JSON.parse(jsonStr) as any[];
    // Fix: Explicitly cast to LogbookEntry[] to ensure the returned objects satisfy the required interface properties including id.
    return entries.map((e, index) => ({
      ...e,
      id: `entry-${Date.now()}-${index}`,
    })) as LogbookEntry[];
  } catch (error) {
    console.error("Gemini Extraction Error:", error);
    throw error;
  }
};