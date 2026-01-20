import { GoogleGenAI } from "@google/genai";
import { ResumeData, Job } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateResumeAI = async (data: ResumeData): Promise<string> => {
  const model = 'gemini-3-flash-preview';
  
  const prompt = `
    You are an expert ATS Resume Writer. Create a professional resume in Markdown format based on the following data.
    Ensure keywords from the skills are highlighted. Structure it with clear headers (# Summary, ## Experience, ## Education, ## Skills).
    
    Name: ${data.fullName}
    Contact: ${data.email} | ${data.phone}
    
    Professional Summary (Make this punchy based on: ${data.summary}):
    
    Skills: ${data.skills}
    
    Experience:
    ${data.experience.map(exp => `- ${exp.role} at ${exp.company} (${exp.duration}): ${exp.details}`).join('\n')}
    
    Education:
    ${data.education.map(edu => `- ${edu.degree}, ${edu.school} (${edu.year})`).join('\n')}
    
    Do not include any introductory text, just the markdown resume content.
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });
    return response.text || "Failed to generate resume.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error generating resume. Please check your API key or try again.";
  }
};

export const generateCoverLetterAI = async (resumeText: string, job: Job): Promise<string> => {
  const model = 'gemini-3-flash-preview';

  const prompt = `
    Write a persuasive, short cover letter (max 200 words) for the position of ${job.title} at ${job.company}.
    
    Use the following applicant background:
    ${resumeText.substring(0, 1000)}... (truncated for brevity)
    
    And the job description:
    ${job.description}
    
    Key skills required: ${job.skillsRequired.join(', ')}
    
    Tone: Professional, enthusiastic, and confident.
    Format: Plain text, ready to paste into an email body. No placeholders like [Date] or [Your Name], just the body.
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });
    return response.text || "Failed to generate cover letter.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error generating cover letter.";
  }
};

export const scoreJobMatchAI = async (resumeSkills: string, job: Job): Promise<number> => {
  // Mock scoring for speed in demo, or use a very fast flash call
  // Real implementation would pass full resume content
  const model = 'gemini-3-flash-preview';
  const prompt = `
    Rate the match compatibility between a candidate with skills: "${resumeSkills}"
    and a job requirement: "${job.skillsRequired.join(', ')}".
    Return ONLY a number between 0 and 100.
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });
    const text = response.text || "";
    const score = parseInt(text.trim());
    return isNaN(score) ? 50 : score;
  } catch (error) {
    return 75; // Fallback
  }
};