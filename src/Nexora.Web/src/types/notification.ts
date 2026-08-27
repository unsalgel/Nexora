export interface NotificationDto {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'Order' | 'Campaign' | 'Security' | 'System' | string;
  isRead: boolean;
  readAtUtc: string | null;
  createdAtUtc: string;
}
