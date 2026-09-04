export default async function handler(req, res) {
  const accessToken = process.env.ML_ACCESS_TOKEN;
  const userId = process.env.ML_USER_ID;

  if (!accessToken || !userId) {
    return res.status(500).json({ error: 'ML_ACCESS_TOKEN y ML_USER_ID requeridos. Completa el flujo OAuth en /api/ml/auth' });
  }

  // ?resource=orders — datos de ventas reales (ingreso, comisión ML) para
  // proyectos externos (ej. ml-finanzas). Requiere ML_SYNC_SECRET porque
  // expone montos de venta reales, a diferencia del catálogo (público de todos modos).
  if (req.query.resource === 'orders') {
    const secret = process.env.ML_SYNC_SECRET;
    if (!secret || req.query.secret !== secret) {
      return res.status(401).json({ error: 'secret inválido o faltante' });
    }
    return handleOrders(req, res, accessToken, userId);
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

// Órdenes pagadas del vendedor, una fila por línea de ítem (una orden puede
// traer varios ítems). Pensado para sincronizar hacia ml-finanzas.
// ?date_from=&date_to= (ISO, ej. 2026-08-01T00:00:00.000-05:00) — por defecto últimos 30 días.
// Nota: costo de envío NO se incluye todavía (requeriría 1 llamada extra por
// orden a /shipments/{id} — se deja para una siguiente iteración si hace falta).
async function handleOrders(req, res, accessToken, userId) {
  const now = new Date();
  const defaultFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const dateFrom = req.query.date_from || defaultFrom.toISOString();
  const dateTo = req.query.date_to || now.toISOString();

  const ventas = [];
  let offset = 0;
  const limit = 50;
  while (true) {
    const url = `https://api.mercadolibre.com/orders/search?seller=${userId}&order.status=paid&order.date_created.from=${encodeURIComponent(dateFrom)}&order.date_created.to=${encodeURIComponent(dateTo)}&sort=date_desc&limit=${limit}&offset=${offset}`;
    const searchRes = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
    const searchData = await searchRes.json();

    if (searchData.error) {
      return res.status(searchRes.status).json({ error: searchData.error, message: searchData.message });
    }

    for (const order of searchData.results ?? []) {
      for (const orderItem of order.order_items ?? []) {
        ventas.push({
          order_id: order.id,
          fecha: order.date_created,
          estado: order.status,
          item_id: orderItem.item?.id,
          titulo: orderItem.item?.title,
          cantidad: orderItem.quantity,
          precio_unitario: orderItem.unit_price,
          comision_ml: orderItem.sale_fee ?? 0,
        });
      }
    }

    const total = searchData.paging?.total ?? ventas.length;
    offset += limit;
    if (offset >= total || (searchData.results ?? []).length === 0) break;
  }

  res.setHeader('Cache-Control', 'no-store');
  res.json({ total: ventas.length, date_from: dateFrom, date_to: dateTo, ventas });
}
