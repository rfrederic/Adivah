import { Article } from '../models/Article.js';
import { Campaign } from '../models/Campaign.js';
import { Partner } from '../models/Partner.js';
import { Project } from '../models/Project.js';
import { Publication } from '../models/Publication.js';
import { TeamMember } from '../models/TeamMember.js';

/** Tous les contenus soumis au circuit de validation. */
export const CONTENT_MODELS = { projects: Project, articles: Article, publications: Publication, campaigns: Campaign, team: TeamMember, partners: Partner };

export const labelOf = (item) => item.title?.fr ?? item.name ?? '';

/** Ce que le public ne doit jamais recevoir : circuit interne et identité du personnel. */
export const INTERNAL_FIELDS = '-history -reviewNotes -workflowStatus -publishAt -createdBy -updatedBy -submittedBy -approvedBy -publishedBy';
