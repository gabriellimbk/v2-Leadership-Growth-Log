import { supabase } from '../supabase';
import { FormConfig, Submission } from '../types';

const DEFAULT_CONFIG: FormConfig = {
  id: 'default',
  title: "PA CCA Student Growth Log – Goal Setting",
  section1: {
    title: "SECTION 1: WHO I AM",
    description: "Start with your report. Under each domain, insert in your top 5 strengths where relevant.",
    columns: ["Executing", "Influence", "Relationship Building", "Strategic Thinking"]
  },
  section2: {
    title: "SECTION 2: WHAT LEADERS DO",
    description: "The table below shows the 5 Leadership Practices of The Student Leadership Challenge. In the table below, fill in what you think a student leader can do to bring out each of these Leadership Practices?",
    columns: ["Model The Way", "Inspire A Shared Vision", "Challenge The Process", "Encourage The Heart", "Enable Others To Act"]
  },
  section3: {
    title: "SECTION 3: WHERE AM I NOW?",
    description: "How frequently do you engage in behaviours and actions under each Leadership Practice? (1-Rarely/Seldom 2-Once in a While 3-Sometimes 4-Often 5-Very Frequently)",
    practices: ["MODEL THE WAY", "INSPIRE A SHARED VISION", "CHALLENGE THE PROCESS", "ENCOURAGE THE HEART", "ENABLE OTHERS TO ACT"]
  },
  section4: {
    title: "SECTION 4: THE LEADER I WANT TO BE",
    questions: [
      "Choose one Student Leadership Practice you want to improve on?",
      "What would your teammates see you doing if you improved in this area?",
      "Which strength can help you do this? How?",
      "What is 1 action you are committed to doing?"
    ]
  }
};

function rowToSubmission(row: any): Submission {
  return {
    id: row.id,
    studentUid: row.student_uid,
    studentEmail: row.student_email,
    studentName: row.student_name,
    teacherId: row.teacher_id,
    answers: row.answers ?? { section1: {}, section2: {}, section3: {}, section4: [] },
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
    return data?.config ?? DEFAULT_CONFIG;
  },

  saveConfig: async (config: FormConfig): Promise<void> => {
    await supabase.from('form_config').upsert({
      id: 'default',
      config,
      updated_at: new Date().toISOString()
    });
  },

  getSubmissions: async (): Promise<Submission[]> => {
    const { data } = await supabase
      .from('leadership_growth_log')
      .select('*')
      .order('updated_at', { ascending: false });
    return (data ?? []).map(rowToSubmission);
  },

  getSubmissionByUid: async (uid: string): Promise<Submission | null> => {
    const { data } = await supabase
      .from('leadership_growth_log')
      .select('*')
      .eq('student_uid', uid)
      .maybeSingle();
    return data ? rowToSubmission(data) : null;
  },

  saveSubmission: async (submission: Submission): Promise<Submission> => {
    const { data, error } = await supabase
      .from('leadership_growth_log')
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
};
