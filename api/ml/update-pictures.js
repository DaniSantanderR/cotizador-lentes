export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Usa POST con { item_id, picture_urls: [...] }' });
  }

  const accessToken = process.env.ML_ACCESS_TOKEN;

  if (!accessToken) {
    return res.status(500).json({ error: 'ML_ACCESS_TOKEN requerido. Completa el flujo OAuth en /api/ml/auth' });
  }

  const { item_id, picture_urls } = req.body ?? {};

  if (!item_id || !Array.isArray(picture_urls) || picture_urls.length === 0) {
    return res.status(400).json({ error: 'item_id y picture_urls (array de URLs, no vacío) son requeridos' });
  }

  const putRes = await fetch(`https://api.mercadolibre.com/items/${item_id}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      pictures: picture_urls.map((source) => ({ source })),
    }),
  });

  const data = await putRes.json();

  if (!putRes.ok) {
    return res.status(putRes.status).json({ error: data.error, message: data.message, cause: data.cause });
  }

  res.json({ ok: true, id: data.id, pictures: data.pictures });
}
