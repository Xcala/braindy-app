import { api } from '../lib/api';

export const inviteMember = (brandId: string, email: string, role: 'client_owner' | 'client_member', canApprove: boolean, sections?: string[] | null) =>
  api<{ status: 'added' | 'invited' }>(`/v1/brands/${brandId}/members`, { method: 'POST', body: JSON.stringify({ email, role, canApprove, ...(sections ? { sections } : {}) }) });

export const updateMember = (brandId: string, uid: string, patch: { role?: string; canApprove?: boolean; sections?: string[] | null }) =>
  api(`/v1/brands/${brandId}/members/${uid}`, { method: 'PATCH', body: JSON.stringify(patch) });

export const removeMember = (brandId: string, uid: string) =>
  api(`/v1/brands/${brandId}/members/${uid}`, { method: 'DELETE' });

export const listInvites = (brandId: string) =>
  api<{ invites: Array<{ id: string; email: string; role: string; sections?: string[] | null }> }>(`/v1/brands/${brandId}/invites`).then((r) => r.invites);

export const cancelInvite = (brandId: string, inviteId: string) =>
  api(`/v1/brands/${brandId}/invites/${encodeURIComponent(inviteId)}`, { method: 'DELETE' });
