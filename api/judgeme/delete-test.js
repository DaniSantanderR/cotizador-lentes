// Borra la reseña de prueba (ID 1172976028)
// GET /api/judgeme/delete-test

export default async function handler(req, res) {
  const token = process.env.JUDGEME_PRIVATE_TOKEN;
  const shop = process.env.JUDGEME_SHOP_DOMAIN;
  const id = req.query.id || '1172976028';

  const r = await fetch(`https://judge.me/api/v1/reviews/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_token: token, shop_domain: shop }),
  });

  const text = await r.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text.slice(0, 200); }

  res.json({ status: r.status, ok: r.ok, response: data });
}
