const CLIENT_ID = process.env.ML_CLIENT_ID;
const CLIENT_SECRET = process.env.ML_CLIENT_SECRET;
const REDIRECT_URI = 'https://cotizador-lentes.vercel.app/api/ml/callback';

export default async function handler(req, res) {
  const { code, error } = req.query;

  if (error) {
    return res.status(400).send(page('Error de autorización', `<p class="error">ML respondió con error: <code>${error}</code></p>`));
  }

  if (!code) {
    return res.status(400).send(page('Sin código', '<p class="error">No se recibió código de autorización.</p>'));
  }

  let data;
  try {
    const response = await fetch('https://api.mercadolibre.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
        redirect_uri: REDIRECT_URI,
      }),
    });
    data = await response.json();
  } catch (err) {
    return res.status(500).send(page('Error', `<p class="error">${err.message}</p>`));
  }

  if (data.error) {
    return res.status(400).send(page('Error de ML', `<p class="error">${data.error}: ${data.message}</p>`));
  }

  const expiresInHours = Math.round(data.expires_in / 3600);

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(page('Tokens obtenidos', `
    <p>Agrega estas 3 variables en <strong>Vercel → Settings → Environment Variables</strong> y redespliega.</p>
    <table>
      <tr><th>Variable</th><th>Valor</th></tr>
      <tr>
        <td>ML_ACCESS_TOKEN</td>
        <td><code>${data.access_token}</code></td>
      </tr>
      <tr>
        <td>ML_REFRESH_TOKEN</td>
        <td><code>${data.refresh_token}</code></td>
      </tr>
      <tr>
        <td>ML_USER_ID</td>
        <td><code>${data.user_id}</code></td>
      </tr>
    </table>
    <p class="note">El access token expira en ~${expiresInHours}h. Usa <code>/api/ml/refresh</code> para renovarlo sin volver a autorizarte.</p>
  `));
}

function page(title, content) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${title} — Evolux ML</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 860px; margin: 2rem auto; padding: 1rem; color: #1a1a1a; }
    h2 { margin-bottom: 1rem; }
    table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
    th, td { border: 1px solid #ddd; padding: .6rem 1rem; text-align: left; vertical-align: top; }
    th { background: #f5f5f5; white-space: nowrap; }
    code { font-size: .82rem; word-break: break-all; background: #f0f0f0; padding: 2px 4px; border-radius: 3px; }
    .error { color: #c00; }
    .note { color: #666; font-size: .9rem; margin-top: 1.5rem; }
  </style>
</head>
<body>
  <h2>Evolux × Mercado Libre — ${title}</h2>
  ${content}
</body>
</html>`;
}
