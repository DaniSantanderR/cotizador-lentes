// Borra y recrea las reseñas de Judge.me para que respeten las fechas originales de ML.
// Judge.me ignora `created_at` en PUT, pero sí lo respeta al crear (POST).
//
// Uso:
//   GET /api/judgeme/recreate?dry=true   → preview de lo que se va a hacer
//   GET /api/judgeme/recreate            → borra las 12 y las recrea con fechas correctas

const DATE_MAP = [
  { match: 'Son perfectas aunque no son recetadas',                  date: '2026-02-25T00:00:00-05:00' },
  { match: 'al primer uso si se sienten duros en la cabeza',         date: '2025-10-18T00:00:00-05:00' },
  { match: 'Mejor de lo esperado 100% recomendadas',                 date: '2024-02-02T00:00:00-05:00' },
  { match: 'Me gustaron mucho su material es de buena calidad',      date: '2023-10-31T00:00:00-05:00' },
  { match: 'Cumplió mis expectativas',                               date: '2025-06-16T00:00:00-05:00' },
  { match: 'Se ven de muy buena calidad',                            date: '2026-01-18T00:00:00-05:00' },
  { match: 'Están geniales iguales a las imágenes',                  date: '2026-04-08T00:00:00-05:00' },
  { match: 'Excelente producto es lo que esperaba',                  date: '2019-12-02T00:00:00-05:00' },
  { match: 'Muy bueno, se siente la diferencia',                     date: '2020-07-19T00:00:00-05:00' },
  { match: 'Excelente cumple lo que promete',                        date: '2020-02-27T00:00:00-05:00' },
  { match: 'Están bien',                                             date: '2026-03-01T00:00:00-05:00' },
  { match: 'Son súper saludables',                                   date: '2026-03-01T00:00:00-05:00' },
];

export default async function handler(req, res) {
  const token = process.env.JUDGEME_PRIVATE_TOKEN;
  const shop = process.env.JUDGEME_SHOP_DOMAIN;
  const dry = req.query.dry === 'true';

  if (!token || !shop) {
    return res.status(500).json({ error: 'JUDGEME_PRIVATE_TOKEN y JUDGEME_SHOP_DOMAIN requeridos' });
  }

  // 1. Traer todas las reseñas actuales con datos completos
  const params = new URLSearchParams({ api_token: token, shop_domain: shop, per_page: '100' });
  const listRes = await fetch(`https://judge.me/api/v1/reviews?${params}`);
  const listData = await listRes.json();
  const reviews = listData.reviews ?? [];

  if (reviews.length === 0) {
    return res.json({ dry, message: 'No hay reseñas en Judge.me', total: 0, results: [] });
  }

  const results = [];

  for (const rv of reviews) {
    const body = rv.body || '';
    const dateEntry = DATE_MAP.find(m => body.includes(m.match));

    if (!dateEntry) {
      results.push({ id: rv.id, title: rv.title, action: 'sin coincidencia — omitida' });
      continue;
    }

    if (dry) {
      results.push({
        id: rv.id,
        title: rv.title,
        body_preview: body.slice(0, 70),
        date_will_set: dateEntry.date,
        product_id: rv.product_id,
        reviewer: rv.reviewer?.name,
      });
      continue;
    }

    // 2. Borrar la reseña existente
    const delRes = await fetch(
      `https://judge.me/api/v1/reviews/${rv.id}?api_token=${token}&shop_domain=${encodeURIComponent(shop)}`,
      { method: 'DELETE' }
    );

    if (!delRes.ok) {
      const delBody = await delRes.text();
      results.push({ id: rv.id, title: rv.title, action: 'error al borrar', status: delRes.status, detail: delBody });
      continue;
    }

    // 3. Recrear con la fecha correcta
    const createPayload = {
      api_token: token,
      shop_domain: shop,
      platform: 'shopify',
      id: rv.product_id,
      rating: rv.rating,
      title: rv.title,
      body: rv.body,
      name: rv.reviewer?.name || 'Comprador verificado',
      email: rv.reviewer?.email || 'noreply@evoluxoptica.com',
      created_at: dateEntry.date,
      verified_buyer: true,
      source: 'api',
    };

    const createRes = await fetch('https://judge.me/api/v1/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(createPayload),
    });
    const createData = await createRes.json();

    results.push({
      old_id: rv.id,
      new_id: createData.review?.id,
      title: rv.title,
      date_set: dateEntry.date,
      ok: createRes.ok,
      error: createData.error,
    });
  }

  res.json({ dry, total: results.length, results });
}
