export const ADMIN_TEACHER_EMAILS = [
  'gabriel.lim@ri.edu.sg',
  'jannisa.soh@ri.edu.sg',
  'cheekeong.lee@ri.edu.sg',
  'jialin.ma@ri.edu.sg',
  'kuangwen.chan@ri.edu.sg',
];

export function isAdminTeacherEmail(email?: string | null) {
  if (!email) return false;
  return ADMIN_TEACHER_EMAILS.includes(email.toLowerCase());
}
