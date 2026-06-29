export interface User {
  _id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  role: 'user' | 'admin';
  status: 'pending' | 'approved' | 'rejected';
  telegramChatId?: string;
  telegramVerificationCode: string;
  location: string;
  createdAt: string;
  updatedAt: string;
}

export interface Stats {
  totalUsers: number;
  pendingUsers: number;
  approvedUsers: number;
  telegramLinkedUsers: number;
}
