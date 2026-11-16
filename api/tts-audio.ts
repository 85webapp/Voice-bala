import type { IncomingMessage, ServerResponse } from 'node:http';
import { Buffer } from 'node:buffer';

type VercelRequest = IncomingMessage & {
  query?: Record<string, string | string[] | undefined>;
  body?: any;
};

const ttsAudioCache = new Map<string, Buffer>();

function splitTtsText(str: string, maxLength = 200): string[] {
  const normalized = str
    .replace(/['"“”‘’]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (normalized.length <= maxLength) return [normalized];

  const chunks: string[] = [];
  const sentences = normalized.split(/(?<=[।!?.\n])\s+/);
  let cur = '';

  for (const sentence of sentences) {
    if (!sentence.trim()) continue;

    if ((cur + ' ' + sentence).trim().length <= maxLength) {
      cur = cur ? `${cur} ${sentence}` : sentence;
    } else {
      if (cur.trim()) chunks.push(cur.trim());
      if (sentence.length > maxLength) {
        const subParts = sentence.split(/(?<=[,;])\s+/);
        let subCur = '';
        for (const part of subParts) {
          if ((subCur + ' ' + part).trim().length <= maxLength) {
            subCur = subCur ? `${subCur} ${part}` : part;
          } else {
            if (subCur.trim()) chunks.push(subCur.trim());
            subCur = part;
          }
        }
        cur = subCur;
      } else {
        cur = sentence;
      }
    }
  }

  if (cur.trim()) chunks.push(cur.trim());
  return chunks.length > 0 ? chunks : [normalized];
}

async function synthesizeGoogleTtsBuffer(trimmedText: string, tl: string): Promise<Buffer> {
  const cacheKey = `${tl}:${trimmedText}`;
  if (ttsAudioCache.has(cacheKey)) {
    return ttsAudioCache.get(cacheKey)!;
  }

  const chunks = splitTtsText(trimmedText, 200);

  const audioResponses = await Promise.all(
    chunks.map(async (chunk) => {
      const clients = ['tw-ob', 'gtx'];
      let lastStatus = 500;

      for (const client of clients) {
        const host = client === 'gtx' ? 'https://translate.googleapis.com' : 'https://translate.google.com';
        const googleTTSUrl = `${host}/translate_tts?ie=UTF-8&q=${encodeURIComponent(chunk)}&tl=${encodeURIComponent(tl)}&client=${client}`;
        const upstream = await fetch(googleTTSUrl, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            Referer: 'https://translate.google.com/'
          }
        });
        lastStatus = upstream.status;
        if (upstream.ok) {
          const ab = await upstream.arrayBuffer();
          if (ab.byteLength > 0) {
            return Buffer.from(ab);
          }
        }
      }

      throw new Error(`Upstream TTS failed: ${lastStatus}`);
    })
  );

  const finalBuffer = Buffer.concat(audioResponses);

  if (ttsAudioCache.size > 200) {
    const firstKey = ttsAudioCache.keys().next().value;
    if (firstKey) ttsAudioCache.delete(firstKey);
  }
  ttsAudioCache.set(cacheKey, finalBuffer);
  return finalBuffer;
}

async function readJsonBody(req: VercelRequest): Promise<Record<string, any>> {
  if (req.body && typeof req.body === 'object') {
    return req.body;
  }
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return await new Promise((resolve) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer | string) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8').trim();
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        resolve({});
      }
    });
    req.on('error', () => resolve({}));
  });
}

function sendJson(res: ServerResponse, statusCode: number, payload: unknown) {
  const body = JSON.stringify(payload);
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Length', Buffer.byteLength(body).toString());
  res.end(body);
}

function sendAudioBufferWithRange(req: VercelRequest, res: ServerResponse, buffer: Buffer) {
  const total = buffer.length;
  const rangeHeader = req.headers.range;
  const range = Array.isArray(rangeHeader) ? rangeHeader[0] : rangeHeader;

  if (range) {
    const match = /bytes=(\d*)-(\d*)/.exec(range);
    if (match) {
      const start = match[1] ? parseInt(match[1], 10) : 0;
      const end = match[2] ? Math.min(parseInt(match[2], 10), total - 1) : total - 1;
      if (start >= 0 && start <= end && start < total) {
        const chunk = buffer.subarray(start, end + 1);
        res.statusCode = 206;
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Content-Range', `bytes ${start}-${end}/${total}`);
        res.setHeader('Content-Length', chunk.length.toString());
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
        res.end(chunk);
        return;
      }
    }
  }

  res.statusCode = 200;
  res.setHeader('Content-Type', 'audio/mpeg');
  res.setHeader('Content-Length', total.toString());
  res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
  res.setHeader('Accept-Ranges', 'bytes');
  res.end(buffer);
}

export default async function handler(req: VercelRequest, res: ServerResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Range');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  try {
    let q = '';
    let tl = 'hi';

    if (req.method === 'POST') {
      const body = await readJsonBody(req);
      q = typeof body?.q === 'string' ? body.q : typeof body?.text === 'string' ? body.text : '';
      tl = typeof body?.tl === 'string' ? body.tl : typeof body?.lang === 'string' ? body.lang : 'hi';
    } else {
      const queryObj = req.query || {};
      const parsedUrl = new URL(req.url || '/api/tts-audio', 'http://localhost');
      const rawQ = queryObj.q ?? queryObj.text ?? parsedUrl.searchParams.get('q') ?? parsedUrl.searchParams.get('text') ?? '';
      const rawTl = queryObj.tl ?? queryObj.lang ?? parsedUrl.searchParams.get('tl') ?? parsedUrl.searchParams.get('lang') ?? 'hi';
      q = Array.isArray(rawQ) ? rawQ[0] || '' : String(rawQ || '');
      tl = Array.isArray(rawTl) ? rawTl[0] || 'hi' : String(rawTl || 'hi');
    }

    if (!q.trim()) {
      sendJson(res, 400, { error: 'Text query (q) is required' });
      return;
    }

    const buffer = await synthesizeGoogleTtsBuffer(q.trim(), tl);
    sendAudioBufferWithRange(req, res, buffer);
  } catch (err) {
    console.error('Vercel TTS proxy error:', err);
    sendJson(res, 500, { error: 'Failed to stream TTS audio' });
  }
}
