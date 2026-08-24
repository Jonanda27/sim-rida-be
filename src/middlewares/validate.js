const { ZodError } = require('zod');

const validate = (schema) => (req, res, next) => {
  try {
    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    next();
  } catch (error) {
    if (error instanceof ZodError || error.issues) {
      const issues = error.errors || error.issues || [];
      const formattedErrors = Array.isArray(issues) ? issues.map((err) => ({
        field: err.path ? err.path.join('.') : '',
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
