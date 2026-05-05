// Debug endpoint para probar creación de reseñas en Judge.me
// GET /api/judgeme/test-create

export default async function handler(req, res) {
  const token = process.env.JUDGEME_PRIVATE_TOKEN;
  const shop = process.env.JUDGEME_SHOP_DOMAIN;

  const payload = {
    api_token: token,
    shop_domain: shop,
    platform: 'shopify',
    id: 10678904291640,
    rating: 5,
    title: 'TEST borrar',
    body: 'Reseña de prueba técnica - por favor borrar',
    name: 'Test User',
    email: 'test_delete@noreply.com',
    created_at: '2023-06-15',
  };

  const r = await fetch('https://judge.me/api/v1/reviews', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const text = await r.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }

  res.json({ status: r.status, ok: r.ok, payload_sent: payload, response: data });
}
