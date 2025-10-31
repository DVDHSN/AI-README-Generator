// Fix: Import Chat type for the new getChatInstance function.
import { GoogleGenAI, Chat } from "@google/genai";
import { getRepoContent } from "./githubService";

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateReadme = async (repoUrl: string, repoContent: string, isThinkingMode: boolean): Promise<string> => {
  const modelName = 'gemini-2.5-pro';
  
  const prompt = `
    You are an expert software engineer and technical writer tasked with creating a README.md file for a GitHub repository.
    You have been provided with the file contents of the repository. Your task is to analyze this code to understand the project's purpose, technology stack, file structure, and key features.
    
    Based on your analysis of the code, generate a comprehensive, well-structured, and high-quality README.md file in Markdown format.
    
    The README should include the following sections:
    - **Project Title**: An engaging title for the project.
    - **Description**: A detailed explanation of what the project does, based on the code.
    - **Key Features**: A bulleted list of the main functionalities, inferred from the source code.
    - **Tech Stack**: A list of technologies, frameworks, and libraries used. Use package manager files (like package.json, requirements.txt) and code imports to determine this accurately.
    - **Installation & Setup**: A step-by-step guide on how to get the project running locally. Infer commands from files like package.json scripts.
    - **Usage**: Instructions or examples on how to use the project. If it's a library, show code examples. If it's an app, explain how to run it.
    - **File Structure**: A brief overview of the key directories and files can be helpful.
    - **Contributing**: Standard guidelines for potential contributors.
    - **License**: A mention of the project's license (e.g., MIT). Look for a LICENSE file if its content is provided.
    
    The user provided this URL for context: ${repoUrl}
    
    Here are the contents of the most relevant repository files:
    ---
    ${repoContent}
    ---
    
    Please provide only the raw Markdown content for the README file. Do not include any introductory phrases like "Here is the README file".
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
    throw new Error("Failed to generate README with Gemini. The model may be overloaded, or there might be an issue with the provided code.");
  }
};

export const editReadmeSelection = async (selectedText: string, editPrompt: string): Promise<string> => {
  const modelName = 'gemini-2.5-flash';

  const prompt = `
    You are an expert technical writer. A user has selected a portion of a README file and wants you to edit it based on their instruction.
    Rewrite the following text based on the user's instruction.
    IMPORTANT: Respond ONLY with the rewritten text. Do not include any explanations, introductory phrases, or markdown formatting like backticks unless it was part of the original text.

    USER'S INSTRUCTION:
    "${editPrompt}"

    ORIGINAL TEXT:
    ---
    ${selectedText}
    ---

    REWRITTEN TEXT:
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
    });
    return response.text.trim();
  } catch (error) {
    console.error("Error editing selection:", error);
    throw new Error("Failed to edit the selection.");
  }
};

// Fix: Export a function to get a chat instance for the ChatBot component.
export const getChatInstance = (): Chat => {
  const modelName = 'gemini-2.5-flash';
  return ai.chats.create({
    model: modelName,
  });
};