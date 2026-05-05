// Descarga reseñas de ML y las exporta en formato CSV compatible con Judge.me
//
// Uso:
//   GET /api/ml/reviews?item_id=MCO1234567890            → JSON
//   GET /api/ml/reviews?item_id=MCO1234567890&format=csv → CSV para Judge.me
//   GET /api/ml/reviews?item_id=MCOU2428153953           → catálogo (prueba múltiples endpoints)

const PRODUCT_HANDLE = 'gafas-cuadradas';

export default async function handler(req, res) {
  const accessToken = process.env.ML_ACCESS_TOKEN;

  if (!accessToken) {
    return res.status(500).json({
      error: 'ML_ACCESS_TOKEN no configurado. Completa el flujo OAuth en /api/ml/auth',
    });
  }

  const { item_id, format, handle } = req.query;

  if (!item_id) {
    return res.status(400).json({ error: 'Parámetro item_id requerido' });
  }

  const authHeaders = { Authorization: `Bearer ${accessToken}` };
  const isCatalog = item_id.startsWith('MCOU');

  let allReviews = [];
  let source = '';

  if (isCatalog) {
    // Try catalog-specific endpoints for MCOU IDs
    const catalogEndpoints = [
      `https://api.mercadolibre.com/catalog/items/${item_id}/reviews`,
      `https://api.mercadolibre.com/reviews/item/${item_id}`,
    ];

    for (const url of catalogEndpoints) {
      const r = await fetch(url, { headers: authHeaders });
      const data = await r.json();

      if (!data.error) {
        const reviews = data.data ?? data.reviews ?? data.results ?? [];
        if (reviews.length > 0) {
          allReviews = reviews;
          source = url;
          break;
        }
      }
    }

    // Also try fetching via the seller's items that belong to this catalog
    if (allReviews.length === 0) {
      const userId = process.env.ML_USER_ID;
      if (userId) {
        const searchRes = await fetch(
          `https://api.mercadolibre.com/users/${userId}/items/search?catalog_product_id=${item_id}&limit=10`,
          { headers: authHeaders }
        );
        const searchData = await searchRes.json();
        const linkedIds = searchData.results ?? [];

        for (const linkedId of linkedIds.slice(0, 5)) {
          const reviewRes = await fetch(
            `https://api.mercadolibre.com/reviews/item/${linkedId}?limit=50`,
            { headers: authHeaders }
          );
          const reviewData = await reviewRes.json();
          const reviews = reviewData.data ?? [];
          allReviews.push(...reviews);
        }
        if (allReviews.length > 0) source = `linked items of ${item_id}`;
      }
    }
  } else {
    // Regular MCO item — paginate through all reviews
    let offset = 0;
    const limit = 50;

    while (true) {
      const url = `https://api.mercadolibre.com/reviews/item/${item_id}?offset=${offset}&limit=${limit}`;
      const reviewRes = await fetch(url, { headers: authHeaders });
      const data = await reviewRes.json();

      if (data.error) {
        return res.status(reviewRes.status).json({ error: data.error, message: data.message });
      }

      const page = data.data ?? [];
      allReviews.push(...page);
      if (page.length < limit) break;
      offset += limit;
    }
    source = `/reviews/item/${item_id}`;
  }

  if (format === 'csv') {
    const productHandle = handle || PRODUCT_HANDLE;
    const rows = [
      ['product_handle', 'state', 'rating', 'title', 'body', 'reviewer_name', 'reviewer_email', 'created_at'].join(','),
    ];

    for (const r of allReviews) {
      const name = r.reviewer_data?.full_name || r.reviewer?.nickname || 'Cliente';
      const reviewerId = r.reviewer_data?.id || r.reviewer?.id;
      const email = reviewerId
        ? `ml_${reviewerId}@noreply.com`
        : 'noreply@evoluxoptica.com';

      rows.push([
        csvField(productHandle),
        'published',
        r.rating ?? 5,
        csvField(r.title || ''),
        csvField(r.content || r.comment || ''),
        csvField(name),
        csvField(email),
        new Date(r.date_created || r.created_date || Date.now()).toISOString(),
      ].join(','));
    }

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="reviews-${item_id}.csv"`);
    return res.send('﻿' + rows.join('\r\n'));
  }

  res.setHeader('Cache-Control', 'no-store');
  res.json({
    item_id,
    source,
    total: allReviews.length,
    rating_avg: allReviews.length
      ? (allReviews.reduce((s, r) => s + (r.rating ?? 0), 0) / allReviews.length).toFixed(2)
      : null,
    reviews: allReviews.map(r => ({
      id: r.id,
      rating: r.rating,
      title: r.title,
      content: r.content || r.comment,
      date: r.date_created || r.created_date,
      reviewer: r.reviewer_data?.full_name || r.reviewer?.nickname || 'Anónimo',
      photos: (r.pictures ?? []).map(p => p.url || p.secure_url || p).filter(Boolean),
    })),
    csv_url: `/api/ml/reviews?item_id=${item_id}&format=csv`,
  });
}

function csvField(value) {
  return `"${String(value).replace(/"/g, '""')}"`;
}
