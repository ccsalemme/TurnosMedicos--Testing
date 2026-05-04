const TAG_REGEX = /<[^>]*>/g;

export const sanitizeText = (value: string): string => {
  return value.replace(TAG_REGEX, '').trim();
};

export const sanitizePayload = <T>(payload: T): T => {
  if (payload === null || payload === undefined) {
    return payload;
  }

  if (typeof payload === 'string') {
    return sanitizeText(payload) as unknown as T;
  }

  if (Array.isArray(payload)) {
    return payload.map((item) => sanitizePayload(item)) as unknown as T;
  }

  if (typeof payload === 'object') {
    const sanitized: Record<string, unknown> = {};

    Object.entries(payload as Record<string, unknown>).forEach(([key, value]) => {
      sanitized[key] = sanitizePayload(value);
    });

    return sanitized as T;
  }

  return payload;
};
