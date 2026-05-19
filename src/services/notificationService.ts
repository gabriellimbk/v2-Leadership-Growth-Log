import { Submission } from '../types';

async function sendNotification(payload: object) {
  const response = await fetch('/api/send-notification', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || 'Failed to send notification email.');
  }
}

export const notificationService = {
  notifyTeacherOfStudentSubmission: async (submission: Submission, teacherEmail: string) => {
    if (!teacherEmail) {
      throw new Error(`No email configured for ${submission.teacherId}.`);
    }

    await sendNotification({
      type: 'student-submitted',
      studentName: submission.studentName,
      studentEmail: submission.studentEmail,
      teacherName: submission.teacherId,
      teacherEmail,
    });
  },

  notifyStudentOfTeacherReview: async (submission: Submission) => {
    await sendNotification({
      type: 'teacher-reviewed',
      studentName: submission.studentName,
      studentEmail: submission.studentEmail,
      teacherName: submission.teacherId,
    });
  },
};
