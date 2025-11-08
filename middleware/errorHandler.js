// Error handling middleware
const errorHandler = (err, req, res, next) => {
    console.error('❌ Error:', err);

    // Default error
    let error = {
        message: err.message || 'Internal Server Error',
        status: err.status || 500
    };

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        error.message = Object.values(err.errors).map(val => val.message);
        error.status = 400;
    }

    // Mongoose duplicate key error
    if (err.code === 11000) {
        error.message = `Duplicate field value entered: ${Object.keys(err.keyValue).join(', ')}`;
        error.status = 400;
    }

    // Mongoose cast error
    if (err.name === 'CastError') {
        error.message = `Invalid ${err.path}: ${err.value}`;
        error.status = 400;
    }

    // JWT error
    if (err.name === 'JsonWebTokenError') {
        error.message = 'Invalid token';
        error.status = 401;
    }

    // JWT expired error
    if (err.name === 'TokenExpiredError') {
        error.message = 'Token expired';
        error.status = 401;
    }

    // Multer error
    if (err.code === 'LIMIT_FILE_SIZE') {
        error.message = 'File size is too large';
        error.status = 400;
    }

    // Return error response
    res.status(error.status).json({
        success: false,
        error: {
            message: error.message,
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
        }
    });
};

module.exports = errorHandler;