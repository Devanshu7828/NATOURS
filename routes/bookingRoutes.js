const express = require("express");
const { protect, restrictTo } = require("../controller/authController.js");
const bookingController = require("../controller/bookingController");
const router = express.Router();

router.use(protect);
router.get("/checkout-session/:tourID", bookingController.getCheckoutSession);

router.route(restrictTo("admin", "lead-guide"));
router
  .route("/")
  .get(bookingController.getAllBooking)
  .post(bookingController.createBooking);

router
  .route("/:id")
  .get(bookingController.getBooking)
  .patch(bookingController.updateBooking)
  .delete(bookingController.deleteBooking);

module.exports = router;
