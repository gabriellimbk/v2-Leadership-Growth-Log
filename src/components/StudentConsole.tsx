import { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { notificationService } from '../services/notificationService';
import { FormConfig, Submission, TeacherEntry } from '../types';
import { useAuth } from '../contexts/AuthContext';
import StudentLogin from './StudentLogin';
import { motion } from 'motion/react';
import { Save, RefreshCcw, MessageSquare } from 'lucide-react';
import { getTeacherEmailByName } from '../config/teachers';

interface StudentConsoleProps {
  config: FormConfig;
  teachers: TeacherEntry[];
}

function isSectionEnabled(section: { enabled?: boolean }) {
  return section.enabled !== false;
}

function getSection2HeaderText(config: FormConfig['section2'], rowIndex: number, columnIndex: number) {
  return config.headerRows?.[rowIndex]?.[columnIndex] || 'placeholder';
}

function getPracticeScoreKey(index: number) {
  return `practice-${index}`;
}

const SECTION1_PLACEHOLDER_QUESTION_KEY = '__placeholder-question';

function getPracticeScore(section3Answers: Submission['answers']['section3'], practice: string, index: number) {
  return section3Answers[getPracticeScoreKey(index)] ?? section3Answers[practice] ?? 3;
}

export default function StudentConsole({ config, teachers }: StudentConsoleProps) {
  const { studentUser, studentLoading } = useAuth();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [answers, setAnswers] = useState<Submission['answers']>({
    section1: {},
    section2: {},
    section3: {},
    section4: [],
    section5: '',
    section6: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);

  // First-time setup
  const [setupDone, setSetupDone] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [setupSaving, setSetupSaving] = useState(false);

  const studentName =
    studentUser?.displayName?.trim() ||
    studentUser?.email?.split('@')[0] ||
    '';

  useEffect(() => {
    if (!studentUser) return;
    setDataLoading(true);
    storageService.getSubmissionByUid(studentUser.uid).then(existing => {
      if (existing) {
        setSubmission(existing);
        setAnswers(existing.answers);
        setSetupDone(true);
      }
      setDataLoading(false);
    });
  }, [studentUser]);

  if (studentLoading || dataLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-100">
        <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest animate-pulse">
          Loading...
        </div>
      </div>
    );
  }

  if (!studentUser) {
    return <StudentLogin />;
  }

  if (!setupDone) {
    return (
      <div className="h-full flex items-center justify-center p-6 bg-slate-100">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm bg-white border border-slate-200 rounded-md p-8 shadow-sm"
        >
          <div className="mb-6 text-center">
            <h2 className="text-sm font-black uppercase tracking-tight text-slate-800 italic">
              Select <span className="text-[#004d33]">Mentor</span>
            </h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
              {studentUser.email}
            </p>
          </div>
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-600">Assigned Mentor</label>
              <select
                value={selectedTeacher}
                onChange={e => setSelectedTeacher(e.target.value)}
                className="text-[11px] border border-slate-200 rounded p-2 px-3 w-full bg-slate-50 focus:bg-white focus:ring-1 focus:ring-indigo-500 transition-all outline-none"
              >
                <option value="">— Select mentor —</option>
                {teachers.map(t => (
                  <option key={t.id} value={t.name}>{t.name}</option>
                ))}
              </select>
            </div>
            <button
              onClick={async () => {
                if (!selectedTeacher) return;
                const freshAnswers: Submission['answers'] = {
                  section1: {},
                  section2: {},
                  section3: {},
                  section4: config.section4.questions.map(() => ''),
                  section5: '',
                  section6: ''
                };
                const newSub: Submission = {
                  studentUid: studentUser.uid,
                  studentEmail: studentUser.email!,
                  studentName,
                  teacherId: selectedTeacher,
                  answers: freshAnswers,
                  comments: {},
                  status: 'draft',
                  updatedAt: new Date().toISOString()
                };
                setSetupSaving(true);
                const saved = await storageService.saveSubmission(newSub);
                setSubmission(saved);
                setAnswers(freshAnswers);
                setSetupDone(true);
                setSetupSaving(false);
              }}
              disabled={!selectedTeacher || setupSaving}
              className="w-full py-2.5 bg-indigo-600 text-white rounded font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none mt-2"
            >
              {setupSaving ? 'Setting up...' : 'Initialize Log'}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const handleSave = async () => {
    if (!submission) return;
    setIsSaving(true);
    try {
      const updatedSub: Submission = { ...submission, answers, status: 'submitted' };
      const saved = await storageService.saveSubmission(updatedSub);
      setSubmission(saved);
      const teacherEmail = getTeacherEmailByName(saved.teacherId, teachers);
      if (teacherEmail) {
        notificationService.notifyTeacherOfStudentSubmission(saved, teacherEmail).catch(error => {
          console.error('Failed to send teacher notification:', error);
        });
      } else {
        console.warn(`No teacher email found for ${saved.teacherId}; notification skipped.`);
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="h-full flex overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 bg-[#1a1a1a] border-r border-slate-800 p-5 space-y-6 shrink-0 flex flex-col overflow-y-auto text-white">
        <section>
          <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Leadership Log</label>
          <div className="bg-white/5 border border-white/5 rounded p-3 mt-2 shadow-inner">
            <div className="text-sm font-black uppercase text-white truncate">{submission?.studentName}</div>
            <div className="text-xs text-emerald-400 font-black uppercase mt-1 tracking-tight">{submission?.teacherId}</div>
            <div className="text-xs text-slate-400 mt-1 truncate">{studentUser.email}</div>
          </div>
        </section>

        <section>
          <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Submission Status</label>
          <div className="bg-white/5 border border-white/5 rounded p-3 mt-2 space-y-3 shadow-inner">
            <div className="flex justify-between items-center">
              <span className={`text-xs font-black uppercase ${submission?.status === 'reviewed' ? 'text-emerald-400' : 'text-amber-400'}`}>
                {submission?.status || 'Draft'}
              </span>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
            </div>
            <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
              <div className="bg-emerald-400 h-full w-[100%]"></div>
            </div>
          </div>
        </section>

        <div className="flex-grow"></div>

        <section className="pt-4 border-t border-slate-700">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full py-3 bg-[#004d33] text-white rounded text-xs font-black uppercase tracking-widest hover:bg-[#003d29] shadow-md transition-all flex items-center justify-center gap-2"
          >
            {isSaving ? <RefreshCcw className="animate-spin" size={13} /> : <Save size={13} />}
            SAVE LOG
          </button>
        </section>
      </aside>

      {/* Main Content — full width */}
      <main className="flex-1 p-6 overflow-y-auto bg-slate-100">
        <div className="max-w-5xl mx-auto flex flex-col space-y-4">

          {/* Section 1 */}
          {isSectionEnabled(config.section1) && (
          <div className="bg-white border border-slate-200 rounded-md p-5 shadow-sm">
            <h2 className="text-[12px] font-black text-slate-800 border-l-4 border-[#004d33] pl-3 mb-2 uppercase tracking-widest">
              {config.section1.title}
            </h2>
            <p className="text-[10px] text-slate-400 font-bold mb-6 italic leading-snug px-3 border-l-4 border-transparent">
              {config.section1.description}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-0 mb-4 border border-[#004d33]/20 rounded-md overflow-hidden">
              {config.section1.columns.map((col, idx) => (
                <div key={idx} className="flex flex-col border-r last:border-r-0 border-[#004d33]/20">
                  <div className="bg-[#004d33] text-white p-2.5 text-center">
                    <label className="text-[12px] font-black uppercase tracking-widest leading-none">{col}</label>
                  </div>
                  <textarea
                    value={answers.section1[col] || ''}
                    onChange={e => setAnswers({ ...answers, section1: { ...answers.section1, [col]: e.target.value } })}
                    className="text-[11px] bg-white text-[#004d33] p-3 h-32 w-full resize-none transition-all outline-none leading-relaxed font-bold placeholder:text-slate-200"
                    placeholder="Strength details..."
                  />
                </div>
              ))}
            </div>
            <div className="space-y-2 px-3">
              <label htmlFor="section1-placeholder-answer" className="block text-[11px] font-black text-slate-700">
                {config.section1.question}
              </label>
              <textarea
                id="section1-placeholder-answer"
                value={answers.section1[SECTION1_PLACEHOLDER_QUESTION_KEY] || ''}
                onChange={e => setAnswers({
                  ...answers,
                  section1: {
                    ...answers.section1,
                    [SECTION1_PLACEHOLDER_QUESTION_KEY]: e.target.value
                  }
                })}
                className="text-[11px] bg-white text-[#004d33] p-3 min-h-24 w-full resize-y rounded-md border border-slate-200 transition-all outline-none leading-relaxed font-bold placeholder:text-slate-300 focus:border-[#004d33] focus:ring-1 focus:ring-[#004d33]/20"
                placeholder="Type your answer..."
              />
            </div>
            {submission?.comments?.section1 && (
              <div className="mt-4 p-4 bg-amber-50 border border-amber-100 rounded-md flex gap-4 items-start shadow-sm">
                <div className="p-1.5 bg-white rounded-md text-amber-500 shrink-0 shadow-sm border border-amber-50">
                  <MessageSquare size={14} />
                </div>
                <div>
                  <div className="text-[9px] font-black text-amber-800 uppercase tracking-widest mb-1.5 opacity-60">Mentor Perspectives</div>
                  <p className="text-[11px] text-amber-900 font-medium italic leading-relaxed">{submission.comments.section1}</p>
                </div>
              </div>
            )}
          </div>
          )}

          {/* Section 2 */}
          {isSectionEnabled(config.section2) && (
          <div className="bg-white border border-slate-200 rounded-md p-5 shadow-sm">
            <h2 className="text-[12px] font-black text-slate-800 border-l-4 border-[#004d33] pl-3 mb-2 uppercase tracking-widest">
              {config.section2.title}
            </h2>
            <p className="text-[10px] text-slate-400 font-bold mb-6 italic leading-snug px-3 border-l-4 border-transparent">
              {config.section2.description}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-5 md:[grid-template-rows:auto_auto_auto_auto] gap-0 mb-4 border border-[#004d33]/20 rounded-md overflow-hidden">
              {config.section2.columns.map((col, idx) => (
                <div key={idx} className="flex flex-col md:grid md:[grid-template-rows:subgrid] md:row-span-4 border-r last:border-r-0 border-[#004d33]/20">
                  <div className="bg-[#004d33] text-white text-center p-2.5 flex items-center justify-center border-b border-white/15">
                    <label className="text-[11px] font-black uppercase tracking-tight leading-relaxed break-words">{col}</label>
                  </div>
                  <div className="bg-[#004d33] text-white text-center p-2.5 flex items-center justify-center border-b border-white/15">
                    <p className="text-[11px] font-normal normal-case tracking-normal leading-relaxed break-words">
                      {getSection2HeaderText(config.section2, 0, idx)}
                    </p>
                  </div>
                  <div className="bg-[#004d33] text-white text-center p-2.5 flex items-center justify-center">
                    <p className="text-[11px] font-normal normal-case tracking-normal leading-relaxed break-words">
                      {getSection2HeaderText(config.section2, 1, idx)}
                    </p>
                  </div>
                  <textarea
                    value={answers.section2[col] || ''}
                    onChange={e => setAnswers({ ...answers, section2: { ...answers.section2, [col]: e.target.value } })}
                    className="text-[11px] bg-white text-[#1a1a1a] p-3 h-40 w-full resize-none transition-all outline-none leading-relaxed font-bold placeholder:text-slate-200"
                    placeholder="Practice actions..."
                  />
                </div>
              ))}
            </div>
            {submission?.comments?.section2 && (
              <div className="mt-4 p-4 bg-amber-50 border border-amber-100 rounded-md flex gap-4 items-start shadow-sm">
                <div className="p-1.5 bg-white rounded-md text-amber-500 shrink-0 shadow-sm border border-amber-50">
                  <MessageSquare size={14} />
                </div>
                <div>
                  <div className="text-[9px] font-black text-amber-800 uppercase tracking-widest mb-1.5 opacity-60">Pedagogical Feedback</div>
                  <p className="text-[11px] text-amber-900 font-medium italic leading-relaxed">{submission.comments.section2}</p>
                </div>
              </div>
            )}
          </div>
          )}

          {/* Section 3 */}
          {isSectionEnabled(config.section3) && (
          <div className="bg-white border border-slate-200 rounded-md p-5 shadow-sm">
            <h2 className="text-[12px] font-black text-slate-800 border-l-4 border-[#004d33] pl-3 mb-2 uppercase tracking-widest">
              {config.section3.title}
            </h2>
            <p className="text-[10px] text-slate-400 font-bold mb-6 italic leading-snug px-3 border-l-4 border-transparent">
              {config.section3.description}
            </p>
            <div className="space-y-6">
              {config.section3.practices.map((practice, idx) => {
                const scoreKey = getPracticeScoreKey(idx);
                const score = getPracticeScore(answers.section3, practice, idx);
                return (
                  <div key={scoreKey} className="space-y-2">
                    <div className="flex justify-between items-center px-1">
                      <label className="text-[13px] font-black text-slate-500 tracking-tight">{practice}</label>
                      <span className="text-[11px] font-black text-[#004d33] bg-[#004d33]/5 px-2 py-0.5 rounded border border-[#004d33]/10">
                        {score.toFixed(0)} / 5
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] font-black text-slate-300 uppercase">Beginner</span>
                      <input
                        type="range"
                        min="1"
                        max="5"
                        step="1"
                        value={score}
                        onChange={e => setAnswers({ ...answers, section3: { ...answers.section3, [scoreKey]: parseInt(e.target.value) } })}
                        className="flex-grow h-1.5 bg-slate-100 rounded-full appearance-none cursor-pointer accent-[#004d33]"
                      />
                      <span className="text-[11px] font-black text-[#004d33] uppercase">Mastery</span>
                    </div>
                  </div>
                );
              })}
            </div>
            {submission?.comments?.section3 && (
              <div className="mt-6 p-4 bg-amber-50 border border-amber-100 rounded-md flex gap-4 items-start shadow-sm">
                <div className="p-1.5 bg-white rounded-md text-amber-500 shrink-0 shadow-sm border border-amber-50">
                  <MessageSquare size={14} />
                </div>
                <div>
                  <div className="text-[9px] font-black text-amber-800 uppercase tracking-widest mb-1.5 opacity-60">Mentor Diagnostic</div>
                  <p className="text-[11px] text-amber-900 font-medium italic leading-relaxed">{submission.comments.section3}</p>
                </div>
              </div>
            )}
          </div>
          )}

          {/* Section 4 */}
          {isSectionEnabled(config.section4) && (
          <div className="bg-white border border-slate-200 rounded-md p-5 shadow-sm">
            <h2 className="text-[12px] font-black text-slate-800 border-l-4 border-[#004d33] pl-3 mb-2 uppercase tracking-widest">
              {config.section4.title}
            </h2>
            {config.section4.description && (
              <p className="text-[10px] text-slate-400 font-bold mb-6 italic leading-snug px-3 border-l-4 border-transparent">
                {config.section4.description}
              </p>
            )}
            <div className="space-y-10 max-h-[500px] overflow-y-auto pr-2">
              {config.section4.questions.map((q, idx) => (
                <div key={idx} className="space-y-4">
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-[#1a1a1a] text-white flex items-center justify-center shrink-0 text-[11px] font-black shadow-md border-2 border-white">
                      {idx + 1}
                    </div>
                    <div className="flex-grow space-y-4 text-left">
                      <label className="text-[11px] font-bold text-slate-600 italic block leading-relaxed pr-8">{q}</label>
                      <textarea
                        value={answers.section4[idx] || ''}
                        onChange={e => {
                          const newQs = [...answers.section4];
                          newQs[idx] = e.target.value;
                          setAnswers({ ...answers, section4: newQs });
                        }}
                        className="w-full text-[12px] border border-slate-200 rounded-md p-4 min-h-[140px] focus:bg-white bg-slate-50/50 transition-all outline-none leading-relaxed font-medium focus:ring-2 focus:ring-[#004d33]/20"
                        placeholder="Type your structured reflection here..."
                      />
                      {submission?.comments?.section4?.[idx] && (
                        <div className="p-4 bg-amber-50 border border-amber-100 rounded-r-md rounded-bl-md flex gap-3.5 items-start shadow-sm border-l-4 border-l-amber-400">
                          <div className="p-1.5 bg-white rounded text-amber-500 shrink-0 border border-amber-50 shadow-sm">
                            <MessageSquare size={12} />
                          </div>
                          <div>
                            <div className="text-[8px] font-black text-amber-800 uppercase tracking-widest leading-none mb-1.5 opacity-50">Mentor Insight on Q{idx + 1}</div>
                            <p className="text-[11px] text-amber-900 font-medium italic leading-relaxed">{submission.comments.section4[idx]}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          )}

          {/* Section 5 */}
          {isSectionEnabled(config.section5) && (
          <div className="bg-white border border-slate-200 rounded-md p-5 shadow-sm">
            <h2 className="text-[12px] font-black text-slate-800 border-l-4 border-[#004d33] pl-3 mb-2 uppercase tracking-widest">
              {config.section5.title}
            </h2>
            <div className="space-y-4">
              <label className="text-[11px] font-bold text-slate-600 italic block leading-relaxed pr-8">{config.section5.question}</label>
              <textarea
                value={answers.section5 || ''}
                onChange={e => setAnswers({ ...answers, section5: e.target.value })}
                className="w-full text-[12px] border border-slate-200 rounded-md p-4 min-h-[140px] focus:bg-white bg-slate-50/50 transition-all outline-none leading-relaxed font-medium focus:ring-2 focus:ring-[#004d33]/20"
                placeholder="Type your response here..."
              />
              {submission?.comments?.section5 && (
                <div className="p-4 bg-amber-50 border border-amber-100 rounded-r-md rounded-bl-md flex gap-3.5 items-start shadow-sm border-l-4 border-l-amber-400">
                  <div className="p-1.5 bg-white rounded text-amber-500 shrink-0 border border-amber-50 shadow-sm">
                    <MessageSquare size={12} />
                  </div>
                  <div>
                    <div className="text-[8px] font-black text-amber-800 uppercase tracking-widest leading-none mb-1.5 opacity-50">Mentor Insight</div>
                    <p className="text-[11px] text-amber-900 font-medium italic leading-relaxed">{submission.comments.section5}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
          )}

          {/* Section 6 */}
          {isSectionEnabled(config.section6) && (
          <div className="bg-white border border-slate-200 rounded-md p-5 shadow-sm">
            <h2 className="text-[12px] font-black text-slate-800 border-l-4 border-[#004d33] pl-3 mb-2 uppercase tracking-widest">
              {config.section6.title}
            </h2>
            <div className="space-y-4">
              <label className="text-[11px] font-bold text-slate-600 italic block leading-relaxed pr-8">{config.section6.question}</label>
              <textarea
                value={answers.section6 || ''}
                onChange={e => setAnswers({ ...answers, section6: e.target.value })}
                className="w-full text-[12px] border border-slate-200 rounded-md p-4 min-h-[140px] focus:bg-white bg-slate-50/50 transition-all outline-none leading-relaxed font-medium focus:ring-2 focus:ring-[#004d33]/20"
                placeholder="Type your response here..."
              />
              {submission?.comments?.section6 && (
                <div className="p-4 bg-amber-50 border border-amber-100 rounded-r-md rounded-bl-md flex gap-3.5 items-start shadow-sm border-l-4 border-l-amber-400">
                  <div className="p-1.5 bg-white rounded text-amber-500 shrink-0 border border-amber-50 shadow-sm">
                    <MessageSquare size={12} />
                  </div>
                  <div>
                    <div className="text-[8px] font-black text-amber-800 uppercase tracking-widest leading-none mb-1.5 opacity-50">Mentor Insight</div>
                    <p className="text-[11px] text-amber-900 font-medium italic leading-relaxed">{submission.comments.section6}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
          )}

        </div>
      </main>
    </div>
  );
}
