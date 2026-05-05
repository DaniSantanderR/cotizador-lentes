const CLIENT_ID = process.env.ML_CLIENT_ID;
const CLIENT_SECRET = process.env.ML_CLIENT_SECRET;

export default async function handler(req, res) {
  const refreshToken = process.env.ML_REFRESH_TOKEN;

  if (!refreshToken) {
    return res.status(500).json({ error: 'ML_REFRESH_TOKEN no configurado' });
  }

  const response = await fetch('https://api.mercadolibre.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: refreshToken,
    }),
  });

  const data = await response.json();

  if (data.error) {
    return res.status(400).json({ error: data.error, message: data.message });
  }

  // Return new tokens so user can update Vercel env vars
  res.json({
    ok: true,
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_in: data.expires_in,
    note: 'Actualiza ML_ACCESS_TOKEN y ML_REFRESH_TOKEN en Vercel → Environment Variables',
  });
}
