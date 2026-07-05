import { supabase } from '../supabase';
import { FormConfig, Submission, TeacherEntry } from '../types';

const SUBMISSIONS_TABLE = 'V2-LEADERSHIP-PROGRAMME-GROWTH-LOG';
const TEACHERS_TABLE = 'teachers';

const DEFAULT_CONFIG: FormConfig = {
  id: 'default',
  title: "PA CCA Student Growth Log – Goal Setting",
  section1: {
    enabled: true,
    title: "SECTION 1: WHO I AM",
    description: "Start with your report. Under each domain, insert in your top 5 strengths where relevant.",
    columns: ["Executing", "Influence", "Relationship Building", "Strategic Thinking"]
  },
  section2: {
    enabled: true,
    title: "SECTION 2: WHAT LEADERS DO",
    description: "The table below shows the 5 Leadership Practices of The Student Leadership Challenge. In the table below, fill in what you think a student leader can do to bring out each of these Leadership Practices?",
    columns: ["Model The Way", "Inspire A Shared Vision", "Challenge The Process", "Encourage The Heart", "Enable Others To Act"]
  },
  section3: {
    enabled: true,
    title: "SECTION 3: WHERE AM I NOW?",
    description: "How frequently do you engage in behaviours and actions under each Leadership Practice? (1-Rarely/Seldom 2-Once in a While 3-Sometimes 4-Often 5-Very Frequently)",
    practices: ["MODEL THE WAY", "INSPIRE A SHARED VISION", "CHALLENGE THE PROCESS", "ENCOURAGE THE HEART", "ENABLE OTHERS TO ACT"]
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
    question: "Placeholder question for Section 5."
  },
  section6: {
    enabled: true,
    title: "SECTION 6: PLACEHOLDER TITLE",
    question: "Placeholder question for Section 6."
  }
};

function normalizeConfig(config?: Partial<FormConfig> | null): FormConfig {
  const source = config ?? {};
  return {
    ...DEFAULT_CONFIG,
    ...source,
    section1: { ...DEFAULT_CONFIG.section1, ...source.section1, enabled: source.section1?.enabled ?? true },
    section2: { ...DEFAULT_CONFIG.section2, ...source.section2, enabled: source.section2?.enabled ?? true },
    section3: { ...DEFAULT_CONFIG.section3, ...source.section3, enabled: source.section3?.enabled ?? true },
    section4: { ...DEFAULT_CONFIG.section4, ...source.section4, enabled: source.section4?.enabled ?? true },
    section5: { ...DEFAULT_CONFIG.section5, ...source.section5, enabled: source.section5?.enabled ?? true },
    section6: { ...DEFAULT_CONFIG.section6, ...source.section6, enabled: source.section6?.enabled ?? true },
  };
}

function normalizeAnswers(answers: Partial<Submission['answers']> | null | undefined): Submission['answers'] {
  return {
    section1: answers?.section1 ?? {},
    section2: answers?.section2 ?? {},
    section3: answers?.section3 ?? {},
    section4: answers?.section4 ?? [],
    section5: answers?.section5 ?? '',
    section6: answers?.section6 ?? '',
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
    comments: row.comments ?? {},
    status: row.status,
    updatedAt: row.updated_at,
  };
}

export const storageService = {
  getConfig: async (): Promise<FormConfig> => {
    const { data } = await supabase
      .from('form_config')
      .select('config')
      .eq('id', 'default')
      .maybeSingle();
    return normalizeConfig(data?.config);
  },

  saveConfig: async (config: FormConfig): Promise<void> => {
    await supabase.from('form_config').upsert({
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
