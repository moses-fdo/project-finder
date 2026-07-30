// Types for project-related entities

export interface Project {
  id: number;
  title: string;
  description: string;
  status: "OPEN" | "FULL" | "CLOSED";
  ownerId: number;
  owner?: {
    id: number;
    name?: string;
    email?: string;
    image?: string;
  };
  skills?: SkillRef[];
  applications?: Application[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SkillRef {
  id: number;
  name: string;
}

export interface ProjectFormData {
  title: string;
  description: string;
  status?: "OPEN" | "FULL";
  skills?: string[];
  department?: string;
}

export interface Application {
  id: number;
  userId: number;
  projectId: number;
  user?: {
    id: number;
    name?: string;
    department?: string;
    year?: number;
  };
  project?: Project;
  message?: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  createdAt: Date;
}

export interface CollaborationUser {
  id: number;
  name: string;
  email: string;
  department: string;
  year: number;
  bio?: string;
  skills: SkillRef[];
  projects?: Project[];
}
