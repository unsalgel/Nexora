import type { ChatMessageItem } from './types';
export const buildChatHistory = (messages: ChatMessageItem[]) => messages
  .filter(message => message.content.trim().length > 0)
  .slice(-3)
  .map(({ role, content }) => ({ role, content: content.slice(0, 500) }));
