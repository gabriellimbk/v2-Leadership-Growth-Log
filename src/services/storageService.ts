import { supabase } from '../supabase';
import { FormConfig, Submission, TeacherEntry } from '../types';

const SUBMISSIONS_TABLE = 'V2-LEADERSHIP-PROGRAMME-GROWTH-LOG';
const TEACHERS_TABLE = 'v2_teachers';
const FORM_CONFIG_TABLE = 'v2_form_config';

const DEFAULT_CONFIG: FormConfig = {
  id: 'default',
  sections1To4Title: "PLACEHOLDER TITLE",
  sections1To4TitleEnabled: true,
  afterSection4Title: "PLACEHOLDER TITLE",
  afterSection4TitleEnabled: true,
  title: "PA CCA Student Growth Log – Goal Setting",
  section1: {
    enabled: true,
    title: "SECTION 1: WHO I AM",
    description: "Start with your report. Under each domain, insert in your top 5 strengths where relevant.",
    question: "Placeholder question",
    columns: ["Executing", "Influence", "Relationship Building", "Strategic Thinking"],
    tableQuestion: "Placeholder question",
    tableHeaders: ["Placeholder", "Placeholder", "Placeholder"],
    tableInputPlaceholders: [
      ["Type your answer...", "Type your answer...", "Type your answer..."],
      ["Type your answer...", "Type your answer...", "Type your answer..."]
    ]
  },
  section2: {
    enabled: true,
    title: "SECTION 2: WHAT LEADERS DO",
    description: "The table below shows the 5 Leadership Practices of The Student Leadership Challenge. In the table below, fill in what you think a student leader can do to bring out each of these Leadership Practices?",
    columns: ["Model The Way", "Inspire A Shared Vision", "Challenge The Process", "Encourage The Heart", "Enable Others To Act"],
    headerRows: [
      ["placeholder", "placeholder", "placeholder", "placeholder", "placeholder"],
      ["placeholder", "placeholder", "placeholder", "placeholder", "placeholder"]
    ]
  },
  section3: {
    enabled: true,
    title: "SECTION 3: WHERE AM I NOW?",
    description: "How frequently do you engage in behaviours and actions under each Leadership Practice? (1-Rarely/Seldom 2-Once in a While 3-Sometimes 4-Often 5-Very Frequently)",
    practices: ["Model The Way", "Inspire A Shared Vision", "Challenge The Process", "Encourage The Heart", "Enable Others To Act"]
  },
  section4: {
    enabled: true,
    title: "SECTION 4: THE LEADER I WANT TO BE",
    questions: [
      "Choose one Student Leadership Practice you want to improve on?",
      "What would your teammates see you doing if you improved in this area?",
      "Which strength can help you do this? How?",
      "What is 1 action you are committed to doing?"
    ]
  },
  section5: {
    enabled: true,
    title: "SECTION 5: PLACEHOLDER TITLE",
    questions: [
      "Placeholder scale question for Section 5.",
      "Placeholder question 2 for Section 5.",
      "Placeholder question 3 for Section 5.",
      "Placeholder question 4 for Section 5.",
      "Placeholder question 5 for Section 5.",
      "Placeholder question 6 for Section 5."
    ]
  },
  section6: {
    enabled: true,
    title: "SECTION 6: PLACEHOLDER TITLE",
    questions: [
      "Placeholder question 1 for Section 6.",
      "Placeholder question 2 for Section 6.",
      "Placeholder question 3 for Section 6.",
      "Placeholder question 4 for Section 6.",
      "Placeholder question 5 for Section 6."
    ]
  }
};

function normalizeQuestions(
  questions: unknown,
  count: number,
  defaults: string[],
  legacyQuestion?: unknown,
  legacyQuestionIndex = 0,
): string[] {
  const source = Array.isArray(questions) ? questions : [];
  return Array.from({ length: count }, (_, index) => {
    const candidate = source[index];
    if (typeof candidate === 'string' && candidate.trim()) return candidate;
    if (index === legacyQuestionIndex && typeof legacyQuestion === 'string' && legacyQuestion.trim()) return legacyQuestion;
    return defaults[index];
  });
}

function normalizeHeaderRows(columns: string[], headerRows?: string[][]): string[][] {
  return [0, 1].map(rowIndex =>
    columns.map((_, columnIndex) => headerRows?.[rowIndex]?.[columnIndex] ?? 'placeholder')
  );
}

function normalizeConfig(config?: Partial<FormConfig> | null): FormConfig {
  const source = config ?? {};
  const legacySection5 = source.section5 as (Partial<FormConfig['section5']> & { question?: string }) | undefined;
  const legacySection6 = source.section6 as (Partial<FormConfig['section6']> & { question?: string }) | undefined;
  const hasUpgradedSection5 = Array.isArray(source.section5?.questions);
  const hasUpgradedSection6 = Array.isArray(source.section6?.questions);
  const section2 = {
    ...DEFAULT_CONFIG.section2,
    ...source.section2,
    enabled: source.section2?.enabled ?? true
  };
  section2.headerRows = normalizeHeaderRows(section2.columns, section2.headerRows);

  return {
    ...DEFAULT_CONFIG,
    ...source,
    section1: {
      ...DEFAULT_CONFIG.section1,
      ...source.section1,
      enabled: source.section1?.enabled ?? true,
      tableHeaders: [0, 1, 2].map(index => source.section1?.tableHeaders?.[index] ?? DEFAULT_CONFIG.section1.tableHeaders[index]),
      tableInputPlaceholders: [0, 1].map(rowIndex =>
        [0, 1, 2].map(columnIndex =>
          source.section1?.tableInputPlaceholders?.[rowIndex]?.[columnIndex]
          ?? DEFAULT_CONFIG.section1.tableInputPlaceholders[rowIndex][columnIndex]
        )
      )
    },
    section2,
    section3: { ...DEFAULT_CONFIG.section3, ...source.section3, enabled: source.section3?.enabled ?? true },
    section4: { ...DEFAULT_CONFIG.section4, ...source.section4, enabled: source.section4?.enabled ?? true },
    section5: {
      ...DEFAULT_CONFIG.section5,
      ...source.section5,
      enabled: hasUpgradedSection5 ? source.section5?.enabled ?? true : true,
      questions: normalizeQuestions(source.section5?.questions, 6, DEFAULT_CONFIG.section5.questions, legacySection5?.question, 1),
    },
    section6: {
      ...DEFAULT_CONFIG.section6,
      ...source.section6,
      enabled: hasUpgradedSection6 ? source.section6?.enabled ?? true : true,
      questions: normalizeQuestions(source.section6?.questions, 5, DEFAULT_CONFIG.section6.questions, legacySection6?.question),
    },
  };
}

function normalizeSection5Answers(value: unknown): Submission['answers']['section5'] {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const source = value as { rating?: unknown; responses?: unknown };
    const rawRating = typeof source.rating === 'number' ? source.rating : Number(source.rating);
    const rating = Number.isFinite(rawRating) ? Math.min(5, Math.max(1, Math.round(rawRating))) : 3;
    const responses = Array.isArray(source.responses) ? source.responses : [];
    return {
      rating,
      responses: Array.from({ length: 5 }, (_, index) => typeof responses[index] === 'string' ? responses[index] : ''),
    };
  }
  return { rating: 3, responses: [typeof value === 'string' ? value : '', '', '', '', ''] };
}

function normalizeSection6Answers(value: unknown): string[] {
  const responses = Array.isArray(value) ? value : [typeof value === 'string' ? value : ''];
  return Array.from({ length: 5 }, (_, index) => typeof responses[index] === 'string' ? responses[index] : '');
}

function normalizeAnswers(answers: Partial<Submission['answers']> | null | undefined): Submission['answers'] {
  return {
    section1: answers?.section1 ?? {},
    section2: answers?.section2 ?? {},
    section3: answers?.section3 ?? {},
    section4: answers?.section4 ?? [],
    section5: normalizeSection5Answers(answers?.section5),
    section6: normalizeSection6Answers(answers?.section6),
  };
}

function normalizeCommentArray(value: unknown, count: number, legacyCommentIndex = 0): string[] {
  if (Array.isArray(value)) {
    return Array.from({ length: count }, (_, index) => typeof value[index] === 'string' ? value[index] : '');
  }
  return Array.from({ length: count }, (_, index) => index === legacyCommentIndex && typeof value === 'string' ? value : '');
}

function normalizeComments(comments: unknown): Submission['comments'] {
  const source = comments && typeof comments === 'object' && !Array.isArray(comments)
    ? comments as Record<string, unknown>
    : {};
  return {
    section1: typeof source.section1 === 'string' ? source.section1 : undefined,
    section2: typeof source.section2 === 'string' ? source.section2 : undefined,
    section3: typeof source.section3 === 'string' ? source.section3 : undefined,
    section4: Array.isArray(source.section4) ? source.section4.map(comment => typeof comment === 'string' ? comment : '') : [],
    section5: normalizeCommentArray(source.section5, 6, 1),
    section6: normalizeCommentArray(source.section6, 5),
  };
}

function rowToSubmission(row: any): Submission {
  return {
    id: row.id,
    studentUid: row.student_uid,
    studentEmail: row.student_email,
    studentName: row.student_name,
    teacherId: row.teacher_id,
    answers: normalizeAnswers(row.answers),
    comments: normalizeComments(row.comments),
    status: row.status,
    updatedAt: row.updated_at,
  };
}

export const storageService = {
  getConfig: async (): Promise<FormConfig> => {
    const { data } = await supabase
      .from(FORM_CONFIG_TABLE)
      .select('config')
      .eq('id', 'default')
      .maybeSingle();
    return normalizeConfig(data?.config);
  },

  saveConfig: async (config: FormConfig): Promise<void> => {
    await supabase.from(FORM_CONFIG_TABLE).upsert({
      id: 'default',
      config: normalizeConfig(config),
      updated_at: new Date().toISOString()
    });
  },

  getSubmissions: async (): Promise<Submission[]> => {
    const { data } = await supabase
      .from(SUBMISSIONS_TABLE)
      .select('*')
      .order('updated_at', { ascending: false });
    return (data ?? []).map(rowToSubmission);
  },

  getSubmissionsByTeacher: async (teacherId: string): Promise<Submission[]> => {
    const { data } = await supabase
      .from(SUBMISSIONS_TABLE)
      .select('*')
      .eq('teacher_id', teacherId)
      .order('updated_at', { ascending: false });
    return (data ?? []).map(rowToSubmission);
  },

  getSubmissionByUid: async (uid: string): Promise<Submission | null> => {
    const { data } = await supabase
      .from(SUBMISSIONS_TABLE)
      .select('*')
      .eq('student_uid', uid)
      .maybeSingle();
    return data ? rowToSubmission(data) : null;
  },

  saveSubmission: async (submission: Submission): Promise<Submission> => {
    const { data, error } = await supabase
      .from(SUBMISSIONS_TABLE)
      .upsert({
        student_uid: submission.studentUid,
        student_email: submission.studentEmail,
        student_name: submission.studentName,
        teacher_id: submission.teacherId,
        answers: submission.answers,
        comments: submission.comments,
        status: submission.status,
        updated_at: new Date().toISOString()
      }, { onConflict: 'student_uid' })
      .select()
      .single();
    if (error) throw error;
    return rowToSubmission(data);
  },

  deleteSubmission: async (studentUid: string): Promise<void> => {
    const { error } = await supabase
      .from(SUBMISSIONS_TABLE)
      .delete()
      .eq('student_uid', studentUid);
    if (error) throw error;
  },

  deleteAllByTeacher: async (teacherId: string): Promise<void> => {
    const { error } = await supabase
      .from(SUBMISSIONS_TABLE)
      .delete()
      .eq('teacher_id', teacherId);
    if (error) throw error;
  },

  getTeachers: async (): Promise<TeacherEntry[]> => {
    const { data, error } = await supabase
      .from(TEACHERS_TABLE)
      .select('id, name, email')
      .order('name', { ascending: true });
    if (error) throw error;
    return (data ?? []) as TeacherEntry[];
  },

  addTeacher: async (name: string, email: string): Promise<TeacherEntry> => {
    const { data, error } = await supabase
      .from(TEACHERS_TABLE)
      .insert({ name: name.trim(), email: email.trim().toLowerCase() })
      .select('id, name, email')
      .single();
    if (error) throw error;
    return data as TeacherEntry;
  },

  updateTeacher: async (id: string, name: string, email: string): Promise<TeacherEntry> => {
    const { data, error } = await supabase
      .from(TEACHERS_TABLE)
      .update({ name: name.trim(), email: email.trim().toLowerCase() })
      .eq('id', id)
      .select('id, name, email')
      .single();
    if (error) throw error;
    return data as TeacherEntry;
  },

  deleteTeacher: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from(TEACHERS_TABLE)
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};
