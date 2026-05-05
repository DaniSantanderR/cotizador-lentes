export default async function handler(req, res) {
  const accessToken = process.env.ML_ACCESS_TOKEN;
  const userId = process.env.ML_USER_ID;

  if (!accessToken || !userId) {
    return res.status(500).json({ error: 'ML_ACCESS_TOKEN y ML_USER_ID requeridos. Completa el flujo OAuth en /api/ml/auth' });
  }

  // List active item IDs for the seller
  const searchRes = await fetch(
    `https://api.mercadolibre.com/users/${userId}/items/search?status=active&limit=50`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  const searchData = await searchRes.json();

  if (searchData.error) {
    return res.status(searchRes.status).json({ error: searchData.error, message: searchData.message });
  }

  const ids = searchData.results ?? [];

  if (ids.length === 0) {
    return res.json({ items: [] });
  }

  // Fetch titles and URLs for each item (multiget, max 20 at a time)
  const chunks = [];
  for (let i = 0; i < ids.length; i += 20) {
    chunks.push(ids.slice(i, i + 20));
  }

  const items = [];
  for (const chunk of chunks) {
    const detailRes = await fetch(
      `https://api.mercadolibre.com/items?ids=${chunk.join(',')}&attributes=id,title,permalink,status`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const details = await detailRes.json();
    for (const entry of details) {
      if (entry.code === 200) {
        const { id, title, permalink, status } = entry.body;
        items.push({ id, title, permalink, status });
      }
    }
  }

  res.setHeader('Cache-Control', 'no-store');
  res.json({ items });
}
