/** Matrice des droits. C'est la seule source de vérité : le serveur l'applique et le tableau de bord l'affiche. */
const S = 'super_admin';
const C = 'content_admin';
const E = 'editor';
const V = 'viewer';

export const PERMISSIONS = {
  'content.read': [S, C, E, V],
  'content.write': [S, C, E],
  'content.review': [S, C],
  'content.delete': [S, C],
  'media.write': [S, C, E],
  'media.manage': [S, C],
  'pages.write': [S, C],
  'messages.manage': [S],
  'settings.write': [S],
  'users.manage': [S],
  'audit.read': [S],
};

export const can = (role, permission) => Boolean(PERMISSIONS[permission]?.includes(role));
export const permissionsOf = (role) => Object.keys(PERMISSIONS).filter((p) => can(role, p));
