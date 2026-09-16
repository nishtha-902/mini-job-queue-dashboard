import { useCallback, useEffect, useMemo, useState } from 'react';
import { jobsApi } from './api';
import { JobForm } from './components/JobForm';
import { JobTable } from './components/JobTable';
import type {
  CreateJobPayload,
  Job,
  JobStatus,
} from './types';
import { JOB_STATUSES } from './types';

type Filter = 'all' | JobStatus;

function App() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadJobs = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await jobsApi.getAll();
      setJobs(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load jobs.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadJobs();
  }, [loadJobs]);

  async function handleCreate(payload: CreateJobPayload) {
    setSubmitting(true);
    setError(null);

    try {
      const created = await jobsApi.create(payload);
      setJobs((current) => [created, ...current]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to create job.',
      );
      throw err;
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStatusChange(job: Job, status: JobStatus) {
    setUpdatingId(job.id);
    setError(null);

    try {
      const updated = await jobsApi.updateStatus(job.id, status);

      setJobs((current) =>
        current.map((item) =>
          item.id === updated.id ? updated : item,
        ),
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to update status.';
      setError(message);

      // Especially useful for a two-tab conflict: refresh authoritative state.
      if (message.toLowerCase().includes('changed by another')) {
        await loadJobs();
      }
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleDelete(job: Job) {
    if (!window.confirm(`Delete "${job.title}"?`)) return;

    setDeletingId(job.id);
    setError(null);

    try {
      await jobsApi.remove(job.id);
      setJobs((current) =>
        current.filter((item) => item.id !== job.id),
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to delete job.',
      );
    } finally {
      setDeletingId(null);
    }
  }

  const counts = useMemo(() => {
    return JOB_STATUSES.reduce(
      (acc, status) => {
        acc[status] = jobs.filter((job) => job.status === status).length;
        return acc;
      },
      {
        pending: 0,
        running: 0,
        completed: 0,
        failed: 0,
      } as Record<JobStatus, number>,
    );
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    if (filter === 'all') return jobs;
    return jobs.filter((job) => job.status === filter);
  }, [filter, jobs]);

  return (
    <main className="app-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">Operations</p>
          <h1>Mini Job Queue Dashboard</h1>
          <p className="subtitle">
            Manage jobs and observe their lifecycle in real time.
          </p>
        </div>

        <button className="secondary-button" onClick={() => void loadJobs()}>
          Refresh
        </button>
      </header>

      <section className="stats-grid">
        <StatCard label="Total" value={jobs.length} />
        {JOB_STATUSES.map((status) => (
          <StatCard
            key={status}
            label={status}
            value={counts[status]}
          />
        ))}
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Create a job</h2>
            <p>New jobs always start in pending.</p>
          </div>
        </div>

        <JobForm submitting={submitting} onCreate={handleCreate} />
      </section>

      {error && (
        <div className="error-banner" role="alert">
          <span>{error}</span>
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      <section className="panel">
        <div className="panel-header jobs-header">
          <div>
            <h2>Jobs</h2>
            <p>{filteredJobs.length} job(s) displayed</p>
          </div>

          <div className="filters" aria-label="Filter jobs">
            <button
              className={filter === 'all' ? 'filter active' : 'filter'}
              onClick={() => setFilter('all')}
            >
              All
            </button>

            {JOB_STATUSES.map((status) => (
              <button
                key={status}
                className={filter === status ? 'filter active' : 'filter'}
                onClick={() => setFilter(status)}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="loading-state">Loading jobs...</div>
        ) : (
          <JobTable
            jobs={filteredJobs}
            updatingId={updatingId}
            deletingId={deletingId}
            onStatusChange={handleStatusChange}
            onDelete={handleDelete}
          />
        )}
      </section>
    </main>
  );
}

interface StatCardProps {
  label: string;
  value: number;
}

function StatCard({ label, value }: StatCardProps) {
  return (
    <div className="stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default App;
