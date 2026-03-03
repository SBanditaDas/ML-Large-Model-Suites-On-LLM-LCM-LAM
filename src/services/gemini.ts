import { GoogleGenAI, Type, FunctionDeclaration, GenerateContentResponse } from "@google/genai";
import { Message } from "../types";

const apiKey = process.env.GEMINI_API_KEY;

export const getGeminiClient = () => {
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }
  return new GoogleGenAI({ apiKey });
};

// --- LLM Service ---
export const chatWithLLM = async (messages: Message[]) => {
  const ai = getGeminiClient();
  const history = messages.slice(0, -1).map(m => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{ text: m.content }]
  }));

  const chat = ai.chats.create({
    model: "gemini-2.5-flash",
    config: {
      systemInstruction: "You are a highly capable Large Language Model (LLM). Focus on reasoning, creativity, and deep understanding.",
    },
    history
  });

  const response = await chat.sendMessage({ message: messages[messages.length - 1].content });
  return response.text;
};

// --- LCM Service (Large Context) ---
export const queryWithContext = async (context: string, query: string) => {
  const ai = getGeminiClient();
  // We simulate LCM by providing a huge block of text in the prompt or system instruction
  // In a real app, we might use urlContext or file uploads.
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      { role: 'user', parts: [{ text: `CONTEXT:\n${context}\n\nQUERY: ${query}` }] }
    ],
    config: {
      systemInstruction: "You are a Large Context Model (LCM). You excel at processing vast amounts of information provided in the context. Answer the query based strictly on the provided context.",
    }
  });
  return response.text;
};

// --- LAM Service (Large Action) ---
const tools: FunctionDeclaration[] = [
  {
    name: "getWeather",
    description: "Get the current weather for a location",
    parameters: {
      type: Type.OBJECT,
      properties: {
        location: { type: Type.STRING, description: "The city and state, e.g. San Francisco, CA" },
        unit: { type: Type.STRING, enum: ["celsius", "fahrenheit"] }
      },
      required: ["location"]
    }
  },
  {
    name: "createTask",
    description: "Create a new task in the user's todo list",
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: "The title of the task" },
        dueDate: { type: Type.STRING, description: "The due date of the task" },
        priority: { type: Type.STRING, enum: ["low", "medium", "high"] }
      },
      required: ["title"]
    }
  },
  {
    name: "searchWeb",
    description: "Search the web for real-time information",
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: { type: Type.STRING, description: "The search query" }
      },
      required: ["query"]
    }
  }
];

export const executeAction = async (prompt: string) => {
  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config: {
      tools: [{ functionDeclarations: tools }],
      systemInstruction: "You are a Large Action Model (LAM). Your goal is to help the user by calling appropriate tools to perform actions. If a tool is called, explain what you are doing.",
    }
  });

  return response;
};
