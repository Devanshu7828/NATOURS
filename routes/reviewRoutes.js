const express = require("express");
const router = express.Router({ mergeParams: true });
const {
  createReview,
  getAllReviews,
  getReview,
  deleteReview,
  updateReviews,
  setTourUserIds,
} = require("../controller/reviewController");
const { protect, restrictTo } = require("../controller/authController.js");

//POST /tour/:id/reviews/   :- create review for certain tour
//GET /tour/:id/reviews/   :- Get all reviews for certain tour
//POST /reviews   :- nested route
router.use(protect);
router
  .route("/")
  .get(getAllReviews)
  .post(restrictTo("user"), setTourUserIds, createReview);

router
  .route("/:id")
  .get(getReview)
  .patch(restrictTo("user", "admin"), updateReviews)
  .delete(restrictTo("user", "admin"), deleteReview);
module.exports = router;
