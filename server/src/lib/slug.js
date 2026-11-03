export function slugify(text) {
  const slug = String(text)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/, '');
  return slug || 'contenu';
}

/** Trouve un slug libre dans la collection, en ajoutant -2, -3… si nécessaire. */
export async function uniqueSlug(Model, text, currentId = null) {
  const base = slugify(text);
  for (let n = 1; ; n += 1) {
    const candidate = n === 1 ? base : `${base}-${n}`;
    const existing = await Model.findOne({ slug: candidate }).select('_id').lean();
    if (!existing || String(existing._id) === String(currentId)) return candidate;
  }
}
