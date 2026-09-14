export interface ChatMessageItem {
  role: 'user' | 'assistant';
  content: string;
}

export interface SendChatMessageRequest {
  message: string;
  history?: ChatMessageItem[];
}

export interface ChatResponse {
  reply: string;
  suggestedProductIds?: string[];
}
