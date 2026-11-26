import { ServiceError } from "../../services/serviceError.js";

export const errorHandler = (err, req, res, next) => {
  if (err instanceof ServiceError) {
    return res.status(err.status).json({ error: err.message });
  }
  console.error(err.message);
  res.status(err.status === 413 ? 413 : err.status === 400 ? 400 : 500).json({
    error:
      err.status === 413
        ? "Photo is too large. Choose a photo up to 1 MB."
        : err.status === 400
          ? "Invalid JSON request."
          : "Unable to save changes. Please try again.",
  });
};
