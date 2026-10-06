export type UserRole = 'admin' | 'client';

export interface UserProfile {
  email: string;
  name: string;
  role: UserRole;
  brandIds: string[];
}
