
import { GoogleGenAI } from "https://esm.sh/@google/genai@1.30.0";

export const generateCertificateDescription = async (
  activityName: string,
  role: string,
  additionalContext: string = ""
): Promise<string> => {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    console.warn("Gemini API Key is missing, using default text.");
    return "ได้อุทิศตนและทำคุณประโยชน์ให้แก่สถานศึกษาด้วยความวิริยะอุตสาหะ";
  }

  const ai = new GoogleGenAI({ apiKey });
  try {
    const prompt = `ในฐานะผู้เชี่ยวชาญภาษาไทยทางการศึกษา จงสร้างคำบรรยายสั้นๆ 1 ประโยคสำหรับเกียรติบัตร
    กิจกรรม: ${activityName}
    บทบาท: ${role}
    ข้อมูลเพิ่มเติม: ${additionalContext}
    ข้อกำหนด: ใช้ภาษาที่เป็นทางการ ไพเราะ ไม่ใส่ชื่อคน ไม่ต้องมีคำนำหน้า ให้เริ่มด้วยกริยา เช่น "ได้รับรางวัล..." หรือ "เป็นผู้มีความรู้ความสามารถ..."`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text?.trim() || "ได้อุทิศตนและทำคุณประโยชน์ให้แก่สถานศึกษาด้วยความวิริยะอุตสาหะ";
  } catch (error) {
    console.error("Gemini error:", error);
    return "ได้เข้าร่วมกิจกรรมและปฏิบัติหน้าที่ตามภารกิจที่ได้รับมอบหมายอย่างยอดเยี่ยม";
  }
};
