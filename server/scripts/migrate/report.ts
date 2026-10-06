import type { Plan } from './plan.js';

export function renderReport(plan: Plan, mode: 'dry-run' | 'write'): string {
  const out: string[] = [];
  const line = (s = '') => out.push(s);
  const assets = plan.brands.flatMap((b) => b.assets);
  const members = plan.brands.flatMap((b) => b.members);

  line(`# Phase 1 migration · ${mode} · ${new Date().toISOString()}`);
  line();
  line(`Target: Firestore \`braindy-app\`. Sources read-only: brands \`(default)\`, brief, orbit. Orbit credentials not read.`);
  line();
  line('## Totals');
  line(`| Brands | Context docs | Assets (deck / map / file) | Members | Users | Skipped | Flags |`);
  line(`|---|---|---|---|---|---|---|`);
  const by = (t: string) => assets.filter((a) => a.type === t).length;
  line(`| ${plan.brands.length} | ${plan.brands.reduce((n, b) => n + Object.keys(b.context).length, 0)} | ${assets.length} (${by('logodeck')} / ${by('marketmap')} / ${by('file')}) | ${members.length} | ${plan.users.length} | ${plan.skipped.length} | ${plan.flags.length} |`);
  line();

  line('## Needs your decision');
  plan.flags.length ? plan.flags.forEach((f) => line(`- ${f}`)) : line('- Nothing.');
  line();

  line('## Brands');
  line('| Brand (id) | Merged from | Legacy ids (brands / orbit / brand books) | Context | Assets | Members |');
  line('|---|---|---|---|---|---|');
  for (const b of [...plan.brands].sort((x, y) => x.name.localeCompare(y.name))) {
    const merged = [...b.sourceNames].filter((n) => n !== b.name);
    const l = b.legacyIds;
    const m = b.members.map((x) => `${x.email} (${x.role === 'client_owner' ? 'owner' : 'member'}${x.canApprove ? ', approves' : ''})`).join('<br>');
    line(`| **${b.name}** \`${b.id}\` | ${merged.join(', ') || '—'} | ${l.brands.length} / ${l.orbit.length} / ${l.brandingProjects.length} | ${Object.keys(b.context).join(', ') || '—'} | ${b.assets.map((a) => `${a.type}: ${a.title}`).join('<br>') || '—'} | ${m || '—'} |`);
  }
  line();

  line('## Users');
  line('| Email | Role | Brands |');
  line('|---|---|---|');
  plan.users.forEach((u) => line(`| ${u.email} | ${u.role} | ${u.brandIds.join(', ') || '—'} |`));
  line();

  line('## Skipped');
  line('| Source | Id | Name | Reason |');
  line('|---|---|---|---|');
  plan.skipped.forEach((s) => line(`| ${s.source} | ${s.id.slice(0, 12)} | ${s.name} | ${s.reason} |`));
  line();
  line('Not migrated in phase 1: brief requests (phase 2), orbit credentials (phase 3), orbit deliverables/missions/activity/analyses, billing.');
  return out.join('\n');
}
