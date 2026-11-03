import { useTranslation } from 'react-i18next';
import { brand } from '@/config/brand';
import { useSettings } from '@/context/SettingsContext';

/** Logo officiel de l'ADIVAH, dans ses proportions d'origine. Un logo téléversé depuis le tableau de bord le remplace. */
export function LogoImage({ className = 'size-12', alt = '' }) {
  const { images } = useSettings();
  const isDefault = images.logo === brand.logo;
  return (
    <img
      src={images.logo}
      srcSet={isDefault ? '/images/brand/logo-64.webp 64w, /images/brand/logo-128.webp 128w, /images/brand/logo-256.webp 256w' : undefined}
      sizes="64px"
      alt={alt}
      width="128"
      height="128"
      className={`shrink-0 object-contain ${isDefault ? 'rounded-full bg-white' : ''} ${className}`}
    />
  );
}

export function Logo({ light = false, showText = true }) {
  const { t } = useTranslation();
  return (
    <span className="flex items-center gap-3">
      <LogoImage className={`size-12 ${light ? 'ring-2 ring-white' : ''}`} alt={showText ? '' : t('brand.logoAlt')} />
      {showText && (
        <span className="leading-tight">
          <span className={`block font-serif text-xl font-semibold tracking-wide ${light ? 'text-white' : 'text-ink'}`}>{t('brand.name')}</span>
          <span className={`hidden max-w-52 text-[0.6875rem] leading-snug sm:block ${light ? 'text-sky-100' : 'text-ink-soft'}`}>{t('brand.fullName')}</span>
        </span>
      )}
    </span>
  );
}
