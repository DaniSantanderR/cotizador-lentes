// Recibe notificaciones de Mercado Libre (orders, questions, items, etc.)
// Configurado en: ML Developers → tu app → Notificaciones
// URL: https://cotizador-lentes.vercel.app/api/ml/webhook

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  // ML expects a 200 response quickly, log and return
  console.log('[ML Webhook]', JSON.stringify(body));

  // body.topic: "orders_v2" | "questions" | "items" | "payments" | etc.
  // body.resource: "/orders/123" | "/questions/456" etc.
  // body.user_id: ML seller user ID
  // body.application_id: ML app ID
  // body.attempts: number of delivery attempts

  res.status(200).json({ received: true });
}
