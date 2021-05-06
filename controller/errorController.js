const ErrorResponse = require("../utils/appError");

const errorHandler = (err, req, res, next) => {
  if (req.originalUrl.startsWith("/api")) {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || "error";
    /////////////////////////////////////////////////
    let error = { ...err };

    error.message = err.message;

    // Log to console for dev
    console.log(err);

    // Mongoose bad ObjectId
    if (err.name === "CastError") {
      const message = `Resources not found for ${error.stringValue}.`;
      error = new ErrorResponse(message, 404);
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
      const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
      // console.log(value);

      const message = `Duplicate field value: ${value}. Please use another value!`;
      error = new ErrorResponse(message, 400);
    }

    // Mongoose validation error
    if (err.name === "ValidationError") {
      const errors = Object.values(err.errors).map((el) => el.message);
      const message = `Invalid input data. ${errors.join(". ")}`;
      error = new ErrorResponse(message, 400);
    }

    // JWT ERRORS

    // Send ERROR RESPONSE
    return res.status(error.statusCode).json({
      status: error.status,
      error: error,
      message: error.message,
    });
  } else {
    return res.status(err.statusCode).render("error", {
      title: "Something went wrong!",
      msg: err.message,
    });
  }
};

// use into app.use() into server file
module.exports = errorHandler;
