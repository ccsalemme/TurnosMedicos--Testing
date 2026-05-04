import * as Joi from 'joi';

export const validateEnv = (config: Record<string, unknown>): Record<string, unknown> => {
  const mockModeEnabled = String(config.MOCK_MODE ?? 'false').toLowerCase() === 'true';

  const schema = Joi.object({
    PORT: Joi.number().default(3000),
    MOCK_MODE: Joi.boolean().truthy('true').falsy('false').default(false),
    DATABASE_URL: mockModeEnabled ? Joi.string().optional() : Joi.string().required(),
    JWT_SECRET: Joi.string().min(16).required(),
    JWT_EXPIRES_IN: Joi.string().default('8h'),
    CORS_ORIGIN: Joi.string().default('http://localhost:5173'),
    DEFAULT_CANCELLATION_WINDOW_HOURS: Joi.number().min(1).max(168).default(24)
  }).unknown(true);

  const { error, value } = schema.validate(config, {
    abortEarly: false
  });

  if (error) {
    throw new Error(`Configuracion invalida: ${error.message}`);
  }

  return value;
};
