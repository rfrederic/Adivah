/**
 * Publication historique : texte fourni par l'ADIVAH. Seules les légendes, descriptions d'images,
 * la section Thomazeau et les notes de vérification ont été rédigées à partir des informations transmises.
 * Le tout reste en brouillon jusqu'à validation par la direction.
 */
const ORG = 'Association pour le Developpement Integral des Valeur Haitiennes (ADIVAH)';
const l = (fr, en) => ({ fr, en });
const photo = (file, width, height, alt, caption) => ({ url: `/images/${file}`, width, height, alt, caption });

export const HISTORY_SLUG = 'adivah-des-annees-d-engagement';

export const historyPublication = {
  layout: 'history',
  category: 'community',
  publishedAt: null,
  isSample: false,
  title: l("ADIVAH : Des années d'engagement au service de la dignité humaine", 'ADIVAH: Years of Commitment to Human Dignity'),
  excerpt: l('Agir auprès des communautés, accompagner la jeunesse et défendre les valeurs humaines en Haïti.', 'Supporting communities, empowering young people and promoting human values in Haiti.'),
  body: l(
    `Depuis plusieurs années, l'${ORG} s'engage auprès des communautés haïtiennes à travers des initiatives de solidarité, d'éducation, de sensibilisation et de développement humain.\n\nÀ travers ses différentes activités, l'organisation a souhaité contribuer à une société plus juste, plus solidaire et plus respectueuse de la dignité de chaque personne.\n\nCes souvenirs témoignent de moments importants de cet engagement.`,
    `Over the years, the ${ORG} has demonstrated its commitment to Haitian communities through initiatives focused on solidarity, education, awareness and human development.\n\nThrough these activities, the organization has sought to contribute to a fairer, more inclusive and compassionate society where every individual is treated with dignity and respect.\n\nThese photographs preserve important moments from that commitment.`,
  ),
  image: {
    url: '/images/28mars20016_2.jpg',
    alt: l("Un groupe de jeunes en t-shirts blancs portant un logo bleu pose à l'extérieur, autour d'une femme assise tenant un vêtement rouge.", 'A group of young people in white T-shirts with a blue logo pose outdoors, around a seated woman holding a red garment.'),
  },
  logoUrl: '/images/logo.JPG',
  heroCaption: l('Des jeunes réunis lors d\'une activité de sensibilisation et de formation aux droits humains.', 'Young people gathered during a human rights awareness and training activity.'),
  timelineTitle: l('Nos actions au fil des années', 'Our activities through the years'),
  sections: [
    {
      key: 'pyron-2014',
      hidden: false,
      date: l('Mars 2014', 'March 2014'),
      location: l('Pyron', 'Pyron'),
      heading: l("Le sport comme moyen de rassemblement et d'épanouissement de la jeunesse à Pyron", 'Using Sports to Bring Young People Together in Pyron'),
      body: l(
        "À Pyron, ADIVAH a organisé une ligue de football destinée aux jeunes. Au-delà de la compétition sportive, cette initiative représentait une occasion de rassembler les jeunes, de promouvoir l'esprit d'équipe, le respect mutuel et la participation communautaire.\n\nNous croyons que le sport peut être un véritable moyen d'éducation, de rapprochement et d'épanouissement pour la jeunesse.",
        'In Pyron, ADIVAH organized a football league for young people.\n\nBeyond the competition, this initiative provided an opportunity to bring young people together and encourage teamwork, mutual respect and community participation.\n\nWe believe sports can be an important tool for education, personal growth and community development.',
      ),
      photos: [
        photo('09 mars 2014.jpg', 1280, 960, l('Quatre jeunes en t-shirts blancs ornés du drapeau haïtien sourient devant un mur ; deux d\'entre eux tiennent un trophée.', 'Four young people in white T-shirts bearing the Haitian flag smile in front of a wall; two of them hold a trophy.'), l('Des jeunes et leurs trophées, ligue de football de Pyron, mars 2014.', 'Young people with their trophies, Pyron football league, March 2014.')),
      ],
    },
    {
      key: 'formation-mars-2016',
      hidden: false,
      date: l('28 mars 2016', 'March 28, 2016'),
      location: l('', ''),
      heading: l('Sensibilisation et formation des jeunes aux droits humains', 'Human Rights Education and Awareness for Young People'),
      body: l(
        "À travers des activités de formation et de sensibilisation, ADIVAH a accompagné des jeunes dans la découverte et la compréhension des droits humains.\n\nCes initiatives avaient pour objectif de renforcer la connaissance des droits fondamentaux, de développer le sens des responsabilités citoyennes et d'encourager une culture de respect, de justice et de dignité humaine.",
        'ADIVAH organized educational and awareness activities to help young people understand human rights and fundamental freedoms.\n\nThese initiatives aimed to strengthen awareness of individual rights, encourage civic responsibility and promote a culture of respect, justice and human dignity.',
      ),
      photos: [
        photo('28mars20016_1.jpg', 3264, 1836, l('Des jeunes en t-shirts blancs discutent debout sur une allée, devant un bâtiment clair.', 'Young people in white T-shirts talk while standing on a walkway in front of a pale building.'), l('Un moment d\'échange entre les jeunes participants.', 'A moment of exchange among the young participants.')),
        photo('28mars20016_2.jpg', 3264, 1836, l('Le groupe de jeunes en t-shirts blancs réuni pour une photo à l\'extérieur.', 'The group of young people in white T-shirts gathered outdoors for a photograph.'), l('Le groupe réuni à l\'occasion de l\'activité.', 'The group gathered for the activity.')),
      ],
    },
    {
      key: 'leogane-noel-2016',
      hidden: false,
      date: l('25 décembre 2016', 'December 25, 2016'),
      location: l('Léogâne', 'Léogâne'),
      heading: l('Un geste de solidarité à Léogâne', 'A Christmas Visit of Solidarity in Léogâne'),
      body: l(
        "Le jour de Noël, une équipe d'ADIVAH s'est rendue dans un orphelinat à Léogâne afin d'apporter un soutien aux personnes dans le besoin.\n\nCette visite rappelait une valeur essentielle de notre engagement : personne ne devrait être oublié, particulièrement les personnes et les enfants qui vivent dans des situations de vulnérabilité.\n\nLa solidarité ne se limite pas aux paroles. Elle prend tout son sens lorsqu'elle se traduit par une présence, une attention et des gestes concrets.",
        'On Christmas Day, an ADIVAH team visited an orphanage in Léogâne to provide support to people in need.\n\nThe visit reflected one of our essential values: no one should be forgotten, especially children and individuals facing vulnerable circumstances.\n\nSolidarity is more than words. It becomes meaningful through presence, compassion and concrete acts of kindness.',
      ),
      photos: [
        photo('25 decembre 2016 Leogane.jpg', 721, 1280, l('Des enfants et des adultes coiffés de bonnets de Noël rouges sont réunis devant un bâtiment.', 'Children and adults wearing red Christmas hats are gathered in front of a building.'), l('Le jour de Noël à Léogâne, décembre 2016.', 'Christmas Day in Léogâne, December 2016.')),
      ],
    },
    {
      key: 'route-de-hinche-2016',
      hidden: false,
      date: l('2016', '2016'),
      location: l('Route de Hinche', 'Road to Hinche'),
      heading: l('Formation aux droits humains sur la route de Hinche', 'Human Rights Education Along the Hinche Road'),
      body: l(
        "ADIVAH a également mené des activités de formation et de sensibilisation aux droits humains dans la zone de la route de Hinche.\n\nÀ travers ces rencontres, l'objectif était de rapprocher les connaissances sur les droits fondamentaux des communautés et de contribuer à une meilleure compréhension de la dignité, de l'égalité et du respect de chaque individu.",
        'ADIVAH also conducted human rights awareness and educational activities in the area along the road to Hinche.\n\nThe objective was to bring knowledge of fundamental rights closer to communities and encourage a better understanding of dignity, equality and respect for every individual.',
      ),
      photos: [
        photo("Sur la route d'Hinche1.jpg", 956, 1280, l('Deux jeunes coiffés de chapeaux, assis, tiennent une assiette de nourriture ; le chapeau de l\'un porte le nom ADIVAH.', 'Two seated young people in hats hold plates of food; one hat bears the name ADIVAH.'), l('Un repas partagé sur la route de Hinche.', 'A shared meal on the road to Hinche.')),
        photo("Sur la route d'Hinche2.jpg", 956, 1280, l('Deux jeunes assis sur une marche, en chapeaux portant le nom ADIVAH, tiennent chacun une assiette.', 'Two young people seated on a step, in hats bearing the name ADIVAH, each hold a plate.'), l('Un moment de convivialité pendant le déplacement.', 'A moment of togetherness during the journey.')),
      ],
    },
    {
      key: 'saint-marc-2017',
      hidden: false,
      date: l('Juin 2017', 'June 2017'),
      location: l('Saint-Marc', 'Saint-Marc'),
      heading: l('Sensibilisation des jeunes à Saint-Marc', 'Empowering Young People Through Human Rights Education in Saint-Marc'),
      body: l(
        "À Saint-Marc, ADIVAH a poursuivi son engagement en faveur de l'éducation et de la sensibilisation des jeunes aux droits humains.\n\nInvestir dans la jeunesse, c'est contribuer à former des citoyens conscients de leurs droits, de leurs responsabilités et de leur rôle dans la construction d'une société plus équitable.",
        'In Saint-Marc, ADIVAH continued its commitment to educating and raising awareness among young people about human rights.\n\nInvesting in young people means helping build a generation of citizens who understand their rights, their responsibilities and their role in creating a more equitable society.',
      ),
      photos: [
        photo('juin 2017.jpg', 1200, 1600, l('Photo de groupe souriante : des jeunes en polos rouges et bleus entourent un homme à lunettes.', 'A smiling group photograph: young people in red and blue polo shirts surround a man wearing glasses.'), l('Des jeunes réunis à Saint-Marc, juin 2017.', 'Young people gathered in Saint-Marc, June 2017.')),
      ],
    },
    {
      key: 'drouillard-2017',
      hidden: false,
      date: l('Décembre 2017', 'December 2017'),
      location: l('Drouillard, Delmas', 'Drouillard, Delmas'),
      heading: l('Solidarité envers les personnes en situation de handicap à Drouillard, Delmas', 'Supporting Persons with Disabilities in Drouillard, Delmas'),
      body: l(
        "À Drouillard, dans la commune de Delmas, ADIVAH a réalisé une activité de solidarité en faveur des personnes en situation de handicap.\n\nCette initiative reflétait notre conviction que chaque être humain mérite respect, considération et inclusion, indépendamment de sa situation physique ou sociale.\n\nUne société véritablement humaine est une société qui reconnaît la place et la valeur de chacun.",
        'In Drouillard, within the municipality of Delmas, ADIVAH organized a solidarity activity in support of persons with disabilities.\n\nThis initiative reflected our belief that every human being deserves respect, consideration and inclusion, regardless of physical or social circumstances.\n\nA truly humane society is one that recognizes the place and value of everyone.',
      ),
      photos: [
        photo('decembre 2017_1.jpg', 2448, 3264, l('Une femme âgée en fauteuil roulant entourée de quatre personnes souriantes, sous de grands arbres.', 'An elderly woman in a wheelchair surrounded by four smiling people, under tall trees.'), l('Auprès d\'une personne en fauteuil roulant, à Drouillard.', 'Alongside a person using a wheelchair, in Drouillard.')),
        photo('decembre 2017_2.jpg', 2448, 3264, l('Un jeune homme en polo rouge portant le nom ADIVAH se penche, le bras posé autour d\'une femme âgée en fauteuil roulant.', 'A young man in a red polo shirt bearing the name ADIVAH leans in, his arm around an elderly woman in a wheelchair.'), l('Un moment de proximité pendant l\'activité de solidarité.', 'A moment of closeness during the solidarity activity.')),
      ],
    },
    {
      key: 'thomazeau',
      hidden: false,
      date: l('Date à confirmer', 'Date to be confirmed'),
      location: l('Thomazeau', 'Thomazeau'),
      heading: l('Formation et sensibilisation aux droits humains à Thomazeau', 'Human Rights Training and Awareness in Thomazeau'),
      body: l('ADIVAH a également mené une activité de formation et de sensibilisation aux droits humains à Thomazeau.', 'ADIVAH also carried out a human rights training and awareness activity in Thomazeau.'),
      photos: [
        photo('A Thomazeau.jpg', 640, 640, l('Quatre jeunes en polos rouges et bleu posent ensemble à l\'extérieur en faisant le signe de la victoire.', 'Four young people in red and blue polo shirts pose together outdoors making the victory sign.'), l('Des participants à Thomazeau.', 'Participants in Thomazeau.')),
      ],
    },
    {
      // Non affichée : l'événement n'est pas confirmé. Un administrateur pourra la compléter puis l'afficher.
      key: 'photo-a-confirmer',
      hidden: true,
      date: l('', ''),
      location: l('', ''),
      heading: l('Photographie à identifier', 'Photograph to be identified'),
      body: l('', ''),
      photos: [
        photo('Auxcayes2017.jpg', 712, 400, l('Un groupe de personnes en polos rouges et bleus sourit à l\'extérieur, sous des arbres.', 'A group of people in red and blue polo shirts smile outdoors, under trees.'), l('', '')),
      ],
    },
  ],
  closingTitle: l('Un engagement qui mérite de continuer', 'A Commitment Worth Continuing'),
  closingBody: l(
    "Ces différentes activités représentent bien plus que des souvenirs photographiques. Elles témoignent d'une volonté de contribuer au développement humain, à la solidarité et à la promotion des droits fondamentaux en Haïti.\n\nADIVAH considère que le développement intégral ne peut se construire sans la participation des communautés, sans l'éducation des jeunes et sans une attention particulière envers les personnes les plus vulnérables.\n\nNous gardons ces moments comme des témoignages de notre parcours et comme une source de motivation pour poursuivre notre engagement.",
    'These activities represent much more than photographs from the past. They reflect a commitment to human development, solidarity and the promotion of fundamental rights in Haiti.\n\nADIVAH believes that comprehensive development cannot be achieved without community participation, youth education and particular attention to people experiencing vulnerability.\n\nWe preserve these memories as testimonies of our journey and as inspiration to continue our commitment.',
  ),
  closingHighlight: l('La dignité humaine, la solidarité et le respect des droits de chacun doivent rester au cœur de toute action de développement.', "Human dignity, solidarity and respect for everyone's rights must remain at the heart of every development initiative."),
  signature: l(ORG, ORG),
  finalMessage: l('Les années passent, mais la dignité humaine, la solidarité et le respect des droits fondamentaux demeurent au cœur de notre engagement.', 'Years may pass, but human dignity, solidarity and respect for fundamental rights remain at the heart of our commitment.'),
  seo: {
    title: l("ADIVAH Haïti : des années d'engagement pour la dignité humaine", 'ADIVAH Haiti: Years of Commitment to Human Dignity'),
    description: l(
      "L'action de l'ADIVAH en Haïti de 2014 à 2017 : droits humains, jeunesse haïtienne, solidarité communautaire, justice sociale et développement social.",
      "ADIVAH's work in Haiti from 2014 to 2017: human rights, Haitian youth, community solidarity, social justice and social development.",
    ),
    keywords: l('ADIVAH Haïti, droits humains en Haïti, développement social en Haïti, jeunesse haïtienne, solidarité communautaire, justice sociale', 'ADIVAH Haiti, human rights in Haiti, social development in Haiti, Haitian youth, community solidarity, social justice'),
  },
  reviewNotes: `À VÉRIFIER AVANT PUBLICATION (ces notes ne sont jamais visibles du public)
1. Dates : les données enregistrées dans certains fichiers diffèrent de la date annoncée. « decembre 2017_1/2 » : 30 décembre 2016. « juin 2017 » : 24 juillet 2016. « 28mars20016_1/2 » : 28 août 2016. L'horloge de l'appareil a pu être mal réglée : à confirmer.
2. Consentement : des enfants d'un orphelinat (Léogâne) et une personne en fauteuil roulant (Drouillard) sont reconnaissables. Vérifier le consentement, ou celui des responsables légaux, avant publication.
3. Mars 2014 : les t-shirts portent le sigle « MJSAC », pas ADIVAH. Confirmer le lien avec l'activité.
4. Photos et activités : les photos de Hinche montrent un repas partagé, celles de Thomazeau et de juin 2017 des photos de groupe. Aucune ne montre directement une formation. Confirmer qu'elles proviennent bien de ces activités.
5. Route de Hinche : l'année 2016 ne provient que du brief. Aucun lieu n'est indiqué pour le 28 mars 2016.
6. Thomazeau : date à confirmer ; le court texte de cette section n'est pas issu de l'article fourni et doit être validé.
7. Auxcayes2017.jpg : section masquée, événement non confirmé.
8. Nom officiel : le logo indique « Intégral des Valeurs Haitiennes », le texte « Integral des Valeur Haitiennes ». Confirmer l'orthographe.
9. Légendes et descriptions d'images : rédigées d'après les photos, à valider.`,
};

/** Fichiers fournis dans client/public/images, déclarés dans la médiathèque sans être copiés. */
export const historyMedia = [
  ...historyPublication.sections.flatMap((s) => s.photos.map((p) => ({ url: p.url, width: p.width, height: p.height, alt: p.alt, category: 'photo' }))),
  { url: '/images/logo.JPG', width: 640, height: 640, alt: { fr: "Logo de l'ADIVAH", en: 'ADIVAH logo' }, category: 'logo' },
];
