const OpenAI = require('openai');
const env = require('./env');

let openaiClient = null;

if (env.OPENAI_API_KEY && env.OPENAI_API_KEY.trim() !== '') {
  openaiClient = new OpenAI({
    apiKey: env.OPENAI_API_KEY,
  });
}

const isOpenAIConfigured = () => {
  return Boolean(env.OPENAI_API_KEY && env.OPENAI_API_KEY.trim() !== '');
};

const getOpenAIClient = () => {
  if (!isOpenAIConfigured()) {
    return null;
  }
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
};

module.exports = {
  getOpenAIClient,
  isOpenAIConfigured,
  model: env.OPENAI_MODEL,
};
