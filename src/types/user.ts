// Centralized types for user-related data structures
// This helps prevent runtime errors and improves type safety

export interface UserProfile {
  id: number;
  name: string;
  email?: string;
  department?: string;
  year?: number;
  bio?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  skills?: Skill[];
  role?: string;
  image?: string;
  onboardingCompleted?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Skill {
  id: number;
  name: string;
  userId?: number;
}

export type UserRole = "USER" | "ADMIN";

export interface AuthSession {
  user?: {
    id?: string | number;
    name?: string;
    email?: string;
    image?: string;
    role?: UserRole;
    department?: string;
    year?: number;
  };
}

export interface ProfileFormData {
  name: string;
  department: string;
  year: string;
  bio: string;
  githubUrl: string;
  linkedinUrl: string;
  skills: string;
}
