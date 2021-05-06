const express = require("express");
const router = express.Router();
const viewController = require("../controller/viewsController");
const authController = require("../controller/authController");
const userController = require("../controller/userController");
const bookingController = require("../controller/bookingController");

router.get(
  "/",
  bookingController.createBookingCheckout,
  authController.isLoggedIn,
  viewController.getOverview
);
router.get("/tour/:slug", authController.isLoggedIn, viewController.getTour);
router.get("/me", authController.protect, viewController.getAccount);
router.get("/my-tours", authController.protect, viewController.getMyTours);

router.post(
  "/submit-user-data",
  authController.protect,
  viewController.updateUserData
);
//login //signup
router.get("/login", authController.isLoggedIn, viewController.getLoginForm);
router.get("/signup", authController.isLoggedIn, viewController.getSignupForm);

// router.get("/resetPassword", viewController.getLoginForm);
router.get("/resetPassword/:token", viewController.getResetPasswordForm);

module.exports = router;
