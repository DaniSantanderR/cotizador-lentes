const CLIENT_ID = process.env.ML_CLIENT_ID;
const REDIRECT_URI = 'https://cotizador-lentes.vercel.app/api/ml/callback';

export default function handler(req, res) {
  if (!CLIENT_ID) {
    return res.status(500).json({ error: 'ML_CLIENT_ID no configurado en Vercel' });
  }

  const url = new URL('https://auth.mercadolibre.com.co/authorization');
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', CLIENT_ID);
  url.searchParams.set('redirect_uri', REDIRECT_URI);

  res.redirect(302, url.toString());
}
