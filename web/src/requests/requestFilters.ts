import { daysFrom, isOverdue } from '../lib/dates';
import type { BrandRequest } from './types';

// Requests toolbar: what the old brief app let you narrow by (search, who asked, due date, requested date,
// status tabs) plus sort. Pure functions so the board and the list read the same filtered set.
export type Tab = 'all' | 'to_approve' | 'in_production' | 'late' | 'approved' | 'published';
export const TABS: Tab[] = ['all', 'to_approve', 'in_production', 'late', 'approved', 'published'];
export type Due = 'all' | 'late' | 'week' | 'month' | 'none';
export const DUES: Due[] = ['all', 'late', 'week', 'month', 'none'];
export type Asked = 'all' | '7' | '30' | '90' | 'year';
export const ASKEDS: Asked[] = ['all', '7', '30', '90', 'year'];
export type Sort = 'new' | 'old' | 'due' | 'updated' | 'name';
export const SORTS: Sort[] = ['new', 'old', 'due', 'updated', 'name'];

export type ReqFilters = { q: string; who: string; due: Due; asked: Asked; sort: Sort; tab: Tab };
export const NO_FILTERS: ReqFilters = { q: '', who: '', due: 'all', asked: 'all', sort: 'new', tab: 'all' };

const late = (r: BrandRequest) => r.status === 'in_production' && !!r.dueDate && isOverdue(r.dueDate);
const ms = (r: BrandRequest, k: 'createdAt' | 'updatedAt') => r[k]?.toMillis?.() ?? 0;
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export const inTab = (tab: Tab, r: BrandRequest) => tab === 'all' || (tab === 'late' ? late(r) : r.status === tab);

function inDue(due: Due, r: BrandRequest) {
  if (due === 'all') return true;
  if (due === 'none') return !r.dueDate;
  if (due === 'late') return late(r);
  const n = daysFrom(r.dueDate);
  return n != null && n >= 0 && n <= (due === 'week' ? 7 : 31);
}

function inAsked(asked: Asked, r: BrandRequest) {
  if (asked === 'all') return true;
  const t = ms(r, 'createdAt');
  if (asked === 'year') return new Date(t).getFullYear() === new Date().getFullYear();
  return t >= Date.now() - Number(asked) * 864e5;
}

/** Everything but the status tab, so the tabs can show how many each one would hold. */
export function narrow(list: BrandRequest[], f: ReqFilters, typeLabel: (r: BrandRequest) => string) {
  const q = norm(f.q.trim());
  return list.filter((r) => (!q || norm(`${r.title} ${r.formatType ?? ''} ${typeLabel(r)}`).includes(q))
    && (!f.who || r.createdBy === f.who) && inDue(f.due, r) && inAsked(f.asked, r));
}

export function sortRequests(list: BrandRequest[], sort: Sort) {
  const by: Record<Sort, (a: BrandRequest, b: BrandRequest) => number> = {
    new: (a, b) => ms(b, 'createdAt') - ms(a, 'createdAt'),
    old: (a, b) => ms(a, 'createdAt') - ms(b, 'createdAt'),
    due: (a, b) => String(a.dueDate || '9999').localeCompare(String(b.dueDate || '9999')),
    updated: (a, b) => ms(b, 'updatedAt') - ms(a, 'updatedAt'),
    name: (a, b) => a.title.localeCompare(b.title),
  };
  return [...list].sort(by[sort]);
}

export const isFiltered = (f: ReqFilters) => !!f.q || !!f.who || f.due !== 'all' || f.asked !== 'all' || f.tab !== 'all';
