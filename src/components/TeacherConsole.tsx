import { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { FormConfig, Submission } from '../types';
import { useAuth } from '../contexts/AuthContext';
import TeacherLogin from './TeacherLogin';
import { motion, AnimatePresence } from 'motion/react';
import { Search, MessageSquare, Download, ChevronRight, Settings, Save, RefreshCcw } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface TeacherConsoleProps {
  config: FormConfig;
  onConfigUpdate: (config: FormConfig) => void;
}

export default function TeacherConsole({ config, onConfigUpdate }: TeacherConsoleProps) {
  const { teacherSession, teacherLoading } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedSub, setSelectedSub] = useState<Submission | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditingConfig, setIsEditingConfig] = useState(false);
  const [editableConfig, setEditableConfig] = useState<FormConfig>(config);
  const [isSaving, setIsSaving] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);

  useEffect(() => {
    if (!teacherSession) return;
    setDataLoading(true);
    storageService.getSubmissions().then(data => {
      setSubmissions(data);
      setDataLoading(false);
    });
  }, [teacherSession]);

  const handleUpdateComments = async () => {
    if (!selectedSub) return;
    setIsSaving(true);
    try {
      const updatedSub: Submission = { ...selectedSub, status: 'reviewed' };
      const saved = await storageService.saveSubmission(updatedSub);
      setSubmissions(prev => prev.map(s => s.studentUid === saved.studentUid ? saved : s));
      setSelectedSub(saved);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateConfig = async () => {
    setIsSaving(true);
    try {
      await storageService.saveConfig(editableConfig);
      onConfigUpdate(editableConfig);
      setIsEditingConfig(false);
    } finally {
      setIsSaving(false);
    }
  };

  const exportToPDF = async () => {
    if (!selectedSub) return;
    const element = document.getElementById('report-to-pdf');
    if (!element) return;
    const btn = document.getElementById('export-btn');
    if (btn) btn.style.display = 'none';
    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${selectedSub.studentName}_Leadership_Growth_Log.pdf`);
    if (btn) btn.style.display = 'block';
  };

  if (teacherLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-100">
        <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!teacherSession) {
    return <TeacherLogin />;
  }

  const filteredSubmissions = submissions.filter(s =>
    s.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.teacherId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.studentEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full flex overflow-hidden bg-slate-100">
      <aside className="w-64 bg-[#1a1a1a] border-r border-[#27272a] p-4 space-y-4 shrink-0 flex flex-col overflow-hidden text-white">
        <div className="flex justify-between items-center px-1">
          <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Growth Log Queue</label>
          <button
            onClick={() => { setEditableConfig(config); setIsEditingConfig(!isEditingConfig); }}
            className={`p-1.5 rounded transition-all ${isEditingConfig ? 'bg-[#004d33] text-white shadow-lg' : 'hover:bg-white/5 text-slate-500'}`}
          >
            <Settings size={12} />
          </button>
        </div>

        <div className="relative flex-none">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30" size={12} />
          <input
            type="text"
            placeholder="Search candidates..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-2 bg-white/5 border border-white/5 rounded text-[10px] focus:ring-1 focus:ring-[#004d33] outline-none text-white font-medium"
          />
        </div>

        <div className="flex-grow space-y-1.5 overflow-y-auto pr-1">
          {dataLoading ? (
            <div className="text-[9px] text-slate-500 uppercase tracking-widest text-center pt-4 animate-pulse">Loading...</div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="text-[9px] text-slate-600 uppercase tracking-widest text-center pt-4">No submissions yet</div>
          ) : filteredSubmissions.map(s => (
            <button
              key={s.studentUid}
              onClick={() => setSelectedSub(s)}
              className={`w-full flex items-center justify-between p-3 rounded-md border transition-all text-left group ${
                selectedSub?.studentUid === s.studentUid
                  ? 'border-[#004d33]/50 bg-[#004d33]/10 text-white shadow-inner'
                  : 'border-white/5 bg-white/5 text-slate-400 hover:border-slate-700 hover:bg-white/[0.07]'
              }`}
            >
              <div className="overflow-hidden">
                <p className={`font-black text-[10px] uppercase truncate ${selectedSub?.studentUid === s.studentUid ? 'text-white' : 'text-slate-300'}`}>
                  {s.studentName}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <p className="text-[8px] font-bold opacity-40 uppercase tracking-tighter truncate">{s.teacherId}</p>
                  {s.status === 'reviewed' && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]"></div>}
                </div>
              </div>
              <ChevronRight size={10} className={`shrink-0 transition-transform ${selectedSub?.studentUid === s.studentUid ? 'translate-x-0.5 text-[#004d33]' : 'opacity-20'}`} />
            </button>
          ))}
        </div>
      </aside>

      <main className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {isEditingConfig ? (
            <motion.div
              key="config-editor"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-full p-6 flex flex-col space-y-6 overflow-hidden"
            >
              <div className="flex justify-between items-center bg-white border border-slate-200 p-4 rounded-md shadow-sm shrink-0">
                <div>
                  <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Framework Configuration</h2>
                  <p className="text-[12px] font-extrabold text-slate-800 italic mt-0.5">Deployment of leadership pedagogical parameters.</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button onClick={() => setIsEditingConfig(false)} className="px-4 py-2 rounded text-[10px] font-bold text-slate-500 hover:bg-slate-200 transition-all">Cancel</button>
                  <button onClick={handleUpdateConfig} disabled={isSaving} className="px-6 py-2 bg-[#004d33] text-white rounded text-[10px] font-bold uppercase tracking-widest shadow-md disabled:opacity-50 transition-all flex items-center gap-2">
                    {isSaving ? <><RefreshCcw size={10} className="animate-spin" /> Deploying...</> : 'Deploy Framework'}
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-8 pr-2">
                <div className="bg-white border border-slate-200 rounded-md p-6 shadow-sm space-y-4">
                  <label className="text-[9px] font-black text-[#004d33] uppercase tracking-widest border-b border-[#004d33]/10 pb-1 block">Master Log Identity</label>
                  <input type="text" value={editableConfig.title} onChange={e => setEditableConfig({ ...editableConfig, title: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded text-[14px] font-black italic focus:ring-1 focus:ring-[#004d33] outline-none" />
                </div>

                <div className="bg-white border border-slate-200 rounded-md p-6 shadow-sm space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <label className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Section 1: Data Architecture</label>
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {editableConfig.section1.columns.map((c, idx) => (
                      <div key={idx} className="space-y-1">
                        <label className="text-[8px] font-bold text-slate-400 uppercase">Column {idx + 1}</label>
                        <input type="text" value={c} onChange={e => {
                          const newCols = [...editableConfig.section1.columns];
                          newCols[idx] = e.target.value;
                          setEditableConfig({ ...editableConfig, section1: { ...editableConfig.section1, columns: newCols } });
                        }} className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-[10px] font-bold uppercase" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-md p-6 shadow-sm space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <label className="text-[10px] font-black text-orange-600 uppercase tracking-widest">Section 2: Practice Alignment</label>
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    {editableConfig.section2.columns.map((c, idx) => (
                      <div key={idx} className="space-y-1">
                        <label className="text-[8px] font-bold text-slate-400 uppercase">Practice {idx + 1}</label>
                        <input type="text" value={c} onChange={e => {
                          const newCols = [...editableConfig.section2.columns];
                          newCols[idx] = e.target.value;
                          const newPractices = [...editableConfig.section3.practices];
                          if (newPractices[idx] !== undefined) newPractices[idx] = e.target.value.toUpperCase();
                          setEditableConfig({
                            ...editableConfig,
                            section2: { ...editableConfig.section2, columns: newCols },
                            section3: { ...editableConfig.section3, practices: newPractices }
                          });
                        }} className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-[10px] font-bold uppercase" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-md p-6 shadow-sm space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <label className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Section 4: Reflection Inquiry</label>
                  </div>
                  <div className="space-y-4">
                    {editableConfig.section4.questions.map((q, idx) => (
                      <div key={idx} className="flex gap-4 items-start">
                        <div className="w-8 h-8 rounded bg-amber-600 text-white flex items-center justify-center text-[10px] font-black shrink-0 shadow-sm">{idx + 1}</div>
                        <textarea
                          value={q}
                          onChange={e => {
                            const newQs = [...editableConfig.section4.questions];
                            newQs[idx] = e.target.value;
                            setEditableConfig({ ...editableConfig, section4: { ...editableConfig.section4, questions: newQs } });
                          }}
                          className="flex-grow p-3 bg-slate-50 border border-slate-200 rounded text-[11px] leading-tight resize-none h-20 focus:bg-white transition-all outline-none"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ) : selectedSub ? (
            <motion.div
              key={`reviewer-${selectedSub.studentUid}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-full p-6 flex flex-col space-y-4 overflow-hidden"
            >
              <div className="flex justify-between items-center bg-white border border-slate-200 p-4 rounded-md shadow-sm shrink-0">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-[16px] font-black text-slate-800 uppercase tracking-tight italic">{selectedSub.studentName}</h2>
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${selectedSub.status === 'reviewed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                      {selectedSub.status}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                    {selectedSub.studentEmail} · {selectedSub.teacherId}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button id="export-btn" onClick={exportToPDF} className="p-2 border border-slate-200 rounded text-slate-500 hover:bg-slate-100 transition-all">
                    <Download size={14} />
                  </button>
                  <button onClick={handleUpdateComments} disabled={isSaving} className="px-6 py-2 bg-[#004d33] text-white rounded text-[10px] font-black uppercase tracking-widest shadow-md disabled:opacity-50 transition-all flex items-center gap-2">
                    {isSaving ? <><RefreshCcw size={10} className="animate-spin" /> Pushing...</> : 'Finalize Review'}
                  </button>
                </div>
              </div>

              <div className="flex-1 grid grid-cols-12 gap-6 overflow-hidden" id="report-to-pdf">
                <div className="col-span-12 lg:col-span-8 space-y-4 overflow-y-auto pr-2">
                  {/* Section 1 */}
                  <div className="bg-white border border-slate-200 rounded-md p-5 shadow-sm">
                    <h3 className="text-[12px] font-black text-slate-800 border-l-4 border-[#004d33] pl-3 mb-2 uppercase tracking-widest">{config.section1.title}</h3>
                    <p className="text-[10px] text-slate-400 font-bold mb-5 italic border-l-4 border-transparent px-3">{config.section1.description}</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-0 border border-[#004d33]/20 rounded-md overflow-hidden">
                      {config.section1.columns.map((col, idx) => (
                        <div key={idx} className="flex flex-col border-r last:border-r-0 border-[#004d33]/20">
                          <div className="bg-[#004d33] text-white p-2 text-center">
                            <p className="text-[8px] font-black uppercase tracking-widest">{col}</p>
                          </div>
                          <div className="bg-white p-3 min-h-[80px]">
                            <p className="text-[10px] font-bold leading-tight text-slate-800">{selectedSub.answers.section1[col] || '—'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Section 2 */}
                  <div className="bg-white border border-slate-200 rounded-md p-5 shadow-sm">
                    <h3 className="text-[12px] font-black text-slate-800 border-l-4 border-[#004d33] pl-3 mb-2 uppercase tracking-widest">{config.section2.title}</h3>
                    <p className="text-[10px] text-slate-400 font-bold mb-5 italic border-l-4 border-transparent px-3">{config.section2.description}</p>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-0 border border-[#004d33]/20 rounded-md overflow-hidden">
                      {config.section2.columns.map((col, idx) => (
                        <div key={idx} className="flex flex-col border-r last:border-r-0 border-[#004d33]/20">
                          <div className="bg-[#004d33] text-white p-2 text-center">
                            <p className="text-[7px] font-black uppercase tracking-tight truncate">{col}</p>
                          </div>
                          <div className="bg-white p-3 min-h-[100px]">
                            <p className="text-[10px] font-bold leading-tight text-slate-800">{selectedSub.answers.section2[col] || '—'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Section 3 */}
                  <div className="bg-white border border-slate-200 rounded-md p-5 shadow-sm">
                    <h3 className="text-[12px] font-black text-slate-800 border-l-4 border-[#004d33] pl-3 mb-2 uppercase tracking-widest">{config.section3.title}</h3>
                    <p className="text-[10px] text-slate-400 font-bold mb-5 italic border-l-4 border-transparent px-3">{config.section3.description}</p>
                    <div className="space-y-3">
                      {config.section3.practices.map(practice => (
                        <div key={practice} className="flex items-center gap-3">
                          <p className="text-[9px] font-bold text-slate-500 uppercase w-32 shrink-0 truncate">{practice}</p>
                          <div className="flex-grow flex items-center gap-2">
                            <div className="flex-grow h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-amber-500"
                                style={{ width: `${((selectedSub.answers.section3[practice] || 3) / 5) * 100}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-black text-amber-600 w-4">{selectedSub.answers.section3[practice] || 3}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Section 4 */}
                  <div className="bg-white border border-slate-200 rounded-md p-5 shadow-sm">
                    <h3 className="text-[12px] font-black text-slate-800 border-l-4 border-[#004d33] pl-3 mb-2 uppercase tracking-widest">{config.section4.title}</h3>
                    {config.section4.description && <p className="text-[10px] text-slate-400 font-bold mb-5 italic border-l-4 border-transparent px-3">{config.section4.description}</p>}
                    <div className="space-y-6">
                      {config.section4.questions.map((q, idx) => (
                        <div key={idx} className="border-b border-slate-100 pb-4 last:border-0">
                          <p className="text-[9px] font-bold text-slate-400 italic mb-2">Q{idx + 1}: {q}</p>
                          <div className="text-[11px] font-medium text-slate-800 leading-relaxed bg-slate-50 p-3 rounded">
                            {selectedSub.answers.section4[idx] || '—'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Feedback sidecar */}
                <div className="col-span-12 lg:col-span-4 bg-orange-50 border border-orange-100 rounded-md flex flex-col overflow-hidden shadow-sm">
                  <div className="p-4 border-b border-orange-200 bg-white/50 shrink-0">
                    <label className="text-[10px] font-black text-orange-800 uppercase tracking-[0.2em] flex items-center gap-2">
                      <MessageSquare size={12} /> Mentor Engine
                    </label>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-orange-400 uppercase tracking-widest italic">Perspective on Who I Am</label>
                      <textarea
                        value={selectedSub.comments.section1 || ''}
                        onChange={e => setSelectedSub({ ...selectedSub, comments: { ...selectedSub.comments, section1: e.target.value } })}
                        className="w-full text-[11px] p-3 bg-white border border-orange-100 rounded italic min-h-[80px] focus:ring-1 focus:ring-orange-500 outline-none"
                        placeholder="Mentor comments..."
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-orange-400 uppercase tracking-widest italic">Pedagogical Review</label>
                      <textarea
                        value={selectedSub.comments.section2 || ''}
                        onChange={e => setSelectedSub({ ...selectedSub, comments: { ...selectedSub.comments, section2: e.target.value } })}
                        className="w-full text-[11px] p-3 bg-white border border-orange-100 rounded italic min-h-[80px] focus:ring-1 focus:ring-orange-500 outline-none"
                        placeholder="Mentor comments..."
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-orange-400 uppercase tracking-widest italic">Diagnostic Assessment</label>
                      <textarea
                        value={selectedSub.comments.section3 || ''}
                        onChange={e => setSelectedSub({ ...selectedSub, comments: { ...selectedSub.comments, section3: e.target.value } })}
                        className="w-full text-[11px] p-3 bg-white border border-orange-100 rounded italic min-h-[80px] focus:ring-1 focus:ring-orange-500 outline-none"
                        placeholder="Mentor comments..."
                      />
                    </div>
                    <div className="space-y-4 pt-4 border-t border-orange-100">
                      <label className="text-[9px] font-black text-orange-400 uppercase tracking-widest mb-2 block">Direct Inquiry Feedback</label>
                      {config.section4.questions.map((q, idx) => (
                        <div key={idx} className="space-y-1">
                          <label className="text-[8px] font-black text-orange-300 uppercase">Q{idx + 1} Response Assessment</label>
                          <textarea
                            value={selectedSub.comments.section4?.[idx] || ''}
                            onChange={e => {
                              const newComments = [...(selectedSub.comments.section4 || config.section4.questions.map(() => ''))];
                              newComments[idx] = e.target.value;
                              setSelectedSub({ ...selectedSub, comments: { ...selectedSub.comments, section4: newComments } });
                            }}
                            className="w-full text-[10px] p-2 bg-white border border-orange-100 rounded italic min-h-[50px] focus:ring-1 focus:ring-orange-500 outline-none"
                            placeholder="Comment..."
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="h-full flex items-center justify-center p-12 opacity-20 bg-slate-50">
              <div className="text-center font-black uppercase tracking-[0.4em] text-slate-300">
                Select Log to Begin Review Cycle
              </div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
