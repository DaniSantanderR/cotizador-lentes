export default async function handler(req, res) {
  const accessToken = process.env.ML_ACCESS_TOKEN;

  if (!accessToken) {
    return res.status(500).json({ error: 'ML_ACCESS_TOKEN requerido. Completa el flujo OAuth en /api/ml/auth' });
  }

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
  res.json({
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
