// Global error handling middleware
function errorHandler(err, req, res, next) {
    console.error(err.stack); // Log error details for debugging

    const statusCode = err.statusCode || 500;
    const message = err.message || "An unexpected error occurred";

    res.status(statusCode).json({
        error: message,
        ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
}

module.exports = errorHandler;
