import type { Job, JobStatus } from '../types';
import { StatusBadge } from './StatusBadge';

interface JobTableProps {
  jobs: Job[];
  updatingId: string | null;
  deletingId: string | null;
  onStatusChange: (job: Job, status: JobStatus) => Promise<void>;
  onDelete: (job: Job) => Promise<void>;
}

const nextStatuses: Record<JobStatus, JobStatus[]> = {
  pending: ['running', 'failed'],
  running: ['completed', 'failed'],
  completed: [],
  failed: [],
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function JobTable({
  jobs,
  updatingId,
  deletingId,
  onStatusChange,
  onDelete,
}: JobTableProps) {
  if (jobs.length === 0) {
    return (
      <div className="empty-state">
        <strong>No jobs found.</strong>
        <span>Create a job or change the status filter.</span>
      </div>
    );
  }

  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Job</th>
            <th>Type</th>
            <th>Status</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => {
            const isUpdating = updatingId === job.id;
            const isDeleting = deletingId === job.id;
            const transitions = nextStatuses[job.status];

            return (
              <tr key={job.id}>
                <td>
                  <div className="job-title">{job.title}</div>
                  <div className="job-id">{job.id}</div>
                </td>
                <td>{job.type}</td>
                <td>
                  <StatusBadge status={job.status} />
                </td>
                <td>{formatDate(job.createdAt)}</td>
                <td>
                  <div className="actions">
                    {transitions.map((status) => (
                      <button
                        key={status}
                        className="secondary-button"
                        disabled={isUpdating || isDeleting}
                        onClick={() => onStatusChange(job, status)}
                      >
                        {isUpdating ? 'Updating...' : `Mark ${status}`}
                      </button>
                    ))}

                    <button
                      className="danger-button"
                      disabled={isUpdating || isDeleting}
                      onClick={() => onDelete(job)}
                    >
                      {isDeleting ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
