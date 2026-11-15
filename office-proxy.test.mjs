import assert from 'node:assert/strict';
import http from 'node:http';
import { test } from 'node:test';
import { allowed, start } from './office-proxy.mjs';

const get = (port, host) =>
  new Promise((resolve, reject) => {
    http.get({ host: '127.0.0.1', port, path: '/x', headers: { host } }, (res) => {
      let body = '';
      res.on('data', (d) => (body += d)).on('end', () => resolve({ status: res.statusCode, body }));
    }).on('error', reject);
  });

test('only tailnet names are allowed', () => {
  assert.equal(allowed('laptop.tail1234.ts.net'), true);
  assert.equal(allowed('laptop.tail1234.ts.net:443'), true);
  assert.equal(allowed('evil.example'), false);
  assert.equal(allowed('ts.net.evil.example'), false);
  assert.equal(allowed('localhost'), false);
  assert.equal(allowed(''), false);
});

test('forwards tailnet requests as localhost and refuses the rest', async () => {
  const upstream = http.createServer((req, res) => res.end(`host=${req.headers.host} path=${req.url}`));
  await new Promise((r) => upstream.listen(0, '127.0.0.1', r));
  const proxy = start(0, upstream.address().port);
  await new Promise((r) => proxy.on('listening', r));
  const port = proxy.address().port;

  assert.deepEqual(await get(port, 'laptop.tail1234.ts.net'), { status: 200, body: 'host=localhost path=/x' });
  assert.equal((await get(port, 'evil.example')).status, 403);

  upstream.close();
  assert.equal((await get(port, 'laptop.tail1234.ts.net')).status, 502);
  proxy.close();
});
