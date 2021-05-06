const Tour = require("../models/tourModel");
const User = require("../models/userModel");
const Booking = require("../models/bookingModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

exports.getOverview = catchAsync(async (req, res) => {
  //1)Get tour data from collection
  const tours = await Tour.find();
  //2) Build Template data
  //3) Render template from the data
  res.status(200).render("overview", {
    tours,
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  //1) GET data for the reuest tour including review and tour guides

  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: "reviews",
    fields: "review rating user",
  });
  if (!tour) {
    return next(new AppError("There is no tour with that name", 404));
  }

  res.status(200).render("tour", {
    title: `${tour.name} Tour`,
    tour,
  });
});

exports.getLoginForm = catchAsync(async (req, res) => {
  res.status(200).render("login", {
    title: "Login into your account",
  });
});

exports.getSignupForm = catchAsync(async (req, res) => {
  res.status(200).render("signup", {
    title: "Register for you account",
  });
});

exports.getAccount = catchAsync(async (req, res) => {
  res.status(200).render("account", {
    title: "Login into your account",
  });
});

exports.getMyTours = catchAsync(async (req, res) => {
  // 1) FIND ALL BOOKINGS
  const bookings = await Booking.find({ user: req.user.id });
  //2)FIND TOUR WITH THE RETURNED IDs
  const tourIDs = bookings.map((el) => el.tour);
  const tours = await Tour.find({ _id: { $in: tourIDs } }); //select which have id in tours id array
  
  res.status(200).render("overview", {
    title: "My Tours",
    tours,
  });
});

exports.updateUserData = catchAsync(async (req, res, next) => {
  const updateUser = await User.findByIdAndUpdate(
    req.user.id,
    {
      name: req.body.name,
      email: req.body.email,
    },
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).render("account", {
    title: "Login into your account",
    user: updateUser,
  });
});

exports.getResetPasswordForm = catchAsync(async (req, res) => {
  const { token } = req.params;
  // check token exist in our database
  res.render("resetPassword", { token: token });
});
