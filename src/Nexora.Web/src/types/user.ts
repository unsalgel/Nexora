export interface UserProfileDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  isEmailConfirmed: boolean;
  pendingEmail?: string | null;
}
