import { Check, Link2, Mail, Share2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export function ShareLinks({ title }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const url = window.location.href;
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const links = [
    ['facebook', `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`],
    ['x', `https://x.com/intent/post?url=${encodedUrl}&text=${encodedTitle}`],
    ['whatsapp', `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`],
  ];
  const copy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };
  return (
    <section aria-label={t('share.title')} className="border-t border-slate-200 pt-6">
      <h2 className="mb-3 flex items-center gap-2 font-sans text-sm font-semibold"><Share2 aria-hidden="true" className="size-4" /> {t('share.title')}</h2>
      <div className="flex flex-wrap gap-2">
        {links.map(([key, href]) => (
          <a key={key} href={href} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">{t(`share.${key}`)}</a>
        ))}
        <a href={`mailto:?subject=${encodedTitle}&body=${encodedUrl}`} className="btn btn-secondary btn-sm"><Mail aria-hidden="true" className="size-4" /> {t('share.email')}</a>
        <button type="button" onClick={copy} className="btn btn-secondary btn-sm">
          {copied ? <Check aria-hidden="true" className="size-4" /> : <Link2 aria-hidden="true" className="size-4" />}
          <span aria-live="polite">{t(copied ? 'share.copied' : 'share.copy')}</span>
        </button>
      </div>
    </section>
  );
}
