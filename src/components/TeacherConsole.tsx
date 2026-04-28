import { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { FormConfig, Submission } from '../types';
import { useAuth } from '../contexts/AuthContext';
import TeacherLogin from './TeacherLogin';
import { motion, AnimatePresence } from 'motion/react';
import { Search, MessageSquare, Download, ChevronRight, Settings, RefreshCcw, Trash2, AlertTriangle } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const TEACHERS = ['Mr Ridzuan', 'Ms Veronica Chua'];

interface TeacherConsoleProps {
  config: FormConfig;
  onConfigUpdate: (config: FormConfig) => void;
}

type ConfirmAction =
  | { type: 'delete-one'; submission: Submission }
  | { type: 'delete-all'; teacher: string };

function ConfirmDialog({ action, onConfirm, onCancel }: {
  action: ConfirmAction;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const isDeleteAll = action.type === 'delete-all';
  const message = isDeleteAll
    ? `Delete ALL submissions tagged to ${action.teacher}? This cannot be undone.`
    : `Delete ${action.submission.studentName}'s submission? This cannot be undone.`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-lg shadow-2xl p-6 max-w-sm w-full mx-4 border border-slate-200"
      >
        <div className="flex items-start gap-3 mb-5">
          <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <AlertTriangle size={16} className="text-red-600" />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase text-slate-800 mb-1">Confirm Delete</h3>
            <p className="text-[11px] text-slate-500 leading-relaxed">{message}</p>
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-[10px] font-bold uppercase text-slate-500 hover:bg-slate-100 rounded transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-5 py-2 text-[10px] font-bold uppercase bg-red-600 text-white rounded hover:bg-red-700 transition-all shadow-sm"
          >
            Delete
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function TeacherConsole({ config, onConfigUpdate }: TeacherConsoleProps) {
  const { teacherSession, teacherLoading } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedSub, setSelectedSub] = useState<Submission | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTeacher, setFilterTeacher] = useState('');
  const [isEditingConfig, setIsEditingConfig] = useState(false);
  const [editableConfig, setEditableConfig] = useState<FormConfig>(config);
  const [isSaving, setIsSaving] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);

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

  const handleDeleteOne = async (sub: Submission) => {
    await storageService.deleteSubmission(sub.studentUid);
    setSubmissions(prev => prev.filter(s => s.studentUid !== sub.studentUid));
    if (selectedSub?.studentUid === sub.studentUid) setSelectedSub(null);
    setConfirmAction(null);
  };

  const handleDeleteAll = async (teacher: string) => {
    await storageService.deleteAllByTeacher(teacher);
    setSubmissions(prev => prev.filter(s => s.teacherId !== teacher));
    if (selectedSub?.teacherId === teacher) setSelectedSub(null);
    setConfirmAction(null);
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

  const filteredSubmissions = submissions.filter(s => {
    const matchesTeacher = !filterTeacher || s.teacherId === filterTeacher;
    const matchesSearch =
      s.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.studentEmail.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTeacher && matchesSearch;
  });

  return (
    <>
      {confirmAction && (
        <ConfirmDialog
          action={confirmAction}
          onConfirm={() => {
            if (confirmAction.type === 'delete-one') handleDeleteOne(confirmAction.submission);
            else handleDeleteAll(confirmAction.teacher);
          }}
          onCancel={() => setConfirmAction(null)}
        />
      )}

      <div className="h-full flex overflow-hidden bg-slate-100">
        {/* Sidebar */}
        <aside className="w-64 bg-[#1a1a1a] border-r border-[#27272a] p-4 space-y-3 shrink-0 flex flex-col overflow-hidden text-white">

          {/* Header row: title + settings gear */}
          <div className="flex justify-between items-center px-1">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Growth Log Queue</label>
            <button
              onClick={() => { setEditableConfig(config); setIsEditingConfig(!isEditingConfig); }}
              className={`p-1.5 rounded transition-all ${isEditingConfig ? 'bg-[#004d33] text-white shadow-lg' : 'hover:bg-white/5 text-slate-500'}`}
            >
              <Settings size={12} />
            </button>
          </div>

          {/* Teacher filter dropdown */}
          <select
            value={filterTeacher}
            onChange={e => { setFilterTeacher(e.target.value); setSelectedSub(null); }}
            className="w-full bg-white/5 border border-white/10 rounded text-[10px] font-bold text-white py-2 px-3 focus:ring-1 focus:ring-[#004d33] outline-none"
          >
            <option value="" className="text-black bg-white">All Teachers</option>
            {TEACHERS.map(t => (
              <option key={t} value={t} className="text-black bg-white">{t}</option>
            ))}
          </select>

          {/* Search */}
          <div className="relative flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30" size={12} />
            <input
              type="text"
              placeholder="Search students..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-white/5 border border-white/5 rounded text-[10px] focus:ring-1 focus:ring-[#004d33] outline-none text-white font-medium"
            />
          </div>

          {/* Delete All button — only shown when a teacher is selected */}
          {filterTeacher && (
            <button
              onClick={() => setConfirmAction({ type: 'delete-all', teacher: filterTeacher })}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded border border-red-900/40 bg-red-900/20 text-red-400 text-[9px] font-black uppercase tracking-widest hover:bg-red-900/40 transition-all"
            >
              <Trash2 size={10} /> Delete All ({filterTeacher})
            </button>
          )}

          {/* Submission list */}
          <div className="flex-grow space-y-1.5 overflow-y-auto pr-1">
            {dataLoading ? (
              <div className="text-[9px] text-slate-500 uppercase tracking-widest text-center pt-4 animate-pulse">Loading...</div>
            ) : filteredSubmissions.length === 0 ? (
              <div className="text-[9px] text-slate-600 uppercase tracking-widest text-center pt-4">No submissions</div>
            ) : filteredSubmissions.map(s => (
              <div
                key={s.studentUid}
                className={`w-full flex items-center justify-between p-3 rounded-md border transition-all text-left group ${
                  selectedSub?.studentUid === s.studentUid
                    ? 'border-[#004d33]/50 bg-[#004d33]/10 text-white shadow-inner'
                    : 'border-white/5 bg-white/5 text-slate-400 hover:border-slate-700 hover:bg-white/[0.07]'
                }`}
              >
                {/* Clickable area */}
                <button
                  onClick={() => setSelectedSub(s)}
                  className="flex-1 flex items-center justify-between text-left overflow-hidden"
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
                  <ChevronRight size={10} className={`shrink-0 mx-1 transition-transform ${selectedSub?.studentUid === s.studentUid ? 'translate-x-0.5 text-[#004d33]' : 'opacity-20'}`} />
                </button>

                {/* Delete button */}
                <button
                  onClick={e => { e.stopPropagation(); setConfirmAction({ type: 'delete-one', submission: s }); }}
                  className="shrink-0 p-1 rounded text-slate-600 hover:text-red-400 hover:bg-red-900/20 transition-all"
                  title="Delete submission"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            ))}
          </div>
        </aside>

        {/* Main area */}
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

                  {/* Section 1 */}
                  <div className="bg-white border border-slate-200 rounded-md p-6 shadow-sm space-y-4">
                    <label className="text-[10px] font-black text-rose-600 uppercase tracking-widest border-b border-slate-100 pb-2 block">Section 1: Who I Am</label>
                    <div className="space-y-1">
                      <label className="text-[8px] font-bold text-slate-400 uppercase">Instructions shown to students</label>
                      <textarea value={editableConfig.section1.description} onChange={e => setEditableConfig({ ...editableConfig, section1: { ...editableConfig.section1, description: e.target.value } })}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-[11px] resize-none h-16 focus:bg-white outline-none" />
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

                  {/* Section 2 */}
                  <div className="bg-white border border-slate-200 rounded-md p-6 shadow-sm space-y-4">
                    <label className="text-[10px] font-black text-orange-600 uppercase tracking-widest border-b border-slate-100 pb-2 block">Section 2: What Leaders Do</label>
                    <div className="space-y-1">
                      <label className="text-[8px] font-bold text-slate-400 uppercase">Instructions shown to students</label>
                      <textarea value={editableConfig.section2.description} onChange={e => setEditableConfig({ ...editableConfig, section2: { ...editableConfig.section2, description: e.target.value } })}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-[11px] resize-none h-16 focus:bg-white outline-none" />
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

                  {/* Section 3 */}
                  <div className="bg-white border border-slate-200 rounded-md p-6 shadow-sm space-y-4">
                    <label className="text-[10px] font-black text-teal-600 uppercase tracking-widest border-b border-slate-100 pb-2 block">Section 3: Where Am I Now?</label>
                    <div className="space-y-1">
                      <label className="text-[8px] font-bold text-slate-400 uppercase">Instructions shown to students</label>
                      <textarea value={editableConfig.section3.description} onChange={e => setEditableConfig({ ...editableConfig, section3: { ...editableConfig.section3, description: e.target.value } })}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-[11px] resize-none h-16 focus:bg-white outline-none" />
                    </div>
                  </div>

                  {/* Section 4 */}
                  <div className="bg-white border border-slate-200 rounded-md p-6 shadow-sm space-y-4">
                    <label className="text-[10px] font-black text-amber-600 uppercase tracking-widest border-b border-slate-100 pb-2 block">Section 4: The Leader I Want To Be</label>
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
                    <button id="export-btn" onClick={exportToPDF} className="p-2 border border-slate-200 rounded text-slate-500 hover:bg-slate-100 transition-all" title="Export PDF">
                      <Download size={14} />
                    </button>
                    <button
                      onClick={() => setConfirmAction({ type: 'delete-one', submission: selectedSub })}
                      className="p-2 border border-red-200 rounded text-red-400 hover:bg-red-50 transition-all"
                      title="Delete submission"
                    >
                      <Trash2 size={14} />
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
                      <h3 className="text-[14px] font-black text-slate-800 border-l-4 border-[#004d33] pl-3 mb-2 uppercase tracking-widest">{config.section1.title}</h3>
                      <p className="text-[12px] text-slate-400 font-bold mb-5 italic border-l-4 border-transparent px-3">{config.section1.description}</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-0 border border-[#004d33]/20 rounded-md overflow-hidden">
                        {config.section1.columns.map((col, idx) => (
                          <div key={idx} className="flex flex-col border-r last:border-r-0 border-[#004d33]/20">
                            <div className="bg-[#004d33] text-white p-2 text-center"><p className="text-[10px] font-black uppercase tracking-widest">{col}</p></div>
                            <div className="bg-white p-3 min-h-[80px]"><p className="text-[12px] font-bold leading-snug text-slate-800">{selectedSub.answers.section1[col] || '—'}</p></div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Section 2 */}
                    <div className="bg-white border border-slate-200 rounded-md p-5 shadow-sm">
                      <h3 className="text-[14px] font-black text-slate-800 border-l-4 border-[#004d33] pl-3 mb-2 uppercase tracking-widest">{config.section2.title}</h3>
                      <p className="text-[12px] text-slate-400 font-bold mb-5 italic border-l-4 border-transparent px-3">{config.section2.description}</p>
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-0 border border-[#004d33]/20 rounded-md overflow-hidden">
                        {config.section2.columns.map((col, idx) => (
                          <div key={idx} className="flex flex-col border-r last:border-r-0 border-[#004d33]/20">
                            <div className="bg-[#004d33] text-white p-2 text-center"><p className="text-[9px] font-black uppercase tracking-tight truncate">{col}</p></div>
                            <div className="bg-white p-3 min-h-[100px]"><p className="text-[12px] font-bold leading-snug text-slate-800">{selectedSub.answers.section2[col] || '—'}</p></div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Section 3 */}
                    <div className="bg-white border border-slate-200 rounded-md p-5 shadow-sm">
                      <h3 className="text-[14px] font-black text-slate-800 border-l-4 border-[#004d33] pl-3 mb-2 uppercase tracking-widest">{config.section3.title}</h3>
                      <p className="text-[12px] text-slate-400 font-bold mb-5 italic border-l-4 border-transparent px-3">{config.section3.description}</p>
                      <div className="space-y-4">
                        {config.section3.practices.map(practice => (
                          <div key={practice} className="flex items-center gap-3">
                            <p className="text-[11px] font-bold text-slate-500 uppercase w-40 shrink-0 truncate">{practice}</p>
                            <div className="flex-grow flex items-center gap-2">
                              <div className="flex-grow h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-amber-500" style={{ width: `${((selectedSub.answers.section3[practice] || 3) / 5) * 100}%` }} />
                              </div>
                              <span className="text-[12px] font-black text-amber-600 w-5">{selectedSub.answers.section3[practice] || 3}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Section 4 */}
                    <div className="bg-white border border-slate-200 rounded-md p-5 shadow-sm">
                      <h3 className="text-[14px] font-black text-slate-800 border-l-4 border-[#004d33] pl-3 mb-2 uppercase tracking-widest">{config.section4.title}</h3>
                      {config.section4.description && <p className="text-[12px] text-slate-400 font-bold mb-5 italic border-l-4 border-transparent px-3">{config.section4.description}</p>}
                      <div className="space-y-6">
                        {config.section4.questions.map((q, idx) => (
                          <div key={idx} className="border-b border-slate-100 pb-4 last:border-0">
                            <p className="text-[11px] font-bold text-slate-400 italic mb-2">Q{idx + 1}: {q}</p>
                            <div className="text-[13px] font-medium text-slate-800 leading-relaxed bg-slate-50 p-3 rounded">{selectedSub.answers.section4[idx] || '—'}</div>
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
                    <div className="flex-1 overflow-y-auto p-4 space-y-5">

                      {/* Section 1 feedback */}
                      <div className="space-y-2">
                        <div className="pb-1 border-b border-orange-200">
                          <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{config.section1.title}</p>
                          <p className="text-[9px] text-orange-400 font-bold uppercase tracking-widest mt-0.5">Mentor Feedback</p>
                        </div>
                        <textarea value={selectedSub.comments.section1 || ''} onChange={e => setSelectedSub({ ...selectedSub, comments: { ...selectedSub.comments, section1: e.target.value } })}
                          className="w-full text-[11px] p-3 bg-white border border-orange-100 rounded italic min-h-[80px] focus:ring-1 focus:ring-orange-500 outline-none" placeholder="Enter feedback for this section..." />
                      </div>

                      {/* Section 2 feedback */}
                      <div className="space-y-2">
                        <div className="pb-1 border-b border-orange-200">
                          <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{config.section2.title}</p>
                          <p className="text-[9px] text-orange-400 font-bold uppercase tracking-widest mt-0.5">Mentor Feedback</p>
                        </div>
                        <textarea value={selectedSub.comments.section2 || ''} onChange={e => setSelectedSub({ ...selectedSub, comments: { ...selectedSub.comments, section2: e.target.value } })}
                          className="w-full text-[11px] p-3 bg-white border border-orange-100 rounded italic min-h-[80px] focus:ring-1 focus:ring-orange-500 outline-none" placeholder="Enter feedback for this section..." />
                      </div>

                      {/* Section 3 feedback */}
                      <div className="space-y-2">
                        <div className="pb-1 border-b border-orange-200">
                          <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{config.section3.title}</p>
                          <p className="text-[9px] text-orange-400 font-bold uppercase tracking-widest mt-0.5">Mentor Feedback</p>
                        </div>
                        <textarea value={selectedSub.comments.section3 || ''} onChange={e => setSelectedSub({ ...selectedSub, comments: { ...selectedSub.comments, section3: e.target.value } })}
                          className="w-full text-[11px] p-3 bg-white border border-orange-100 rounded italic min-h-[80px] focus:ring-1 focus:ring-orange-500 outline-none" placeholder="Enter feedback for this section..." />
                      </div>

                      {/* Section 4 per-question feedback */}
                      <div className="space-y-4 pt-2 border-t border-orange-200">
                        <div className="pb-1 border-b border-orange-200">
                          <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{config.section4.title}</p>
                          <p className="text-[9px] text-orange-400 font-bold uppercase tracking-widest mt-0.5">Per-Question Feedback</p>
                        </div>
                        {config.section4.questions.map((q, idx) => (
                          <div key={idx} className="space-y-1">
                            <label className="text-[9px] font-black text-slate-600 uppercase">Q{idx + 1}: {q.length > 50 ? q.substring(0, 50) + '…' : q}</label>
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
              <motion.div
                key="blank-template"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full overflow-y-auto bg-slate-100"
              >
                <div className="p-6 max-w-5xl mx-auto flex flex-col space-y-4">

                  {/* Section 1 */}
                  <div className="bg-white border border-slate-200 rounded-md p-5 shadow-sm">
                    <h2 className="text-[14px] font-black text-slate-800 border-l-4 border-[#004d33] pl-3 mb-2 uppercase tracking-widest">
                      {config.section1.title}
                    </h2>
                    <p className="text-[12px] text-slate-400 font-bold mb-6 italic leading-snug px-3 border-l-4 border-transparent">
                      {config.section1.description}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-0 mb-4 border border-[#004d33]/20 rounded-md overflow-hidden">
                      {config.section1.columns.map((col, idx) => (
                        <div key={idx} className="flex flex-col border-r last:border-r-0 border-[#004d33]/20">
                          <div className="bg-[#004d33] text-white p-2.5 text-center">
                            <label className="text-[12px] font-black uppercase tracking-widest leading-none">{col}</label>
                          </div>
                          <textarea disabled
                            className="text-[11px] bg-white text-[#004d33] p-3 h-32 w-full resize-none outline-none leading-relaxed font-bold placeholder:text-slate-200 cursor-default"
                            placeholder="Strength details..."
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Section 2 */}
                  <div className="bg-white border border-slate-200 rounded-md p-5 shadow-sm">
                    <h2 className="text-[14px] font-black text-slate-800 border-l-4 border-[#004d33] pl-3 mb-2 uppercase tracking-widest">
                      {config.section2.title}
                    </h2>
                    <p className="text-[12px] text-slate-400 font-bold mb-6 italic leading-snug px-3 border-l-4 border-transparent">
                      {config.section2.description}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-0 mb-4 border border-[#004d33]/20 rounded-md overflow-hidden">
                      {config.section2.columns.map((col, idx) => (
                        <div key={idx} className="flex flex-col border-r last:border-r-0 border-[#004d33]/20">
                          <div className="bg-[#004d33] text-white p-2.5 text-center">
                            <label className="text-[11px] font-black uppercase tracking-tight leading-none">{col}</label>
                          </div>
                          <textarea disabled
                            className="text-[11px] bg-white text-[#1a1a1a] p-3 h-40 w-full resize-none outline-none leading-relaxed font-bold placeholder:text-slate-200 cursor-default"
                            placeholder="Practice actions..."
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Section 3 */}
                  <div className="bg-white border border-slate-200 rounded-md p-5 shadow-sm">
                    <h2 className="text-[14px] font-black text-slate-800 border-l-4 border-[#004d33] pl-3 mb-2 uppercase tracking-widest">
                      {config.section3.title}
                    </h2>
                    <p className="text-[12px] text-slate-400 font-bold mb-6 italic leading-snug px-3 border-l-4 border-transparent">
                      {config.section3.description}
                    </p>
                    <div className="space-y-6">
                      {config.section3.practices.map(practice => (
                        <div key={practice} className="space-y-2">
                          <div className="flex justify-between items-center px-1">
                            <label className="text-[13px] font-black text-slate-500 uppercase tracking-tight">{practice}</label>
                            <span className="text-[11px] font-black text-[#004d33] bg-[#004d33]/5 px-2 py-0.5 rounded border border-[#004d33]/10">— / 5</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-[11px] font-black text-slate-300 uppercase">Beginner</span>
                            <input type="range" min="1" max="5" step="1" defaultValue={3} disabled
                              className="flex-grow h-1.5 bg-slate-100 rounded-full appearance-none cursor-default accent-[#004d33] opacity-40"
                            />
                            <span className="text-[11px] font-black text-[#004d33] uppercase">Mastery</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Section 4 */}
                  <div className="bg-white border border-slate-200 rounded-md p-5 shadow-sm">
                    <h2 className="text-[14px] font-black text-slate-800 border-l-4 border-[#004d33] pl-3 mb-2 uppercase tracking-widest">
                      {config.section4.title}
                    </h2>
                    <div className="space-y-10 pr-2">
                      {config.section4.questions.map((q, idx) => (
                        <div key={idx} className="space-y-4">
                          <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-full bg-[#1a1a1a] text-white flex items-center justify-center shrink-0 text-[11px] font-black shadow-md border-2 border-white">
                              {idx + 1}
                            </div>
                            <div className="flex-grow space-y-4 text-left">
                              <label className="text-[11px] font-bold text-slate-600 italic block leading-relaxed pr-8">{q}</label>
                              <textarea disabled
                                className="w-full text-[12px] border border-slate-200 rounded-md p-4 min-h-[140px] bg-slate-50/50 outline-none leading-relaxed font-medium cursor-default"
                                placeholder="Type your structured reflection here..."
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </>
  );
}
