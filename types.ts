export enum UserRole {
  JOB_SEEKER = 'JOB_SEEKER',
  COLLEGE_ADMIN = 'COLLEGE_ADMIN',
  RECRUITER = 'RECRUITER',
  SUPER_ADMIN = 'SUPER_ADMIN'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  subscriptionPlan?: 'FREE' | 'BASIC' | 'PRO';
}

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: 'Full-time' | 'Part-time' | 'Internship';
  salaryRange: string;
  description: string;
  skillsRequired: string[];
  postedDate: string;
  matchScore?: number; // Calculated by AI
}

export interface Application {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  status: 'APPLIED' | 'VIEWED' | 'SHORTLISTED' | 'INTERVIEW' | 'REJECTED';
  appliedDate: string;
  coverLetter?: string;
}

export interface ResumeData {
  fullName: string;
  email: string;
  phone: string;
  summary: string;
  skills: string; // Comma separated
  experience: {
    role: string;
    company: string;
    duration: string;
    details: string;
  }[];
  education: {
    degree: string;
    school: string;
    year: string;
  }[];
  generatedContent?: string; // The Markdown resume
}
