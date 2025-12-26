
import { GoogleGenAI } from "@google/genai";

export const generateCertificateDescription = async (
  activityName: string,
  role: string,
  additionalContext: string = ""
): Promise<string> => {
  const apiKey = (window as any).process?.env?.API_KEY || "";
  
  if (!apiKey) {
    console.warn("Gemini API Key is missing");
    return "ขอแสดงความชื่นชมในความมุ่งมั่นและผลงานอันเป็นที่ประจักษ์";
  }

  const ai = new GoogleGenAI({ apiKey });
  try {
    const prompt = `
      Create a short, formal, and inspiring Thai description for a certificate.
      Context: ${activityName}, Role: ${role}, Detail: ${additionalContext}
      Requirements: 1 formal Thai sentence, no names.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text?.trim() || "ขอแสดงความชื่นชมในความมุ่งมั่นและผลงานอันเป็นที่ประจักษ์";
  } catch (error) {
    console.error("Gemini error:", error);
    return "ขอมอบเกียรติบัตรฉบับนี้ให้ไว้เพื่อแสดงว่า";
  }
};
