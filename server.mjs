// Static server, no dependency. Usage: node server.mjs [port]   (default 8769, 127.0.0.1 only)
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(fileURLToPath(import.meta.url))
const port = Number(process.argv[2] ?? 8769)
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.wasm': 'application/wasm',
  '.mkv': 'video/x-matroska',
  '.json': 'application/json',
  '.md': 'text/plain; charset=utf-8',
}

http.createServer((req, res) => {
  const headers = {
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Embedder-Policy': 'require-corp',
    'Cross-Origin-Resource-Policy': 'same-origin',
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'no-store',
  }
  const fail = (code, text) => { res.writeHead(code, { ...headers, 'Content-Type': 'text/plain' }); res.end(text) }
  let urlPath
  try { urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname) } catch { return fail(400, 'bad url') }
  if (urlPath.endsWith('/')) urlPath += 'index.html'
  // Lexical check only: the shared wasm folders are symlinks inside the kit.
  const file = path.join(root, path.normalize(urlPath))
  if (!file.startsWith(root + path.sep)) return fail(403, 'forbidden')
  fs.stat(file, (error, stat) => {
    if (error || !stat.isFile()) return fail(404, 'not found')
    headers['Content-Type'] = types[path.extname(file)] ?? 'application/octet-stream'
    let start = 0, end = stat.size - 1, code = 200
    const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range ?? '')
    if (range && (range[1] || range[2])) {
      if (range[1]) { start = Number(range[1]); if (range[2]) end = Math.min(end, Number(range[2])) }
      else { start = Math.max(0, stat.size - Number(range[2])) }
      if (start > end || start >= stat.size) {
        res.writeHead(416, { ...headers, 'Content-Range': `bytes */${stat.size}` }); return res.end()
      }
      code = 206
      headers['Content-Range'] = `bytes ${start}-${end}/${stat.size}`
    }
    headers['Content-Length'] = end - start + 1
    res.writeHead(code, headers)
    if (req.method === 'HEAD') return res.end()
    fs.createReadStream(file, { start, end }).on('error', () => res.destroy()).pipe(res)
  })
}).listen(port, '127.0.0.1', () => console.log(`http://127.0.0.1:${port}/`))
