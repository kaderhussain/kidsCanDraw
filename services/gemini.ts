import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const convertImageToColoringPage = async (base64Image: string): Promise<string> => {
  try {
    // We treat this as a multimodal text generation task: Image -> SVG Code
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg', // Assuming jpeg/png for input
              data: base64Image
            }
          },
          {
            text: `You are an expert children's book illustrator. 
            Analyze the provided image and generate an SVG code string representing a "Coloring Book" version of it.
            
            Requirements:
            1. Output ONLY valid SVG code. No markdown backticks, no text explanations.
            2. The SVG should be black outlines on a white background (or transparent).
            3. Simplify the details significantly to make it suitable for a 5-year-old to color.
            4. Use strict strokes (stroke="black", stroke-width="2" or "3") and fill="none" (or fill="white") for closed shapes so they can be colored later.
            5. Ensure the SVG has a viewBox defined.
            6. The style should be cute, rounded, and friendly.
            `
          }
        ]
      }
    });

    let svgText = response.text || '';
    
    // Cleanup: Remove markdown code blocks if the model adds them despite instructions
    svgText = svgText.replace(/```xml/g, '').replace(/```svg/g, '').replace(/```/g, '');
    
    // Basic validation to check if it looks like an SVG
    if (!svgText.includes('<svg')) {
      throw new Error("Failed to generate valid SVG");
    }

    return svgText;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};