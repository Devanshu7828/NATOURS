const Review = require("../models/reviewModel");
// const catchAsync = require("../utils/catchAsync");
// const AppError = require("../utils/appError");
const factory = require("./handlerFactory");

// exports.getAllReviews = catchAsync(async (req, res, next) => {
//TO ALLOW FOR NESTED GET REVIEWS ON TOUR (hack)
// let filter = {};
// if (req.params.tourId) filter = { tour: req.params.tourId };
//   const reviews = await Review.find(filter);
//   //response
//   res.status(200).json({
//     status: "Success",
//     results: reviews.length,
//     data: {
//       review: reviews,
//     },
//   });
// });

// exports.createReview = catchAsync(async (req, res, next) => {
//   //Allow nesetd routes
//   if (!req.body.tour) req.body.tour = req.params.tourId;
//   if (!req.body.user) req.body.user = req.user.id;

//   const newReview = await Review.create(req.body);
//   //response
//   res.status(201).json({
//     status: "Success",
//     data: {
//       review: newReview,
//     },
//   });
// });
exports.setTourUserIds = (req, res, next) => {
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};

exports.getAllReviews = factory.getAll(Review);
exports.createReview = factory.createOne(Review);
exports.getReview = factory.getOne(Review);
exports.updateReviews = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review);
