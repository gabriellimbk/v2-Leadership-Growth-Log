import { useState } from 'react';
import { motion } from 'motion/react';
import { UserPlus, Pencil, Trash2, Check, X, AlertTriangle, RefreshCcw } from 'lucide-react';
import { TeacherEntry } from '../types';
import { storageService } from '../services/storageService';

interface Props {
  teachers: TeacherEntry[];
  onTeachersUpdate: (teachers: TeacherEntry[]) => void;
}

function isValidRiEmail(email: string) {
  return /^[^\s@]+@ri\.edu\.sg$/i.test(email.trim());
}

export default function AdminTeacherManagement({ teachers, onTeachersUpdate }: Props) {
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editError, setEditError] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<TeacherEntry | null>(null);
  const [deleting, setDeleting] = useState(false);

  const emailExists = (email: string, exceptId?: string) =>
    teachers.some(t => t.email.toLowerCase() === email.trim().toLowerCase() && t.id !== exceptId);

  const nameExists = (name: string, exceptId?: string) =>
    teachers.some(t => t.name.trim().toLowerCase() === name.trim().toLowerCase() && t.id !== exceptId);

  const handleAdd = async () => {
    setAddError('');
    const name = newName.trim();
    const email = newEmail.trim().toLowerCase();
    if (!name) { setAddError('Name is required.'); return; }
    if (!isValidRiEmail(email)) { setAddError('Email must end with @ri.edu.sg.'); return; }
    if (nameExists(name)) { setAddError('A teacher with this name already exists.'); return; }
    if (emailExists(email)) { setAddError('A teacher with this email already exists.'); return; }

    setAdding(true);
    try {
      const created = await storageService.addTeacher(name, email);
      onTeachersUpdate([...teachers, created].sort((a, b) => a.name.localeCompare(b.name)));
      setNewName('');
      setNewEmail('');
    } catch (err: any) {
      setAddError(err.message ?? 'Failed to add teacher.');
    } finally {
      setAdding(false);
    }
  };

  const beginEdit = (teacher: TeacherEntry) => {
    setEditingId(teacher.id);
    setEditName(teacher.name);
    setEditEmail(teacher.email);
    setEditError('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditEmail('');
    setEditError('');
  };

  const saveEdit = async () => {
    if (!editingId) return;
    setEditError('');
    const name = editName.trim();
    const email = editEmail.trim().toLowerCase();
    if (!name) { setEditError('Name is required.'); return; }
    if (!isValidRiEmail(email)) { setEditError('Email must end with @ri.edu.sg.'); return; }
    if (nameExists(name, editingId)) { setEditError('Another teacher already has this name.'); return; }
    if (emailExists(email, editingId)) { setEditError('Another teacher already has this email.'); return; }

    setEditSaving(true);
    try {
      const updated = await storageService.updateTeacher(editingId, name, email);
      onTeachersUpdate(
        teachers.map(t => (t.id === updated.id ? updated : t))
          .sort((a, b) => a.name.localeCompare(b.name))
      );
      cancelEdit();
    } catch (err: any) {
      setEditError(err.message ?? 'Failed to update teacher.');
    } finally {
      setEditSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await storageService.deleteTeacher(deleteTarget.id);
      onTeachersUpdate(teachers.filter(t => t.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err: any) {
      console.error('Failed to delete teacher:', err);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="h-full p-6 overflow-y-auto bg-slate-100">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Add new teacher */}
        <div className="bg-white border border-slate-200 rounded-md p-6 shadow-sm">
          <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">Add New Teacher</h2>
          <p className="text-[12px] font-extrabold text-slate-800 italic mb-5">
            New teachers become selectable mentors for students immediately.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_1.4fr_auto] gap-3 items-start">
            <div className="space-y-1">
              <label className="text-[9px] font-bold uppercase text-slate-500 tracking-widest">Display Name</label>
              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="Mr John Doe"
                className="w-full text-[11px] border border-slate-200 rounded p-2 px-3 bg-slate-50 focus:bg-white focus:ring-1 focus:ring-[#004d33] transition-all outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold uppercase text-slate-500 tracking-widest">Email</label>
              <input
                type="email"
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                placeholder="john.doe@ri.edu.sg"
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
                className="w-full text-[11px] border border-slate-200 rounded p-2 px-3 bg-slate-50 focus:bg-white focus:ring-1 focus:ring-[#004d33] transition-all outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold uppercase text-slate-500 tracking-widest opacity-0">.</label>
              <button
                onClick={handleAdd}
                disabled={adding || !newName.trim() || !newEmail.trim()}
                className="h-[34px] px-5 bg-[#004d33] text-white rounded text-[10px] font-black uppercase tracking-widest shadow-md hover:bg-[#003d29] active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none flex items-center gap-2"
              >
                {adding ? <RefreshCcw size={11} className="animate-spin" /> : <UserPlus size={11} />}
                Add
              </button>
            </div>
          </div>
          {addError && (
            <p className="text-[10px] text-red-600 font-bold bg-red-50 border border-red-100 rounded p-2 mt-3">
              {addError}
            </p>
          )}
        </div>

        {/* Existing teachers */}
        <div className="bg-white border border-slate-200 rounded-md p-6 shadow-sm">
          <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">
            Current Teachers ({teachers.length})
          </h2>
          <p className="text-[12px] font-extrabold text-slate-800 italic mb-5">
            Edit or remove teachers from the mentor directory.
          </p>

          {teachers.length === 0 ? (
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest text-center py-6">
              No teachers configured yet.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {teachers.map(teacher => {
                const isEditing = editingId === teacher.id;
                return (
                  <div key={teacher.id} className="py-3 first:pt-0 last:pb-0">
                    {isEditing ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <input
                            type="text"
                            value={editName}
                            onChange={e => setEditName(e.target.value)}
                            placeholder="Name"
                            className="w-full text-[11px] border border-slate-200 rounded p-2 px-3 bg-slate-50 focus:bg-white focus:ring-1 focus:ring-[#004d33] outline-none"
                          />
                          <input
                            type="email"
                            value={editEmail}
                            onChange={e => setEditEmail(e.target.value)}
                            placeholder="Email"
                            className="w-full text-[11px] border border-slate-200 rounded p-2 px-3 bg-slate-50 focus:bg-white focus:ring-1 focus:ring-[#004d33] outline-none"
                          />
                        </div>
                        {editError && (
                          <p className="text-[10px] text-red-600 font-bold bg-red-50 border border-red-100 rounded p-2">
                            {editError}
                          </p>
                        )}
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={cancelEdit}
                            disabled={editSaving}
                            className="px-3 py-1.5 text-[10px] font-bold uppercase text-slate-500 hover:bg-slate-100 rounded transition-all flex items-center gap-1.5"
                          >
                            <X size={11} /> Cancel
                          </button>
                          <button
                            onClick={saveEdit}
                            disabled={editSaving}
                            className="px-4 py-1.5 text-[10px] font-black uppercase bg-[#004d33] text-white rounded shadow-sm hover:bg-[#003d29] transition-all disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1.5"
                          >
                            {editSaving ? <RefreshCcw size={11} className="animate-spin" /> : <Check size={11} />}
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[12px] font-black text-slate-800 uppercase tracking-tight truncate">{teacher.name}</p>
                          <p className="text-[10px] text-slate-500 font-bold truncate">{teacher.email}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => beginEdit(teacher)}
                            className="p-2 rounded text-slate-400 hover:text-[#004d33] hover:bg-emerald-50 transition-all"
                            title="Edit teacher"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(teacher)}
                            className="p-2 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                            title="Delete teacher"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Delete confirmation */}
      {deleteTarget && (
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
                <h3 className="text-sm font-black uppercase text-slate-800 mb-1">Remove Teacher</h3>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Remove <strong>{deleteTarget.name}</strong> ({deleteTarget.email}) from the directory?
                  Existing submissions tagged to this teacher will remain but the teacher will no longer be selectable.
                </p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="px-4 py-2 text-[10px] font-bold uppercase text-slate-500 hover:bg-slate-100 rounded transition-all"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="px-5 py-2 text-[10px] font-bold uppercase bg-red-600 text-white rounded hover:bg-red-700 transition-all shadow-sm disabled:opacity-30 disabled:pointer-events-none flex items-center gap-2"
              >
                {deleting ? <RefreshCcw size={11} className="animate-spin" /> : null}
                Remove
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
