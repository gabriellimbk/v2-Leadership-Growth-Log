import { TeacherEntry } from '../types';

export function getTeacherNameForEmail(
  email: string | null | undefined,
  teachers: TeacherEntry[]
): string | null {
  if (!email) return null;
  const target = email.toLowerCase();
  return teachers.find(t => t.email.toLowerCase() === target)?.name ?? null;
}

export function getTeacherEmailByName(
  name: string | null | undefined,
  teachers: TeacherEntry[]
): string | null {
  if (!name) return null;
  return teachers.find(t => t.name === name)?.email ?? null;
}
