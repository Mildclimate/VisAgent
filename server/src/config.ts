import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  host: process.env.HOST || '0.0.0.0',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  dbPath: process.env.DB_PATH || './data/visagent.db',
  /** LLM Provider config */
  llm: {
    provider: process.env.LLM_PROVIDER || 'openai',
    apiKey: process.env.OPENAI_API_KEY || '',
    baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
    defaultModel: process.env.DEFAULT_MODEL || 'gpt-4o',
  },
  /** Sandbox execution limits */
  sandbox: {
    maxTimeout: parseInt(process.env.SANDBOX_MAX_TIMEOUT || '30000', 10),
    maxMemory: parseInt(process.env.SANDBOX_MAX_MEMORY || '128', 10), // MB
  },
};
