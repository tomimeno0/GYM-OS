import { env } from '../config/env.js';
import { AppError } from '../lib/errors.js';

const endpoint = 'https://api.cohere.com/v2/chat';

export async function cohereChat(messages, schema) {
  if (!env.ai.apiKey)
    throw new AppError(
      503,
      'AI_NOT_CONFIGURED',
      'El asistente todavía no tiene configurada su API key.',
    );
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);
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
        ...(schema ? { response_format: { type: 'json_object', schema } } : {}),
      }),
    });
    if (!response.ok)
      throw new AppError(
        503,
        'AI_UNAVAILABLE',
        'El asistente no está disponible en este momento. Intentá nuevamente.',
      );
    const payload = await response.json();
    const text = payload?.message?.content?.find((part) => part.type === 'text')?.text;
    if (!text)
      throw new AppError(503, 'AI_INVALID_RESPONSE', 'El asistente devolvió una respuesta vacía.');
    return text;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      503,
      'AI_UNAVAILABLE',
      'El asistente no está disponible en este momento. Intentá nuevamente.',
    );
  } finally {
    clearTimeout(timer);
  }
}
