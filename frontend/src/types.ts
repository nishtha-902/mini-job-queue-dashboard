export type JobStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed';

export interface Job {
  id: string;
  title: string;
  type: string;
  status: JobStatus;
  createdAt: string;
}

export interface CreateJobPayload {
  title: string;
  type: string;
}

export const JOB_STATUSES: JobStatus[] = [
  'pending',
  'running',
  'completed',
  'failed',
];
