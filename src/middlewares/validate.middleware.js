const { errorResponse } = require('../utils/response.util');

const validate = (schema) => (req, res, next) => {
  try {
    const parsed = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (!parsed.success) {
      const issue = parsed.error.issues?.[0];
      const errorMsg = issue ? `${issue.path.join('.')}: ${issue.message}` : 'Validasi input data gagal.';
      return errorResponse(res, errorMsg, parsed.error.format(), 400);
    }

    if (parsed.data.body) req.body = parsed.data.body;
    if (parsed.data.query) req.query = parsed.data.query;
    if (parsed.data.params) req.params = parsed.data.params;

    next();
  } catch (err) {
    next(err);
  }
};

module.exports = validate;
