import { Schema, model } from 'mongoose';
import { AREAS, SOCIALS } from '../constants.js';
import { localized } from './shared.js';

const text = () => ({ type: localized(), default: () => ({}) });

const settingsSchema = new Schema(
  {
    key: { type: String, default: 'site', unique: true },
    logoUrl: { type: String, default: '' },
    heroImageUrl: { type: String, default: '' },
    aboutImageUrl: { type: String, default: '' },
    // Description et légende des photographies de page (la légende situe la photo dans son contexte historique).
    imageText: {
      hero: { alt: text(), caption: text() },
      about: { alt: text(), caption: text() },
    },
    storyImage: { url: { type: String, default: '' }, alt: text(), caption: text() },
    areaImages: Object.fromEntries(AREAS.map((a) => [a, { url: { type: String, default: '' }, alt: text(), caption: text() }])),
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    address: text(),
    mapUrl: { type: String, default: '' },
    socials: Object.fromEntries(SOCIALS.map((s) => [s, { type: String, default: '' }])),
    presentation: text(),
    mission: text(),
    vision: text(),
    approach: text(),
    commitment: text(),
    // Une entrée par ligne
    values: text(),
    objectives: text(),
    // Affiche la mention « contenu provisoire » sur la page À propos tant qu'ADIVAH n'a pas validé les textes.
    aboutIsDraft: { type: Boolean, default: true },
    // Textes du site modifiés depuis le tableau de bord : { fr: { 'home.headline1': '…' }, en: { … } }. Vide = texte d'origine.
    textOverrides: { type: Schema.Types.Mixed, default: () => ({ fr: {}, en: {} }) },
    seo: {
      homeTitle: text(),
      homeDescription: text(),
      ogImageUrl: { type: String, default: '' },
    },
    englishEnabled: { type: Boolean, default: true },
    maintenance: {
      enabled: { type: Boolean, default: false },
      message: text(),
    },
    // Adresse qui reçoit les alertes de nouveaux messages. Jamais exposée au public.
    notificationEmail: { type: String, default: '' },
  },
  { timestamps: true, minimize: false },
);

export const Settings = model('Settings', settingsSchema);

/** Textes initiaux, repris strictement de la mission fournie par ADIVAH. */
export const DEFAULT_SETTINGS = {
  mission: {
    fr: "L'ADIVAH se consacre à la défense et à la promotion des droits humains en Haïti, à la protection de la dignité humaine et au soutien du développement social. Elle encourage l'égalité et la justice, et contribue à une société haïtienne plus inclusive, plus pacifique et plus équitable.",
    en: 'ADIVAH is dedicated to defending and promoting human rights in Haiti, protecting human dignity and supporting social development. It encourages equality and justice, and contributes to a more inclusive, peaceful and equitable Haitian society.',
  },
  presentation: {
    fr: "L'Association pour le Developpement Integral des Valeur Haitiennes (ADIVAH) est une organisation haïtienne à but non lucratif, active dans les domaines des droits humains et du développement social.",
    en: 'The Association pour le Developpement Integral des Valeur Haitiennes (ADIVAH) is a Haitian nonprofit organization working in the fields of human rights and social development.',
  },
  vision: {
    fr: 'Une société haïtienne inclusive, pacifique et équitable, où la dignité et les libertés fondamentales de chaque personne sont respectées.',
    en: 'An inclusive, peaceful and equitable Haitian society in which the dignity and fundamental freedoms of every person are respected.',
  },
  commitment: {
    fr: "L'ADIVAH s'engage à défendre les droits humains et les libertés fondamentales, et à contribuer à un développement durable qui ne laisse personne de côté.",
    en: 'ADIVAH is committed to defending human rights and fundamental freedoms, and to contributing to sustainable development that leaves no one behind.',
  },
  values: {
    fr: 'Dignité humaine\nJustice\nÉgalité\nInclusion\nPaix\nÉquité',
    en: 'Human dignity\nJustice\nEquality\nInclusion\nPeace\nEquity',
  },
  objectives: {
    fr: 'Protéger et défendre les droits humains\nPromouvoir la justice sociale et l\'égalité\nSoutenir le développement communautaire\nProtéger les personnes vulnérables\nFavoriser l\'éducation et la sensibilisation\nEncourager la participation citoyenne\nContribuer au développement durable d\'Haïti',
    en: 'Protect and defend human rights\nPromote social justice and equality\nSupport community development\nProtect vulnerable people\nFoster education and awareness\nEncourage civic participation\nContribute to the sustainable development of Haiti',
  },
};

export async function getSettings() {
  return Settings.findOneAndUpdate(
    { key: 'site' },
    { $setOnInsert: { key: 'site', ...DEFAULT_SETTINGS } },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
  );
}
