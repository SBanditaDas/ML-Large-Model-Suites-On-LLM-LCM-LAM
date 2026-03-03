export type ModelType = 'LLM' | 'LCM' | 'LAM';

export interface Message {
  role: 'user' | 'model' | 'system';
  content: string;
  timestamp: number;
}

export interface ToolCall {
  name: string;
  args: any;
  id: string;
}

export interface ToolResult {
  name: string;
  result: any;
  id: string;
}
