export interface FormConfig {
  id: string;
  title: string;
  section1: {
    enabled?: boolean;
    title: string;
    description: string;
    question: string;
    columns: string[];
    tableQuestion: string;
    tableHeaders: string[];
  };
  section2: {
    enabled?: boolean;
    title: string;
    description: string;
    columns: string[];
    headerRows?: string[][];
  };
  section3: {
    enabled?: boolean;
    title: string;
    description: string;
    practices: string[];
  };
  section4: {
    enabled?: boolean;
    title: string;
    description?: string;
    questions: string[];
  };
  section5: {
    enabled?: boolean;
    title: string;
    question: string;
  };
  section6: {
    enabled?: boolean;
    title: string;
    question: string;
  };
}

export interface Submission {
  id?: string;
  studentUid: string;
  studentEmail: string;
  studentName: string;
  teacherId: string;
  answers: {
    section1: Record<string, string>;
    section2: Record<string, string>;
    section3: Record<string, number>;
    section4: string[];
    section5: string;
    section6: string;
  };
  comments: {
    section1?: string;
    section2?: string;
    section3?: string;
    section4?: string[];
    section5?: string;
    section6?: string;
  };
  status: 'draft' | 'submitted' | 'reviewed';
  updatedAt: any;
}

export interface TeacherEntry {
  id: string;
  name: string;
  email: string;
}

export type ViewMode = 'student' | 'teacher' | 'admin' | 'landing';
