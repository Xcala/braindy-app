import { useI18n } from '../../i18n/I18nProvider';

type Voice = {
  essence?: { title?: string; description?: string };
  tonePrinciples?: Array<{ id?: string; title?: string; description?: string }>;
  howItSounds?: { is?: string[]; isNot?: string[] };
  example?: string;
};

export function Voice({ voice }: { voice: Voice | null }) {
  const { t } = useI18n();
  if (!voice) return null;
  const { essence, tonePrinciples = [], howItSounds, example } = voice;

  return (
    <div className="space-y-8">
      {essence?.title && (
        <div>
          <p className="text-3xl font-light leading-tight sm:text-4xl">{essence.title}</p>
          {essence.description && <p className="mt-3 max-w-2xl text-black/65">{essence.description}</p>}
          {example && <p className="mt-4 text-lg font-medium">{example}</p>}
        </div>
      )}
      {tonePrinciples.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-medium">{t('brand.tone')}</h3>
          <ul className="grid gap-3 sm:grid-cols-2">
            {tonePrinciples.map((p) => (
              <li key={p.id ?? p.title} className="rounded-xl border border-black/10 bg-white p-4">
                <div className="font-medium">{p.title}</div>
                {p.description && <p className="mt-1 text-sm text-black/60">{p.description}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}
      {(howItSounds?.is?.length || howItSounds?.isNot?.length) ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <List title={t('brand.is')} items={howItSounds?.is ?? []} />
          <List title={t('brand.isNot')} items={howItSounds?.isNot ?? []} muted />
        </div>
      ) : null}
    </div>
  );
}

function List({ title, items, muted }: { title: string; items: string[]; muted?: boolean }) {
  if (!items.length) return null;
  return (
    <div className="rounded-xl border border-black/10 bg-white p-4">
      <h3 className="mb-2 text-sm font-medium">{title}</h3>
      <ul className={`list-disc space-y-1 pl-5 text-sm ${muted ? 'text-black/50' : 'text-black/75'}`}>
        {items.map((i) => <li key={i}>{i}</li>)}
      </ul>
    </div>
  );
}
