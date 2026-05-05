// Corrige fechas y agrega fotos ML a las reseñas importadas en Judge.me
//
// Uso:
//   GET /api/judgeme/fix?dry=true   → preview de cambios sin aplicarlos
//   GET /api/judgeme/fix            → aplica los cambios

// Mapa: fragmento del body → fecha original de ML
const DATE_MAP = [
  { match: 'Son perfectas aunque no son recetadas',                  date: '2026-02-25' },
  { match: 'Muy buena calidad y material',                           date: '2025-10-18' },
  { match: 'Mejor de lo esperado 100% recomendadas',                 date: '2024-02-02' },
  { match: 'Me gustaron mucho su material es de buena calidad',      date: '2023-10-31' },
  { match: 'Cumplió mis expectativas',                               date: '2025-06-16' },
  { match: 'Se ven de muy buena calidad',                            date: '2026-01-18' },
  { match: 'Están geniales iguales a las imágenes',                  date: '2026-04-08' },
  { match: 'Excelente producto es lo que esperaba',                  date: '2019-12-02' },
  { match: 'Muy bueno, se siente la diferencia',                     date: '2020-07-19' },
  { match: 'Excelente cumple lo que promete',                        date: '2020-02-27' },
  { match: 'Están bien',                                             date: '2026-03-01' },
  { match: 'Son súper saludables',                                   date: '2026-03-01' },
];

export default async function handler(req, res) {
  const token = process.env.JUDGEME_PRIVATE_TOKEN;
  const shop = process.env.JUDGEME_SHOP_DOMAIN;
  const dry = req.query.dry === 'true';

  if (!token || !shop) {
    return res.status(500).json({ error: 'JUDGEME_PRIVATE_TOKEN y JUDGEME_SHOP_DOMAIN requeridos' });
  }

  // 1. Traer todas las reseñas de Judge.me
  const params = new URLSearchParams({ api_token: token, shop_domain: shop, per_page: '100' });
  const listRes = await fetch(`https://judge.me/api/v1/reviews?${params}`);
  const listData = await listRes.json();
  const reviews = listData.reviews ?? [];

  // 2. También traer fotos desde ML
  let mlPhotos = {};
  try {
    const mlToken = process.env.ML_ACCESS_TOKEN;
    if (mlToken) {
      const mlRes = await fetch('https://api.mercadolibre.com/reviews/item/MCOU2428153953', {
        headers: { Authorization: `Bearer ${mlToken}` },
      });
      const mlData = await mlRes.json();
      for (const r of mlData.data ?? []) {
        const pics = (r.pictures ?? []).map(p => p.url || p.secure_url || p).filter(Boolean);
        if (pics.length > 0) {
          mlPhotos[r.content?.slice(0, 40)] = pics;
        }
      }
    }
  } catch {}

  // 3. Para cada reseña, encontrar la fecha correcta y aplicarla
  const results = [];

  for (const rv of reviews) {
    const body = rv.body || '';
    const match = DATE_MAP.find(m => body.includes(m.match));

    if (!match) {
      results.push({ id: rv.id, title: rv.title, action: 'sin coincidencia — sin cambios' });
      continue;
    }

    // Buscar fotos de ML para esta reseña
    const photoKey = Object.keys(mlPhotos).find(k => body.includes(k.slice(0, 20)));
    const photos = photoKey ? mlPhotos[photoKey] : [];

    const payload = {
      api_token: token,
      shop_domain: shop,
      review: {
        created_at: match.date,
        ...(photos.length > 0 && {
          pictures_attributes: photos.map(url => ({ url })),
        }),
      },
    };

    if (!dry) {
      const updateRes = await fetch(`https://judge.me/api/v1/reviews/${rv.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const updateData = await updateRes.json();
      results.push({
        id: rv.id,
        title: rv.title,
        date_set: match.date,
        photos_added: photos.length,
        ok: updateRes.ok,
        error: updateData.error,
      });
    } else {
      results.push({
        id: rv.id,
        title: rv.title,
        date_will_set: match.date,
        photos_will_add: photos.length,
      });
    }
  }

  res.json({ dry, total: results.length, results });
}
