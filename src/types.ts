export interface FormConfig {
  id: string;
  title: string;
  sections1To4Title: string;
  sections1To4TitleEnabled?: boolean;
  afterSection4Title: string;
  afterSection4TitleEnabled?: boolean;
  section1: {
    enabled?: boolean;
    title: string;
    description: string;
    question: string;
    columns: string[];
    tableQuestion: string;
    tableHeaders: string[];
    tableInputPlaceholders: string[][];
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
    questions: string[];
  };
  section6: {
    enabled?: boolean;
    title: string;
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
    section5: {
      rating: number;
      responses: string[];
    };
    section6: string[];
  };
  comments: {
    section1?: string;
    section2?: string;
    section3?: string;
    section4?: string[];
    section5?: string[];
    section6?: string[];
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
