import { GoogleGenAI } from "@google/genai";
import { SearchResult, GroundingChunk } from "../types";

const apiKey = process.env.API_KEY;

if (!apiKey) {
    console.error("API_KEY is missing. Please ensure it is set in the environment.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || '' });

export const searchCorporateOffices = async (location: string): Promise<SearchResult> => {
    try {
        const modelId = "gemini-2.5-flash"; // Required for Maps Grounding
        
        const response = await ai.models.generateContent({
            model: modelId,
            contents: `Find corporate offices located near or at ${location}. 
            List as many distinct places as possible, aiming for 50 results. Do not satisfy yourself with just a few; be exhaustive.
            
            STRICT OUTPUT FORMAT:
            For each place, start a new block with the delimiter "### " followed immediately by the Place Name.
            On the next line, write "Website: " followed by the official website URL. You MUST use Google Search to find the official website if it is not in the map data. Only write "Website: N/A" if you absolutely cannot find it.
            On the next line, provide the insight and analysis (description) for that company.
            
            Example format:
            ### Company Name A
            Website: https://www.example.com
            Description of Company Name A...
            
            ### Company Name B
            Website: N/A
            Description of Company Name B...

            Focus on office buildings, headquarters, or coworking spaces.`,
            config: {
                tools: [{ googleMaps: {} }, { googleSearch: {} }],
                temperature: 0, // Setting temperature to 0 ensures consistent, non-random results
            },
        });

        const candidate = response.candidates?.[0];
        const text = candidate?.content?.parts?.map(p => p.text).join('') || "No text description returned.";
        
        // Extract grounding chunks which contain the specific map data
        const chunks = candidate?.groundingMetadata?.groundingChunks || [];

        return {
            text,
            chunks: chunks as GroundingChunk[]
        };

    } catch (error) {
        console.error("Error searching corporate offices:", error);
        throw error;
    }
};