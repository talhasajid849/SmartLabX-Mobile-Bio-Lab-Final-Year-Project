const ErrorHandler = require('../utils/Errorhandler')

const ErrorMiddleware = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.message = err.message || 'Internal Server Error';

    // My sql Duplicate entry error
    if(err.code == 'ER_DUP_ENTRY'){
        const message = `Duplicate entry for ${Object.keys(err.sqlMessage).join(', ')}`;
        err = new ErrorHandler(message, 400);
    }
   // Invalid JWT error
    if (err.name === 'JsonWebTokenError') {
        const message = 'JSON Web Token is invalid, try again';
        err = new ErrorHandler(message, 400);
    }

    // JWT expired error
    if (err.name === 'TokenExpiredError') {
        const message = 'JSON Web Token has expired, try again';
        err = new ErrorHandler(message, 400);
    }

    res.status(err.statusCode).json({
        success: false,
        message: err.message
    });
};

module.exports = ErrorMiddleware;