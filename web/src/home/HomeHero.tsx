import { useEffect, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import type { ScopedRequest } from '../requests/useBrandsRequests';
import { useBrands } from '../brands/BrandProvider';
import { useNicoWhatsApp } from '../lib/nicoWhatsApp';
import { noticesApi } from '../review/api';
import { HomeStudio } from './HomeStudio';
import { WhatsAppIcon } from '../components/Icon';

/**
 * Home hero: the studio is the screen. Above it, one line (date + what needs you, or "anything is possible")
 * and WhatsApp: the brand's group first, NickMark directly second. The studio already shows him and his
 * Brains, so the hero repeats neither.
 */
export function HomeHero({ brandName, needsYou, open }: { brandName: string; needsYou: ScopedRequest[]; open: ScopedRequest[] }) {
  const wa = useNicoWhatsApp();
  const { t, lang } = useI18n();
  const { current } = useBrands();
  const [group, setGroup] = useState<{ name?: string; url: string } | null>(null);
  useEffect(() => {
    setGroup(null);
    if (current) noticesApi.get(current.id).then((s) => setGroup((s.groups ?? []).find((g): g is { name?: string; url: string } => !!g.url) ?? null)).catch(() => setGroup(null));
  }, [current?.id]);
  const today = new Date().toLocaleDateString(lang === 'es' ? 'es-CO' : 'en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <section className="col g16" aria-labelledby="h-home">
      <div className="row between g16 wrap" data-tour="home-needs">
        <div className="col g4 min-w-0">
          <p className="label">{today} · {brandName}</p>
          <h1 className="h2" id="h-home">
            {needsYou.length
              ? <><span className="w9">{t(needsYou.length === 1 ? 'home.needsOne' : 'home.needsN', { n: needsYou.length })}</span> {t('home.restMoving')}</>
              : <><span className="w9">{t('home.nothingNeeds')}</span> {t('home.possibleSub')}</>}
          </h1>
        </div>
        <div className="row g8 wrap">
          {group && <a className="btn btn-wa" href={group.url} target="_blank" rel="noreferrer"><WhatsAppIcon />{t('hg.group')}</a>}
          <a className={`btn ${group ? 'btn-secondary' : 'btn-wa'}`} href={wa()} target="_blank" rel="noreferrer"><WhatsAppIcon />{t('home.talkNico')}</a>
        </div>
      </div>
      <div data-tour="home-brains"><HomeStudio requests={open} /></div>
    </section>
  );
}
