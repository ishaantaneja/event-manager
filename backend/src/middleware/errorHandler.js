export default (err, req, res, next) => {
  console.error("❌", err);
  let status = err.statusCode || 500;
  let message = err.message || "Server Error";

  if (err.name === "CastError") { status = 404; message = "Resource not found"; }
  if (err.code === 11000) { status = 400; message = "Duplicate field value"; }
  if (err.name === "ValidationError") { status = 400; message = Object.values(err.errors).map(v => v.message).join(", "); }
  if (err.name === "JsonWebTokenError") { status = 401; message = "Invalid token"; }
  if (err.name === "TokenExpiredError") { status = 401; message = "Token expired"; }

  res.status(status).json({ success: false, message, ...(process.env.NODE_ENV === "development" && { stack: err.stack }) });
};
