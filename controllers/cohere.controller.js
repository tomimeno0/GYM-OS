import { env } from '../config/env.js';
import { AppError } from './errors.controller.js';

const endpoint = 'https://api.cohere.com/v2/chat';

export async function cohereChat(messages, schema) {
  if (!env.ai.apiKey)
    throw new AppError(
      503,
      'AI_NOT_CONFIGURED',
      'El asistente todavía no tiene configurada su API key.',
    );
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), env.ai.timeoutMs);
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${env.ai.apiKey}`,
          'Content-Type': 'application/json',
          'X-Client-Name': 'GYM-OS',
        },
        body: JSON.stringify({
          model: env.ai.model,
          messages,
          temperature: 0.2,
          max_tokens: 8000,
          ...(/^command-a-(plus|reasoning)-/.test(env.ai.model)
            ? { thinking: { type: 'disabled' } }
            : {}),
          ...(schema ? { response_format: { type: 'json_object', schema } } : {}),
        }),
      });
      if (!response.ok) {
        if (attempt === 0 && (response.status === 429 || response.status >= 500)) {
          await new Promise((resolve) => setTimeout(resolve, 500));
          continue;
        }
        throw new AppError(
          503,
          'AI_UNAVAILABLE',
          'El asistente no está disponible en este momento. Intentá nuevamente.',
        );
      }
      const payload = await response.json();
      const text = (payload?.message?.content || [])
        .filter((part) => part.type === 'text' && typeof part.text === 'string')
        .map((part) => part.text)
        .join('')
        .trim();
      if (!text || payload.finish_reason === 'MAX_TOKENS') {
        if (!text && attempt === 0) continue;
        throw new AppError(
          503,
          'AI_INVALID_RESPONSE',
          'El asistente devolvió una respuesta vacía o incompleta. Intentá nuevamente.',
        );
      }
      return text;
    } catch (error) {
      if (error instanceof AppError) throw error;
      if (attempt === 0) continue;
      throw new AppError(
        503,
        'AI_UNAVAILABLE',
        'El asistente no está disponible en este momento. Intentá nuevamente.',
      );
    } finally {
      clearTimeout(timer);
    }
  }
  throw new AppError(
    503,
    'AI_UNAVAILABLE',
    'El asistente no está disponible en este momento. Intentá nuevamente.',
  );
}
