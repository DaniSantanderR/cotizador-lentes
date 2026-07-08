export default async function handler(req, res) {
  const accessToken = process.env.ML_ACCESS_TOKEN;

  if (!accessToken) {
    return res.status(500).json({ error: 'ML_ACCESS_TOKEN requerido. Completa el flujo OAuth en /api/ml/auth' });
  }

  if (req.method === 'GET') {
    const { item_id } = req.query;

    if (!item_id) {
      return res.status(400).json({ error: 'item_id es requerido, ej. ?item_id=MCO577534249' });
    }

    const itemRes = await fetch(`https://api.mercadolibre.com/items/${item_id}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const data = await itemRes.json();

    if (!itemRes.ok) {
      return res.status(itemRes.status).json({ error: data.error, message: data.message, cause: data.cause });
    }

    res.setHeader('Cache-Control', 'no-store');
    return res.json({
      id: data.id,
      title: data.title,
      status: data.status,
      sub_status: data.sub_status,
      health: data.health,
      catalog_listing: data.catalog_listing,
      catalog_product_id: data.catalog_product_id,
      permalink: data.permalink,
      pictures: data.pictures,
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Usa GET ?item_id=... para consultar, o POST con { item_id, picture_urls: [...] } para actualizar' });
  }

  const { item_id, picture_urls, available_quantity, status } = req.body ?? {};

  if (!item_id) {
    return res.status(400).json({ error: 'item_id es requerido' });
  }

  const body = {};
  if (Array.isArray(picture_urls) && picture_urls.length > 0) {
    body.pictures = picture_urls.map((source) => ({ source }));
  }
  if (available_quantity !== undefined) {
    body.available_quantity = available_quantity;
  }
  if (status !== undefined) {
    body.status = status;
  }

  if (Object.keys(body).length === 0) {
    return res.status(400).json({ error: 'Provee al menos uno: picture_urls, available_quantity o status' });
  }

  const putRes = await fetch(`https://api.mercadolibre.com/items/${item_id}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await putRes.json();

  if (!putRes.ok) {
    return res.status(putRes.status).json({ error: data.error, message: data.message, cause: data.cause });
  }

  res.json({ ok: true, id: data.id, status: data.status, sub_status: data.sub_status, available_quantity: data.available_quantity, pictures: data.pictures });
}
