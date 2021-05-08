const path = require("path");
require("dotenv").config();
const express = require("express");
const port = process.env.PORT || 3000;
const morgan = require("morgan");
const AppError = require("./utils/appError");
const errorHandler = require("./controller/errorController");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const monogoSanatize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");
const ejs = require("ejs");
const ejsexpress = require("express-ejs-layouts");
const PUG = require("pug");
var bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const methodOverride = require("method-override");
const compression = require("compression");
// ROUTES
const tours = require("./routes/tourRoutes");
const users = require("./routes/userRoutes");
const reviews = require("./routes/reviewRoutes");
const viewRoutes = require("./routes/viewRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const { Server } = require("http");

//Start express app
const app = express();
app.enable("trust-proxy");
// database
require("./database/connection");

// GLOBAL MIDDLEWARES

// Body parse, reading data from Body into req.body
// app.use(bodyParser.json());
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());
app.use(methodOverride("_method"));
//Serving static files
app.use(express.static(path.join(__dirname, "public")));
//SETING PUG TEMPLATE ENGINE
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));
// Data Sanatization against nosql query injection
app.use(monogoSanatize());
// Data Sanatization against XSS
app.use(xss());
//prevent premature pollution (duplicate)
app.use(
  hpp({
    whitelist: [
      "duration",
      "ratingQuantity",
      "ratingAverage",
      "maxGroupSize",
      "price",
      "difficulty",
    ],
  })
);
app.use(morgan("dev"));
app.use(compression());
//Set security HTTP headers
// app.use(
//   helmet({
//     contentSecurityPolicy:
//       process.env.NODE_ENV === "production" ? undefined : false,
//   })
// );

//Limit requests from same api
const limiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 60 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this ip please try again in an hour",
});

app.use("/api", limiter);

// TEST middlewares
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

//VIEW ROUTES
app.use("/", viewRoutes);
//API ROUTE'S INIT
app.use("/api/v1/tours", tours);
app.use("/api/v1/users", users);
app.use("/api/v1/reviews", reviews);
app.use("/api/v1/bookings", bookingRoutes);

app.use("*", (req, res, next) => {
  next(new AppError("cant find" + req.originalUrl + " on this server", 404));
});

// error handler
app.use(errorHandler);

//server
const server=app.listen(port, () => {
  console.log(
    `server is runnig in ${process.env.NODE_ENV} mode on port ${port}`
  );
});

process.on('unhandledRejection', err => {
  console.log('UNHANDLED REJECTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

process.on('SIGTERM', () => {
  console.log('👋 SIGTERM RECEIVED. Shutting down gracefully');
  server.close(() => {
    console.log('💥 Process terminated!');
  });
});
