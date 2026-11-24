import type { StringKey } from '../i18n/strings';

/**
 * The admin sidebar on desktop, in three groups with a grey label (audit #9, lesson 01). The pages themselves stay in
 * ADMIN_TABS (AdminBottomNav); a page that is in no group here still shows, at the end, without a label.
 */
export const ADMIN_GROUPS: Array<{ label: StringKey; paths: string[] }> = [
  { label: 'anav.g.work', paths: ['/admin/today', '/admin/studio', '/admin/brands'] },
  { label: 'anav.g.sales', paths: ['/admin/proposals', '/admin/onboarding', '/admin/billing', '/admin/costs', '/admin/ai'] },
  { label: 'anav.g.team', paths: ['/admin/whatsapp', '/admin/criterio'] },
];
