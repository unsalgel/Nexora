import { apiClient, type ApiResponse } from '../../../lib/apiClient';
import type { SendChatMessageRequest, ChatResponse } from '../types';

export const chatService = {
  sendMessage: async (payload: SendChatMessageRequest): Promise<ChatResponse> => {
    const response = await apiClient.post<ApiResponse<ChatResponse>>('/chat/send', payload);
    return response.data.data;
  },
};
