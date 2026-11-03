import { z } from 'zod';
import { createRequire } from 'node:module';
import { AREAS, ARTICLE_CATEGORIES, CAMPAIGN_STATUSES, MEDIA_CATEGORIES, PROJECT_STATUSES, PUBLICATION_TYPES, ROLES, SOCIALS, SUBMISSION_STATUSES, SUBMISSION_TYPES, USER_STATUSES, WORKFLOW_STATUSES } from '../constants.js';
import { STATIC_IMAGE_PATTERN, UPLOAD_URL_PATTERN } from '../lib/files.js';

const site = createRequire(import.meta.url)('../../../shared/site.json');
const EDITABLE_KEYS = Object.values(site.editableText).flat();

const LIMITS = { short: 200, medium: 1000, long: 50000 };

const localizedText = (max) => z.object({ fr: z.string().trim().max(max).default(''), en: z.string().trim().max(max).default('') }).strict();
const localizedRequired = (max) =>
  z.object({ fr: z.string().trim().min(1).max(max), en: z.string().trim().max(max).default('') }).strict();
const uploadUrl = z.string().regex(UPLOAD_URL_PATTERN).or(z.literal(''));
const nullableDate = z.preprocess((v) => (v === '' || v === undefined ? null : v), z.coerce.date().nullable());
const httpUrl = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === '' || /^https?:\/\//i.test(v), { message: 'url' });
const photoUrl = z.string().regex(UPLOAD_URL_PATTERN).or(z.string().regex(STATIC_IMAGE_PATTERN));
const image = z.object({ url: photoUrl.or(z.literal('')).default(''), alt: localizedText(LIMITS.short).default({ fr: '', en: '' }) }).strict();

const emptyText = { fr: '', en: '' };
const historyPhoto = z
  .object({
    url: photoUrl,
    width: z.number().int().positive().nullable().default(null),
    height: z.number().int().positive().nullable().default(null),
    alt: localizedText(LIMITS.short * 2).default(emptyText),
    caption: localizedText(LIMITS.short * 2).default(emptyText),
  })
  .strict();
export const projectInput = z
  .object({
    title: localizedRequired(LIMITS.short),
    summary: localizedText(LIMITS.medium).default({ fr: '', en: '' }),
    body: localizedText(LIMITS.long).default({ fr: '', en: '' }),
    location: localizedText(LIMITS.short).default({ fr: '', en: '' }),
    date: nullableDate.default(null),
    // Précision de la date : évite d'afficher un jour inventé quand seul le mois ou l'année est connu.
    datePrecision: z.enum(['day', 'month', 'year']).default('day'),
    gallery: z.array(historyPhoto).max(24).default([]),
    status: z.enum(PROJECT_STATUSES),
    category: z.enum(AREAS),
    image: image.default({ url: '', alt: { fr: '', en: '' } }),
    isSample: z.boolean().default(false),
  })
  .strict();

const historySection = z
  .object({
    key: z.string().regex(/^[a-z0-9-]{1,60}$/),
    hidden: z.boolean().default(false),
    date: localizedText(LIMITS.short).default(emptyText),
    location: localizedText(LIMITS.short).default(emptyText),
    heading: localizedText(LIMITS.short).default(emptyText),
    body: localizedText(LIMITS.long).default(emptyText),
    photos: z.array(historyPhoto).max(24).default([]),
  })
  .strict();

export const articleInput = z
  .object({
    layout: z.enum(['standard', 'history']).default('standard'),
    logoUrl: photoUrl.or(z.literal('')).default(''),
    heroCaption: localizedText(LIMITS.short * 2).default(emptyText),
    timelineTitle: localizedText(LIMITS.short).default(emptyText),
    sections: z.array(historySection).max(30).default([]),
    closingTitle: localizedText(LIMITS.short).default(emptyText),
    closingBody: localizedText(LIMITS.long).default(emptyText),
    closingHighlight: localizedText(LIMITS.medium).default(emptyText),
    signature: localizedText(LIMITS.short).default(emptyText),
    finalMessage: localizedText(LIMITS.medium).default(emptyText),
    seo: z
      .object({ title: localizedText(LIMITS.short), description: localizedText(LIMITS.medium), keywords: localizedText(LIMITS.medium) })
      .strict()
      .default({ title: emptyText, description: emptyText, keywords: emptyText }),
    reviewNotes: z.string().max(10000).default(''),
    title: localizedRequired(LIMITS.short),
    excerpt: localizedText(LIMITS.medium).default({ fr: '', en: '' }),
    body: localizedText(LIMITS.long).default({ fr: '', en: '' }),
    category: z.enum(ARTICLE_CATEGORIES),
    image: image.default({ url: '', alt: { fr: '', en: '' } }),
    publishedAt: nullableDate.default(null),
    isSample: z.boolean().default(false),
  })
  .strict();

export const publicationInput = z
  .object({
    title: localizedRequired(LIMITS.short),
    description: localizedText(LIMITS.medium).default({ fr: '', en: '' }),
    type: z.enum(PUBLICATION_TYPES),
    fileUrl: uploadUrl.default(''),
    fileSize: z.number().int().min(0).default(0),
    year: z.preprocess((v) => (v === '' || v === undefined ? null : v), z.coerce.number().int().min(1900).max(2100).nullable()).default(null),
    language: z.enum(['fr', 'en', 'both']).default('fr'),
    isSample: z.boolean().default(false),
  })
  .strict();

const order = z.preprocess((v) => (v === '' || v === undefined ? 0 : v), z.coerce.number().int().min(0).max(9999));

export const campaignInput = z
  .object({
    title: localizedRequired(LIMITS.short),
    summary: localizedText(LIMITS.medium).default({ fr: '', en: '' }),
    body: localizedText(LIMITS.long).default({ fr: '', en: '' }),
    campaignStatus: z.enum(CAMPAIGN_STATUSES),
    startDate: nullableDate.default(null),
    endDate: nullableDate.default(null),
    image: image.default({ url: '', alt: { fr: '', en: '' } }),
    isSample: z.boolean().default(false),
  })
  .strict();

export const teamMemberInput = z
  .object({
    name: z.string().trim().min(1).max(LIMITS.short),
    position: localizedText(LIMITS.short).default({ fr: '', en: '' }),
    bio: localizedText(LIMITS.medium * 3).default({ fr: '', en: '' }),
    image: image.default({ url: '', alt: { fr: '', en: '' } }),
    order: order.default(0),
    isSample: z.boolean().default(false),
  })
  .strict();

export const partnerInput = z
  .object({
    name: z.string().trim().min(1).max(LIMITS.short),
    description: localizedText(LIMITS.medium).default({ fr: '', en: '' }),
    website: httpUrl.default(''),
    image: image.default({ url: '', alt: { fr: '', en: '' } }),
    order: order.default(0),
    isSample: z.boolean().default(false),
  })
  .strict();

/** Organisation et configuration : réservé au Super Administrateur. */
export const settingsInput = z
  .object({
    logoUrl: photoUrl.or(z.literal('')),
    email: z.string().trim().email().max(200).or(z.literal('')),
    phone: z.string().trim().max(50),
    address: localizedText(LIMITS.short),
    mapUrl: httpUrl,
    socials: z.object(Object.fromEntries(SOCIALS.map((s) => [s, httpUrl]))).strict(),
    seo: z.object({ homeTitle: localizedText(LIMITS.short), homeDescription: localizedText(LIMITS.medium), ogImageUrl: photoUrl.or(z.literal('')) }).strict(),
    englishEnabled: z.boolean(),
    maintenance: z.object({ enabled: z.boolean(), message: localizedText(LIMITS.medium) }).strict(),
    notificationEmail: z.string().trim().email().max(200).or(z.literal('')),
  })
  .strict();

// Seules les clés prévues peuvent être remplacées : le nom officiel et l'interface d'administration en sont exclus.
const overrides = z.partialRecord(z.enum(EDITABLE_KEYS), z.string().trim().max(5000));

const imageText = z.object({ alt: localizedText(LIMITS.short * 2), caption: localizedText(LIMITS.short * 2) }).strict();
const pageImage = z.object({ url: photoUrl.or(z.literal('')), alt: localizedText(LIMITS.short * 2), caption: localizedText(LIMITS.short * 2) }).strict();

/** Textes des pages du site : Super Administrateur et Administrateur de contenu. */
export const siteContentInput = z
  .object({
    heroImageUrl: photoUrl.or(z.literal('')),
    aboutImageUrl: photoUrl.or(z.literal('')),
    imageText: z.object({ hero: imageText, about: imageText }).strict().default({ hero: { alt: emptyText, caption: emptyText }, about: { alt: emptyText, caption: emptyText } }),
    storyImage: pageImage.default({ url: '', alt: emptyText, caption: emptyText }),
    areaImages: z.object(Object.fromEntries(AREAS.map((a) => [a, pageImage.default({ url: '', alt: emptyText, caption: emptyText })]))).strict().default({}),
    presentation: localizedText(5000),
    mission: localizedText(5000),
    vision: localizedText(5000),
    approach: localizedText(5000),
    commitment: localizedText(5000),
    values: localizedText(5000),
    objectives: localizedText(5000),
    aboutIsDraft: z.boolean(),
    textOverrides: z.object({ fr: overrides, en: overrides }).strict(),
  })
  .strict();

export const submissionInput = z
  .object({
    type: z.enum(SUBMISSION_TYPES).default('contact'),
    name: z.string().trim().min(2).max(120),
    email: z.string().trim().email().max(200),
    phone: z.string().trim().max(50).default(''),
    organization: z.string().trim().max(200).default(''),
    subject: z.string().trim().max(200).default(''),
    message: z.string().trim().min(10).max(5000),
    language: z.enum(['fr', 'en']).default('fr'),
    consent: z.literal(true),
    // Anti-spam : champ invisible qui doit rester vide, et durée de remplissage du formulaire.
    website: z.string().max(500).default(''),
    elapsedMs: z.coerce.number().min(0).default(0),
  })
  .strict();

export const submissionUpdate = z.object({ status: z.enum(SUBMISSION_STATUSES) }).strict();

export const loginInput = z.object({ email: z.string().trim().email().max(200), password: z.string().min(1).max(200) }).strict();

export const passwordChange = z
  .object({ currentPassword: z.string().min(1).max(200), newPassword: z.string().min(1).max(200) })
  .strict();
export const forgotInput = z.object({ email: z.string().trim().email().max(200) }).strict();
export const resetInput = z.object({ token: z.string().regex(/^[a-f0-9]{64}$/), newPassword: z.string().min(1).max(200) }).strict();

export const userCreate = z.object({ name: z.string().trim().min(1).max(120), email: z.string().trim().email().max(200), role: z.enum(ROLES) }).strict();
export const userUpdate = z
  .object({ name: z.string().trim().min(1).max(120).optional(), role: z.enum(ROLES).optional(), status: z.enum(USER_STATUSES).optional() })
  .strict();

const pagination = { page: z.coerce.number().int().min(1).default(1), limit: z.coerce.number().int().min(1).max(50).default(12) };

export const projectQuery = z.object({ ...pagination, category: z.enum(AREAS).optional(), status: z.enum(PROJECT_STATUSES).optional() });
export const articleQuery = z.object({ ...pagination, category: z.enum(ARTICLE_CATEGORIES).optional(), layout: z.enum(['standard', 'history']).optional() });
export const publicationQuery = z.object({ ...pagination, type: z.enum(PUBLICATION_TYPES).optional() });
export const campaignQuery = z.object({ ...pagination, status: z.enum(CAMPAIGN_STATUSES).optional() });
export const directoryQuery = z.object({ ...pagination });
export const submissionQuery = z.object({ ...pagination, status: z.enum(SUBMISSION_STATUSES).optional(), type: z.enum(SUBMISSION_TYPES).optional() });
const adminPagination = { page: pagination.page, limit: z.coerce.number().int().min(1).max(100).default(20) };
const search = z.string().trim().max(100).optional();
export const contentQuery = z.object({
  ...adminPagination,
  q: search,
  status: z.enum(WORKFLOW_STATUSES).optional(),
  sort: z.enum(['updatedAt', 'createdAt', 'title.fr', 'name', 'order', 'workflowStatus']).default('updatedAt'),
  dir: z.enum(['asc', 'desc']).default('desc'),
});
export const auditQuery = z.object({ ...adminPagination, q: search, action: z.string().regex(/^[a-z_.]{1,50}$/).optional() });
export const mediaQuery = z.object({
  ...adminPagination,
  q: search,
  kind: z.enum(['image', 'document']).optional(),
  category: z.enum(MEDIA_CATEGORIES).optional(),
  sort: z.enum(['createdAt', 'size', 'originalName']).default('createdAt'),
  dir: z.enum(['asc', 'desc']).default('desc'),
});
export const mediaUpdate = z
  .object({ category: z.enum(MEDIA_CATEGORIES), alt: localizedText(LIMITS.short), description: localizedText(LIMITS.medium) })
  .strict();
export const mediaCategory = z.object({ category: z.enum(MEDIA_CATEGORIES).optional() });
export const workflowInput = z
  .object({ comment: z.string().trim().max(2000).default(''), publishAt: nullableDate.default(null) })
  .strict();
export const slugParam = z.object({ slug: z.string().regex(/^[a-z0-9-]{1,100}$/) });
export const idParam = z.object({ id: z.string().regex(/^[a-f0-9]{24}$/) });
