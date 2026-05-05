// Lista todas las reseñas importadas en Judge.me con sus IDs internos
// GET /api/judgeme/reviews

export default async function handler(req, res) {
  const token = process.env.JUDGEME_PRIVATE_TOKEN;
  const shop = process.env.JUDGEME_SHOP_DOMAIN;

  if (!token || !shop) {
    return res.status(500).json({ error: 'JUDGEME_PRIVATE_TOKEN y JUDGEME_SHOP_DOMAIN requeridos' });
  }

  const params = new URLSearchParams({
    api_token: token,
    shop_domain: shop,
    per_page: '100',
    page: '1',
  });

  const r = await fetch(`https://judge.me/api/v1/reviews?${params}`);
  const data = await r.json();

  if (!r.ok) {
    return res.status(r.status).json(data);
  }

  const reviews = (data.reviews ?? []).map(rv => ({
    id: rv.id,
    title: rv.title,
    body: rv.body?.slice(0, 80),
    rating: rv.rating,
    created_at: rv.created_at,
    reviewer: rv.reviewer?.name,
    pictures: rv.pictures?.map(p => p.urls?.original || p.url) ?? [],
  }));

  res.json({ total: reviews.length, reviews });
}
