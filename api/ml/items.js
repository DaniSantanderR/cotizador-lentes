export default async function handler(req, res) {
  const accessToken = process.env.ML_ACCESS_TOKEN;
  const userId = process.env.ML_USER_ID;

  if (!accessToken || !userId) {
    return res.status(500).json({ error: 'ML_ACCESS_TOKEN y ML_USER_ID requeridos. Completa el flujo OAuth en /api/ml/auth' });
  }

  // List ALL item IDs for the seller, paginated. No status filter here on purpose:
  // ML's items/search ?status=active filter has been observed returning stale/empty
  // results (indexing lag) even when items are genuinely active — see skill /ml.
  // Real status is fetched per-item below instead.
  const ids = [];
  let offset = 0;
  const pageLimit = 50;
  while (true) {
    const searchRes = await fetch(
      `https://api.mercadolibre.com/users/${userId}/items/search?limit=${pageLimit}&offset=${offset}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const searchData = await searchRes.json();

    if (searchData.error) {
      return res.status(searchRes.status).json({ error: searchData.error, message: searchData.message });
    }

    ids.push(...(searchData.results ?? []));

    const total = searchData.paging?.total ?? ids.length;
    offset += pageLimit;
    if (offset >= total || (searchData.results ?? []).length === 0) break;
  }

  if (ids.length === 0) {
    return res.json({ items: [], summary: {} });
  }

  // Fetch real status/details for each item (multiget, max 20 ids per ML request)
  const chunks = [];
  for (let i = 0; i < ids.length; i += 20) {
    chunks.push(ids.slice(i, i + 20));
  }

  let items = [];
  for (const chunk of chunks) {
    const detailRes = await fetch(
      `https://api.mercadolibre.com/items?ids=${chunk.join(',')}&attributes=id,title,permalink,status,sub_status,available_quantity,price`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const details = await detailRes.json();
    for (const entry of details) {
      if (entry.code === 200) {
        const { id, title, permalink, status, sub_status, available_quantity, price } = entry.body;
        items.push({ id, title, permalink, status, sub_status, available_quantity, price });
      }
    }
  }

  // Optional client-side filter by real status, e.g. ?status=active
  const statusFilter = req.query.status;
  if (statusFilter) {
    items = items.filter((item) => item.status === statusFilter);
  }

  const summary = {};
  for (const item of items) {
    const key = item.sub_status?.length ? `${item.status}:${item.sub_status.join(',')}` : item.status;
    summary[key] = (summary[key] ?? 0) + 1;
  }

  res.setHeader('Cache-Control', 'no-store');
  res.json({ total: items.length, summary, items });
}
