/**
 * Pluggable AI provider (server-only).
 *
 * Swapping providers is an environment change, not a code change:
 *
 *   AI_PROVIDER=anthropic | openai | openai-compatible
 *   AI_API_KEY=...
 *   AI_MODEL=...
 *   AI_BASE_URL=...   (only for openai-compatible gateways)
 *
 * Every adapter exposes the same `generateJSON({ system, prompt, schema })`
 * contract and uses the provider's native structured-output mechanism, so the
 * caller always receives a parsed object that matches `schema`.
 */

const DEFAULTS = {
  anthropic: { model: 'claude-opus-5', baseUrl: 'https://api.anthropic.com' },
  openai: { model: 'gpt-4o-2024-08-06', baseUrl: 'https://api.openai.com' },
  'openai-compatible': { model: 'gpt-4o-mini', baseUrl: '' },
};

export function getAIConfig() {
  const provider = (process.env.AI_PROVIDER || 'anthropic').toLowerCase();
  const defaults = DEFAULTS[provider];
  if (!defaults) {
    throw new Error(`AI_PROVIDER "${provider}" is not supported (anthropic | openai | openai-compatible)`);
  }
  return {
    provider,
    apiKey: process.env.AI_API_KEY || '',
    model: process.env.AI_MODEL || defaults.model,
    baseUrl: (process.env.AI_BASE_URL || defaults.baseUrl).replace(/\/$/, ''),
    // Cost controls — every one is a hard ceiling the generator cannot exceed.
    maxOutputTokens: Number(process.env.AI_MAX_OUTPUT_TOKENS || 8000),
    timeoutMs: Number(process.env.AI_TIMEOUT_MS || 180_000),
  };
}

export function isAIConfigured() {
  try {
    return Boolean(getAIConfig().apiKey);
  } catch {
    return false;
  }
}

async function postJSON(url, headers, body, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body),
      signal: controller.signal,
      cache: 'no-store',
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      // Surface status + provider message, never the key.
      const detail = data?.error?.message || data?.error?.type || 'unknown error';
      throw new Error(`AI_REQUEST_FAILED: ${response.status} ${detail}`);
    }
    return data;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Ask the model for an object matching `schema`.
 * @returns {Promise<{data: object, usage: object, model: string}>}
 */
export async function generateJSON({ system, prompt, schema }) {
  const cfg = getAIConfig();
  if (!cfg.apiKey) throw new Error('AI_NOT_CONFIGURED: set AI_API_KEY');

  if (cfg.provider === 'anthropic') {
    const data = await postJSON(
      `${cfg.baseUrl}/v1/messages`,
      { 'x-api-key': cfg.apiKey, 'anthropic-version': '2023-06-01' },
      {
        model: cfg.model,
        max_tokens: cfg.maxOutputTokens,
        system,
        messages: [{ role: 'user', content: prompt }],
        // Structured outputs: the first text block is guaranteed valid JSON
        // matching the schema, so no brittle parsing of prose is needed.
        output_config: { format: { type: 'json_schema', schema } },
      },
      cfg.timeoutMs
    );

    if (data.stop_reason === 'refusal') {
      throw new Error('AI_REFUSED: the model declined this generation request');
    }
    if (data.stop_reason === 'max_tokens') {
      throw new Error('AI_TRUNCATED: raise AI_MAX_OUTPUT_TOKENS or shorten the article target');
    }

    const text = (data.content || []).find((b) => b.type === 'text')?.text;
    if (!text) throw new Error('AI_EMPTY_RESPONSE');
    return { data: JSON.parse(text), usage: data.usage || {}, model: data.model || cfg.model };
  }

  // OpenAI and OpenAI-compatible gateways share the chat-completions shape.
  const data = await postJSON(
    `${cfg.baseUrl}/v1/chat/completions`,
    { Authorization: `Bearer ${cfg.apiKey}` },
    {
      model: cfg.model,
      max_tokens: cfg.maxOutputTokens,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: prompt },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: { name: 'article', strict: true, schema },
      },
    },
    cfg.timeoutMs
  );

  const choice = data.choices?.[0];
  if (choice?.finish_reason === 'length') {
    throw new Error('AI_TRUNCATED: raise AI_MAX_OUTPUT_TOKENS or shorten the article target');
  }
  const content = choice?.message?.content;
  if (!content) throw new Error('AI_EMPTY_RESPONSE');
  return { data: JSON.parse(content), usage: data.usage || {}, model: data.model || cfg.model };
}
