export interface FormConfig {
  id: string;
  title: string;
  section1: {
    title: string;
    description: string;
    columns: string[];
  };
  section2: {
    title: string;
    description: string;
    columns: string[];
  };
  section3: {
    title: string;
    description: string;
    practices: string[];
  };
  section4: {
    title: string;
    description?: string;
    questions: string[];
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
  };
  comments: {
    section1?: string;
    section2?: string;
    section3?: string;
    section4?: string[];
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
