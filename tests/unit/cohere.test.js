import test from 'node:test';
import assert from 'node:assert/strict';
import { env } from '../../api/config/env.js';
import { cohereChat } from '../../api/services/cohere.js';

test('Cohere adapter sends structured JSON and returns the text response', async (t) => {
  const originalFetch = global.fetch;
  const originalKey = env.ai.apiKey;
  t.after(() => {
    global.fetch = originalFetch;
    env.ai.apiKey = originalKey;
  });
  env.ai.apiKey = 'test-key';
  let request;
  global.fetch = async (_url, options) => {
    request = options;
    return {
      ok: true,
      json: async () => ({ message: { content: [{ type: 'text', text: '{"ok":true}' }] } }),
    };
  };
  const schema = {
    type: 'object',
    required: ['ok'],
    properties: { ok: { type: 'boolean' } },
  };
  assert.equal(await cohereChat([{ role: 'user', content: 'ping' }], schema), '{"ok":true}');
  const body = JSON.parse(request.body);
  assert.deepEqual(body.response_format, { type: 'json_object', schema });
  assert.equal(request.headers.Authorization, 'Bearer test-key');
});

test('Cohere adapter returns safe errors for provider failures and empty responses', async (t) => {
  const originalFetch = global.fetch;
  const originalKey = env.ai.apiKey;
  t.after(() => {
    global.fetch = originalFetch;
    env.ai.apiKey = originalKey;
  });
  env.ai.apiKey = 'test-key';
  global.fetch = async () => ({ ok: false });
  await assert.rejects(
    () => cohereChat([]),
    (error) => error.code === 'AI_UNAVAILABLE',
  );
  global.fetch = async () => ({ ok: true, json: async () => ({ message: { content: [] } }) });
  await assert.rejects(
    () => cohereChat([]),
    (error) => error.code === 'AI_INVALID_RESPONSE',
  );
});

test('Cohere adapter requires a key and retries only transient failures', async (t) => {
  const originalFetch = global.fetch;
  const originalKey = env.ai.apiKey;
  t.after(() => {
    global.fetch = originalFetch;
    env.ai.apiKey = originalKey;
  });
  env.ai.apiKey = '';
  await assert.rejects(
    () => cohereChat([]),
    (error) => error.code === 'AI_NOT_CONFIGURED',
  );
  env.ai.apiKey = 'test-key';
  let calls = 0;
  global.fetch = async () => {
    calls += 1;
    if (calls === 1) return { ok: false, status: 429 };
    return {
      ok: true,
      json: async () => ({ message: { content: [{ type: 'text', text: 'recuperado' }] } }),
    };
  };
  assert.equal(await cohereChat([]), 'recuperado');
  assert.equal(calls, 2);
});
