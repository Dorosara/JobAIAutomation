import { Job, UserRole } from './types';

export const MOCK_JOBS: Job[] = [
  {
    id: '1',
    title: 'Senior Frontend Engineer',
    company: 'TechFlow Solutions',
    location: 'Remote (India)',
    type: 'Full-time',
    salaryRange: '₹25L - ₹40L',
    description: 'We are looking for a React expert to lead our frontend team. Experience with AI integration is a plus.',
    skillsRequired: ['React', 'TypeScript', 'Tailwind', 'AI'],
    postedDate: '2023-10-25',
    matchScore: 92
  },
  {
    id: '2',
    title: 'Junior Data Analyst',
    company: 'DataCorp',
    location: 'Bangalore',
    type: 'Full-time',
    salaryRange: '₹6L - ₹10L',
    description: 'Analyze marketing trends using SQL and Python.',
    skillsRequired: ['SQL', 'Python', 'Excel'],
    postedDate: '2023-10-24',
    matchScore: 65
  },
  {
    id: '3',
    title: 'Product Designer (UI/UX)',
    company: 'Creative Minds',
    location: 'Mumbai',
    type: 'Full-time',
    salaryRange: '₹12L - ₹18L',
    description: 'Design intuitive interfaces for our SaaS products.',
    skillsRequired: ['Figma', 'Prototyping', 'User Research'],
    postedDate: '2023-10-26',
    matchScore: 45
  },
  {
    id: '4',
    title: 'AI/ML Intern',
    company: 'NextGen AI',
    location: 'Hyderabad',
    type: 'Internship',
    salaryRange: '₹20k/month',
    description: 'Work on LLM fine-tuning and RAG pipelines.',
    skillsRequired: ['Python', 'PyTorch', 'LangChain'],
    postedDate: '2023-10-27',
    matchScore: 88
  }
];

export const PRICING_PLANS = [
  {
    name: 'Starter',
    price: '₹299',
    period: '/month',
    features: ['Build 1 AI Resume', '10 Auto-Applies/day', 'Basic Tracking'],
    recommended: false
  },
  {
    name: 'Pro',
    price: '₹599',
    period: '/month',
    features: ['Unlimited AI Resumes', '50 Auto-Applies/day', 'WhatsApp Alerts', 'Priority Support'],
    recommended: true
  },
  {
    name: 'Elite',
    price: '₹999',
    period: '/month',
    features: ['Unlimited Everything', 'Dedicated Career Coach', 'Recruiter Direct Access'],
    recommended: false
  }
];

export const INITIAL_RESUME_STATE = {
  fullName: '',
  email: '',
  phone: '',
  summary: '',
  skills: '',
  experience: [{ role: '', company: '', duration: '', details: '' }],
  education: [{ degree: '', school: '', year: '' }]
};
