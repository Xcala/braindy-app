import { api } from '../lib/api';
export const inviteMember = (brandId, email, role, canApprove, sections) => api(`/v1/brands/${brandId}/members`, { method: 'POST', body: JSON.stringify({ email, role, canApprove, ...(sections ? { sections } : {}) }) });
export const updateMember = (brandId, uid, patch) => api(`/v1/brands/${brandId}/members/${uid}`, { method: 'PATCH', body: JSON.stringify(patch) });
export const removeMember = (brandId, uid) => api(`/v1/brands/${brandId}/members/${uid}`, { method: 'DELETE' });
export const listInvites = (brandId) => api(`/v1/brands/${brandId}/invites`).then((r) => r.invites);
export const cancelInvite = (brandId, inviteId) => api(`/v1/brands/${brandId}/invites/${encodeURIComponent(inviteId)}`, { method: 'DELETE' });
