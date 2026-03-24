export const config = { maxDuration: 30 };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  try {
    const { path, content, message, sha } = req.body;
    const ghToken = process.env.GITHUB_TOKEN;
    const owner = process.env.GH_OWNER || 'kim02160216';
    const repo = process.env.GH_REPO || 'Recruit';

    if (!ghToken) { res.status(500).json({ error: 'GITHUB_TOKEN not configured' }); return; }

    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
    const encoded = Buffer.from(content).toString('base64');

    // 기존 파일 SHA 조회 (없으면 신규 생성)
    let fileSha = sha;
    if (!fileSha) {
      try {
        const r = await fetch(apiUrl, { headers: { 'Authorization': `Bearer ${ghToken}`, 'Accept': 'application/vnd.github+json' } });
        if (r.ok) { const d = await r.json(); fileSha = d.sha; }
      } catch {}
    }

    const body = { message, content: encoded };
    if (fileSha) body.sha = fileSha;

    const r = await fetch(apiUrl, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${ghToken}`, 'Accept': 'application/vnd.github+json', 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await r.json();
    if (!r.ok) { res.status(r.status).json({ error: data.message }); return; }
    res.status(200).json({ success: true, sha: data.content?.sha, path: data.content?.path });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
}