/**
 * Activités historiques documentées dans la publication de l'ADIVAH. Le texte, les photos et les légendes
 * viennent de cette publication : rien n'est ajouté. Toutes sont « terminées » : ce ne sont pas des projets en cours.
 */
import { historyPublication } from './historyPublication.js';

const META = {
  'pyron-2014': { slug: 'ligue-de-football-pyron-2014', category: 'community', date: '2014-03-01', datePrecision: 'month' },
  'formation-mars-2016': { slug: 'formation-droits-humains-jeunes-mars-2016', category: 'education', date: '2016-03-28', datePrecision: 'day' },
  'leogane-noel-2016': { slug: 'solidarite-leogane-noel-2016', category: 'protection', date: '2016-12-25', datePrecision: 'day' },
  'route-de-hinche-2016': { slug: 'formation-droits-humains-route-de-hinche-2016', category: 'human-rights', date: '2016-01-01', datePrecision: 'year' },
  'saint-marc-2017': { slug: 'sensibilisation-jeunes-saint-marc-2017', category: 'education', date: '2017-06-01', datePrecision: 'month' },
  'drouillard-2017': { slug: 'solidarite-handicap-drouillard-delmas-2017', category: 'social-justice', date: '2017-12-01', datePrecision: 'month' },
  thomazeau: { slug: 'formation-droits-humains-thomazeau', category: 'human-rights', date: null, datePrecision: 'day' },
};

const firstParagraph = (text) => ({ fr: text.fr.split('\n\n')[0], en: text.en.split('\n\n')[0] });

export const historicalActivities = historyPublication.sections
  .filter((s) => !s.hidden && META[s.key])
  .map((s) => {
    const { slug, ...meta } = META[s.key];
    return {
      slug,
      input: {
        title: s.heading,
        summary: firstParagraph(s.body),
        body: s.body,
        location: s.location,
        date: meta.date,
        datePrecision: meta.datePrecision,
        status: 'completed',
        category: meta.category,
        image: { url: s.photos[0].url, alt: s.photos[0].alt },
        gallery: s.photos,
        isSample: false,
      },
    };
  });

const photoOf = (key, index = 0) => historyPublication.sections.find((s) => s.key === key).photos[index];
const pageImage = (key, index, caption) => {
  const p = photoOf(key, index);
  return { url: p.url, alt: p.alt, caption };
};

/** Photographies des pages : chacune garde une légende qui la situe dans son contexte historique. */
export const pagePhotos = {
  heroImageUrl: photoOf('formation-mars-2016', 1).url,
  aboutImageUrl: photoOf('saint-marc-2017').url,
  imageText: {
    hero: { alt: photoOf('formation-mars-2016', 1).alt, caption: { fr: 'Formation des jeunes aux droits humains, 28 mars 2016.', en: 'Human rights training for young people, March 28, 2016.' } },
    about: { alt: photoOf('saint-marc-2017').alt, caption: { fr: 'Sensibilisation des jeunes à Saint-Marc, juin 2017.', en: 'Youth awareness activity in Saint-Marc, June 2017.' } },
  },
  storyImage: pageImage('drouillard-2017', 1, { fr: 'Activité de solidarité à Drouillard, Delmas, décembre 2017.', en: 'Solidarity activity in Drouillard, Delmas, December 2017.' }),
  areaImages: {
    'human-rights': pageImage('thomazeau', 0, { fr: 'Formation aux droits humains à Thomazeau (date à confirmer).', en: 'Human rights training in Thomazeau (date to be confirmed).' }),
    'social-justice': pageImage('drouillard-2017', 0, { fr: 'Solidarité envers les personnes en situation de handicap, Drouillard, décembre 2017.', en: 'Supporting persons with disabilities, Drouillard, December 2017.' }),
    community: pageImage('pyron-2014', 0, { fr: 'Ligue de football pour les jeunes, Pyron, mars 2014.', en: 'Youth football league, Pyron, March 2014.' }),
    education: pageImage('formation-mars-2016', 0, { fr: 'Formation des jeunes aux droits humains, 28 mars 2016.', en: 'Human rights training for young people, March 28, 2016.' }),
    protection: pageImage('leogane-noel-2016', 0, { fr: 'Visite de Noël dans un orphelinat, Léogâne, 25 décembre 2016.', en: 'Christmas visit to an orphanage, Léogâne, December 25, 2016.' }),
  },
};
