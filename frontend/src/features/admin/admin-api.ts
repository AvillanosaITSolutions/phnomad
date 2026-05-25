import { apiFetch } from '../../lib/api';
import type { AdminUser, GrantCreditsResult, ScheduledTask } from '../../types/models';

export function getScheduledTasks(token: string): Promise<ScheduledTask[]> {
  return apiFetch<ScheduledTask[]>('/admin/scheduled-tasks', undefined, token);
}

export function getAdminUsers(token: string): Promise<AdminUser[]> {
  return apiFetch<AdminUser[]>('/admin/users', undefined, token);
}

export function grantCredits(
  token: string,
  userId: string,
  credits: number,
): Promise<GrantCreditsResult> {
  return apiFetch<GrantCreditsResult>(
    `/admin/users/${userId}/grant-credits`,
    {
      method: 'POST',
      body: JSON.stringify({ credits }),
    },
    token,
  );
}
