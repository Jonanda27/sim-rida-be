const { z } = require('zod');
const { getOpenAIClient, isOpenAIConfigured, model } = require('../../config/openai');
const { SYSTEM_PROMPT, buildUserPrompt } = require('./prompts/problem-identification.prompt');

// Zod schema for validating AI output structure
const aiProblemSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(5),
  evidence: z.string().optional().default(''),
  sourceReference: z.string().optional().default(''),
  confidence: z.number().min(0).max(1).default(0.8),
  suggestedOpds: z.array(
    z.object({
      opdCode: z.string(),
      relevanceScore: z.number().min(0).max(1).default(0.8),
      reason: z.string().optional().default(''),
    })
  ).optional().default([]),
});

const aiOutputSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(5),
  problems: z.array(aiProblemSchema).min(1, 'At least one problem must be identified'),
});

/**
 * Prepares and truncates source text if it exceeds safe context limits
 * @param {string} text
 * @param {number} maxChars - Default 40,000 characters (~10,000 tokens)
 * @returns {string}
 */
const prepareSourceForAnalysis = (text, maxChars = 40000) => {
  if (!text) return '';
  if (text.length <= maxChars) return text;
  return text.substring(0, maxChars) + '\n\n[... Teks dipotong untuk menjaga batas kapasitas pemrosesan konteks model ...]';
};

/**
 * Analyzes an external source text via OpenAI API
 * @param {string} sourceText
 * @param {Object} sourceMetadata
 * @returns {Promise<{
 *   title: string,
 *   description: string,
 *   problems: Array<Object>,
 *   aiMetadata: { model: string, analyzedAt: string }
 * }>}
 */
const analyzeExternalSource = async (sourceText, sourceMetadata = {}) => {
  // 1. Strict Configuration Guard
  if (!isOpenAIConfigured()) {
    const error = new Error('OpenAI integration is not configured. Please set OPENAI_API_KEY in .env.');
    error.statusCode = 503;
    error.code = 'OPENAI_NOT_CONFIGURED';
    throw error;
  }

  const client = getOpenAIClient();
  if (!client) {
    const error = new Error('Failed to initialize OpenAI client.');
    error.statusCode = 503;
    error.code = 'OPENAI_CLIENT_ERROR';
    throw error;
  }

  // 2. Validate input text
  if (!sourceText || sourceText.trim().length === 0) {
    const error = new Error('Extracted text is empty. Cannot perform AI analysis on blank content.');
    error.statusCode = 400;
    error.code = 'SOURCE_TEXT_EMPTY';
    throw error;
  }

  const preparedText = prepareSourceForAnalysis(sourceText);
  const userPrompt = buildUserPrompt(preparedText, sourceMetadata);

  try {
    // 3. Invoke OpenAI Chat Completion with structured JSON format
    const response = await client.chat.completions.create({
      model: model || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2, // low temperature for high factual accuracy
    });

    const choice = response.choices && response.choices[0];
    if (!choice || !choice.message || !choice.message.content) {
      const error = new Error('OpenAI returned an empty response.');
      error.statusCode = 502;
      error.code = 'AI_EMPTY_RESPONSE';
      throw error;
    }

    const rawContent = choice.message.content.trim();

    // 4. Parse JSON
    let parsedData;
    try {
      parsedData = JSON.parse(rawContent);
    } catch (parseErr) {
      const error = new Error(`Failed to parse AI response as JSON: ${parseErr.message}`);
      error.statusCode = 502;
      error.code = 'AI_OUTPUT_INVALID_JSON';
      throw error;
    }

    // 5. Validate output with Zod
    const validated = aiOutputSchema.safeParse(parsedData);
    if (!validated.success) {
      const issues = validated.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
      const error = new Error(`AI output structure failed validation: ${issues}`);
      error.statusCode = 502;
      error.code = 'AI_OUTPUT_INVALID';
      throw error;
    }

    return {
      title: validated.data.title,
      description: validated.data.description,
      problems: validated.data.problems,
      aiMetadata: {
        model: response.model || model || 'gpt-4o-mini',
        analyzedAt: new Date().toISOString(),
        usage: response.usage ? {
          promptTokens: response.usage.prompt_tokens,
          completionTokens: response.usage.completion_tokens,
          totalTokens: response.usage.total_tokens,
        } : null,
      },
    };
  } catch (err) {
    if (err.statusCode) {
      throw err;
    }

    // OpenAI API Specific Errors
    const statusCode = err.status || 500;
    const message = err.message || 'Error occurred while contacting OpenAI service.';
    const error = new Error(message);
    error.statusCode = statusCode >= 500 ? 502 : statusCode;
    error.code = err.code || 'OPENAI_API_ERROR';
    throw error;
  }
};

module.exports = {
  analyzeExternalSource,
  prepareSourceForAnalysis,
};
