import type {
  CreateJobPayload,
  Job,
  JobStatus,
} from './types';

const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;

    try {
      const body = await response.json();
      if (Array.isArray(body.message)) {
        message = body.message.join(', ');
      } else if (typeof body.message === 'string') {
        message = body.message;
      }
    } catch {
      // Keep the fallback message when the response has no JSON body.
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const jobsApi = {
  getAll: () => request<Job[]>('/jobs'),

  create: (payload: CreateJobPayload) =>
    request<Job>('/jobs', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateStatus: (id: string, status: JobStatus) =>
    request<Job>(`/jobs/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  remove: (id: string) =>
    request<void>(`/jobs/${id}`, {
      method: 'DELETE',
    }),
};
