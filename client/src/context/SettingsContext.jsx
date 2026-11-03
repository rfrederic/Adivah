import { createContext, useContext, useLayoutEffect } from 'react';
import { brand } from '@/config/brand';
import { useApi } from '@/hooks/useApi';
import { applyOverrides } from '@/lib/overrides';

const SettingsContext = createContext({ settings: null, images: brand });

export function SettingsProvider({ children }) {
  const { data, reload } = useApi('/api/settings');
  useLayoutEffect(() => {
    if (data) applyOverrides(data.textOverrides);
  }, [data]);
  const images = {
    logo: data?.logoUrl || brand.logo,
    heroImage: data?.heroImageUrl || brand.heroImage,
    aboutImage: data?.aboutImageUrl || brand.aboutImage,
  };
  return <SettingsContext.Provider value={{ settings: data, images, reload }}>{children}</SettingsContext.Provider>;
}

export const useSettings = () => useContext(SettingsContext);
