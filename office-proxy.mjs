// Lets Tailscale reach the myoffice page. myoffice answers only to "localhost"
// (its defence against DNS-rebinding pages), so this forwards requests that
// arrive under this machine's tailnet name and presents them as localhost.
// It listens on loopback only: the only way in from outside is `tailscale serve`,
// which admits just the devices signed in to the owner's tailnet.
import http from 'node:http';
import { fileURLToPath } from 'node:url';

export const allowed = (host) => /^[a-z0-9-]+\.[a-z0-9-]+\.ts\.net(:\d+)?$/i.test(host);

export function start(listenPort, officePort) {
  return http
    .createServer((req, res) => {
      if (!allowed(req.headers.host || '')) return res.writeHead(403).end();
      const upstream = http.request(
        { host: '127.0.0.1', port: officePort, path: req.url, method: req.method, headers: { ...req.headers, host: 'localhost' } },
        (answer) => {
          res.writeHead(answer.statusCode, answer.headers);
          answer.pipe(res);
        },
      );
      upstream.on('error', () => res.writeHead(502).end('The office is not running on this laptop.'));
      req.pipe(upstream);
    })
    .listen(listenPort, '127.0.0.1');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  start(4546, 4545);
  console.log('office-proxy: 127.0.0.1:4546 -> 127.0.0.1:4545');
}
