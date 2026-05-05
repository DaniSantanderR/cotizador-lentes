// Descarga reseñas de un producto de Mercado Libre y las exporta
// en formato CSV compatible con Judge.me
//
// Uso:
//   GET /api/ml/reviews?item_id=MCO1234567890            → JSON
//   GET /api/ml/reviews?item_id=MCO1234567890&format=csv → CSV para Judge.me
//
// El item_id se obtiene desde /api/ml/items

const PRODUCT_HANDLE = 'gafas-cuadradas'; // handle Shopify por defecto

export default async function handler(req, res) {
  const accessToken = process.env.ML_ACCESS_TOKEN;

  if (!accessToken) {
    return res.status(500).json({
      error: 'ML_ACCESS_TOKEN no configurado. Completa el flujo OAuth en /api/ml/auth',
    });
  }

  const { item_id, format, handle } = req.query;

  if (!item_id) {
    return res.status(400).json({ error: 'Parámetro item_id requerido (ej: MCO1234567890)' });
  }

  // Fetch all review pages
  const allReviews = [];
  let offset = 0;
  const limit = 50;

  while (true) {
    const url = `https://api.mercadolibre.com/reviews/item/${item_id}?offset=${offset}&limit=${limit}`;
    const reviewRes = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const data = await reviewRes.json();

    if (data.error) {
      return res.status(reviewRes.status).json({ error: data.error, message: data.message });
    }

    const page = data.data ?? [];
    allReviews.push(...page);

    if (page.length < limit) break;
    offset += limit;
  }

  if (format === 'csv') {
    const productHandle = handle || PRODUCT_HANDLE;
    const rows = [
      ['product_handle', 'state', 'rating', 'title', 'body', 'reviewer_name', 'reviewer_email', 'created_at'].join(','),
    ];

    for (const r of allReviews) {
      const name = r.reviewer_data?.full_name || 'Cliente';
      const email = r.reviewer_data?.id
        ? `ml_${r.reviewer_data.id}@noreply.com`
        : 'noreply@evoluxoptica.com';

      rows.push([
        csvField(productHandle),
        'published',
        r.rating ?? 5,
        csvField(r.title || ''),
        csvField(r.content || ''),
        csvField(name),
        csvField(email),
        new Date(r.date_created).toISOString(),
      ].join(','));
    }

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="reviews-${item_id}.csv"`);
    return res.send('﻿' + rows.join('\r\n')); // BOM for Excel compatibility
  }

  // JSON response with summary
  res.setHeader('Cache-Control', 'no-store');
  res.json({
    item_id,
    total: allReviews.length,
    rating_avg: allReviews.length
      ? (allReviews.reduce((s, r) => s + (r.rating ?? 0), 0) / allReviews.length).toFixed(2)
      : null,
    reviews: allReviews.map(r => ({
      id: r.id,
      rating: r.rating,
      title: r.title,
      content: r.content,
      date: r.date_created,
      reviewer: r.reviewer_data?.full_name || 'Anónimo',
    })),
    csv_url: `/api/ml/reviews?item_id=${item_id}&format=csv`,
  });
}

function csvField(value) {
  return `"${String(value).replace(/"/g, '""')}"`;
}
