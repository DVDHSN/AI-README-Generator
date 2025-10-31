
import { GoogleGenAI, Chat } from "@google/genai";

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

let chatInstance: Chat | null = null;

export const generateReadme = async (repoUrl: string, isThinkingMode: boolean): Promise<string> => {
  const modelName = 'gemini-2.5-pro';
  
  const prompt = `
    You are an expert software engineer and technical writer tasked with creating a README.md file for a GitHub repository.
    Based on the provided GitHub repository URL, infer the project's purpose, technology stack, file structure, and key features.
    
    Generate a comprehensive, well-structured, and high-quality README.md file in Markdown format.
    
    The README should include the following sections:
    - **Project Title**: An engaging title for the project.
    - **Description**: A detailed explanation of what the project does.
    - **Key Features**: A bulleted list of the main functionalities.
    - **Tech Stack**: A list of technologies, frameworks, and libraries used.
    - **Installation & Setup**: A step-by-step guide on how to get the project running locally.
    - **Usage**: Instructions or examples on how to use the project.
    - **Contributing**: Guidelines for potential contributors.
    - **License**: A mention of the project's license (e.g., MIT).
    
    Here is the repository URL: ${repoUrl}
    
    Please provide only the raw Markdown content for the README file.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      ...(isThinkingMode && {
        config: {
          thinkingConfig: { thinkingBudget: 32768 }
        }
      })
    });
    return response.text;
  } catch (error) {
    console.error("Error generating README:", error);
    throw new Error("Failed to generate README. Please check the repository URL and try again.");
  }
};

export const getChatInstance = (): Chat => {
  if (!chatInstance) {
    chatInstance = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: 'You are a helpful and friendly AI assistant for a developer tool. Answer questions concisely and clearly.',
      },
    });
  }
  return chatInstance;
};
