const { ZodError } = require('zod');

const validate = (schema) => (req, res, next) => {
  try {
    const isWrapped = schema.shape && (schema.shape.body || schema.shape.query || schema.shape.params);
    if (isWrapped) {
      const parsed = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      if (parsed.body) req.body = parsed.body;
      if (parsed.query) req.query = parsed.query;
      if (parsed.params) req.params = parsed.params;
    } else {
      req.body = schema.parse(req.body);
    }
    next();
  } catch (error) {
    if (error instanceof ZodError || error.issues) {
      const issues = error.errors || error.issues || [];
      const formattedErrors = Array.isArray(issues) ? issues.map((err) => ({
        field: err.path ? err.path.filter((p) => p !== 'body').join('.') : '',
        message: err.message || String(err),
      })) : [];

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: formattedErrors,
      });
    }
    next(error);
  }
};

module.exports = validate;
