import { FormEvent, useState } from 'react';
import type { CreateJobPayload } from '../types';

interface JobFormProps {
  submitting: boolean;
  onCreate: (payload: CreateJobPayload) => Promise<void>;
}

export function JobForm({ submitting, onCreate }: JobFormProps) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedTitle = title.trim();
    const trimmedType = type.trim();

    if (!trimmedTitle || !trimmedType) return;

    await onCreate({
      title: trimmedTitle,
      type: trimmedType,
    });

    setTitle('');
    setType('');
  }

  return (
    <form className="job-form" onSubmit={handleSubmit}>
      <div className="field">
        <label htmlFor="job-title">Job title</label>
        <input
          id="job-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="e.g. Generate monthly report"
          maxLength={120}
          required
        />
      </div>

      <div className="field">
        <label htmlFor="job-type">Job type</label>
        <input
          id="job-type"
          value={type}
          onChange={(event) => setType(event.target.value)}
          placeholder="e.g. report"
          maxLength={80}
          required
        />
      </div>

      <button
        className="primary-button"
        type="submit"
        disabled={submitting || !title.trim() || !type.trim()}
      >
        {submitting ? 'Creating...' : 'Create job'}
      </button>
    </form>
  );
}
