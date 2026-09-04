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

// Vercel: esta función puede tardar bastante en un backfill grande (fetch de
// shipments uno por uno) — darle más margen que el default de 10s.
export const config = { maxDuration: 60 };

// Órdenes pagadas del vendedor, una fila por línea de ítem (una orden puede
// traer varios ítems). Pensado para sincronizar hacia ml-finanzas.
// ?date_from=&date_to= (ISO, ej. 2026-08-01T00:00:00.000-05:00) — por defecto
// los últimos 366 días. Nota: la propia API de orders/search de ML NO
// devuelve nada más antiguo que ~12 meses atrás sin importar qué date_from
// se le mande (límite real de ML, no nuestro) — verificado 4 sep 2026.
//
// costo_envio: cuánto paga Evolux (no el comprador) por el envío de cada
// línea. Requiere 1 llamada a /shipments/{id} por orden (deduplicada por
// shipping.id) — fórmula verificada con datos reales:
//   costo_envio_orden = max(0, shipment.base_cost - shipment.shipping_option.cost)
// (shipping_option.cost = lo que pagó el comprador; si fue envío gratis para
// el comprador, ese campo da 0 y Evolux absorbe base_cost completo). Se
// prorratea entre las líneas de la orden según su participación en el ingreso.
async function handleOrders(req, res, accessToken, userId) {
  const now = new Date();
  const defaultFrom = new Date(now.getTime() - 366 * 24 * 60 * 60 * 1000);
  const dateFrom = req.query.date_from || defaultFrom.toISOString();
  const dateTo = req.query.date_to || now.toISOString();
  const incluirEnvio = req.query.shipping !== '0';

  const ordenes = [];
  let offset = 0;
  const limit = 50;
  while (true) {
    const url = `https://api.mercadolibre.com/orders/search?seller=${userId}&order.status=paid&order.date_created.from=${encodeURIComponent(dateFrom)}&order.date_created.to=${encodeURIComponent(dateTo)}&sort=date_desc&limit=${limit}&offset=${offset}`;
    const searchRes = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
    const searchData = await searchRes.json();

    if (searchData.error) {
      return res.status(searchRes.status).json({ error: searchData.error, message: searchData.message });
    }

    ordenes.push(...(searchData.results ?? []));

    const total = searchData.paging?.total ?? ordenes.length;
    offset += limit;
    if (offset >= total || (searchData.results ?? []).length === 0) break;
  }

  // Costo de envío por orden (dedupe por shipping.id, concurrencia limitada
  // para no disparar cientos de requests en paralelo ni tardar demasiado).
  const costoEnvioPorShippingId = new Map();
  if (incluirEnvio) {
    const shippingIds = [...new Set(ordenes.map((o) => o.shipping?.id).filter(Boolean))];
    const CONCURRENCIA = 12;
    for (let i = 0; i < shippingIds.length; i += CONCURRENCIA) {
      const lote = shippingIds.slice(i, i + CONCURRENCIA);
      await Promise.all(
        lote.map(async (shippingId) => {
          try {
            const shipRes = await fetch(`https://api.mercadolibre.com/shipments/${shippingId}`, {
              headers: { Authorization: `Bearer ${accessToken}` },
            });
            const ship = await shipRes.json();
            if (!shipRes.ok) return;
            const baseCost = ship.base_cost ?? 0;
            const pagadoPorComprador = ship.shipping_option?.cost ?? 0;
            costoEnvioPorShippingId.set(shippingId, Math.max(0, baseCost - pagadoPorComprador));
          } catch {
            // deja sin costo de envío esta orden puntual en vez de tumbar todo el sync
          }
        })
      );
    }
  }

  const ventas = [];
  for (const order of ordenes) {
    const items = order.order_items ?? [];
    const ingresoOrden = items.reduce((s, oi) => s + oi.unit_price * oi.quantity, 0);
    const costoEnvioOrden = costoEnvioPorShippingId.get(order.shipping?.id);

    for (const orderItem of items) {
      const ingresoItem = orderItem.unit_price * orderItem.quantity;
      const proporcion = ingresoOrden > 0 ? ingresoItem / ingresoOrden : 1 / items.length;
      ventas.push({
        order_id: order.id,
        fecha: order.date_created,
        estado: order.status,
        item_id: orderItem.item?.id,
        titulo: orderItem.item?.title,
        cantidad: orderItem.quantity,
        precio_unitario: orderItem.unit_price,
        comision_ml: orderItem.sale_fee ?? 0,
        costo_envio: costoEnvioOrden !== undefined ? Math.round(costoEnvioOrden * proporcion) : null,
      });
    }
  }

  res.setHeader('Cache-Control', 'no-store');
  res.json({ total: ventas.length, date_from: dateFrom, date_to: dateTo, ventas });
}
