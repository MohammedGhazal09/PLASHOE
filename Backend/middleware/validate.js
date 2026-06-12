import { ZodError } from 'zod';

const formatZodErrors = (error) =>
  error.issues.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message,
  }));

export const validateRequest = (schemas = {}) => (req, res, next) => {
  try {
    const validated = {};

    if (schemas.params) {
      validated.params = schemas.params.parse(req.params);
      req.params = { ...req.params, ...validated.params };
    }

    if (schemas.query) {
      validated.query = schemas.query.parse(req.query);
      req.query = { ...req.query, ...validated.query };
    }

    if (schemas.body) {
      validated.body = schemas.body.parse(req.body ?? {});
      req.body = validated.body;
    }

    req.validated = {
      ...(req.validated || {}),
      ...validated,
    };

    next();
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request',
        errors: formatZodErrors(error),
      });
    }

    next(error);
  }
};
