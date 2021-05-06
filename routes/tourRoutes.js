const express = require("express");
const {
  allTours,
  createTour,
  getTour,
  updateTour,
  deletTour,
  aliasTopTours,
  getTourWithin,
  getDistances,
  getTourStats,
  getMonthlyPlan,
  resizeTourImages,
  uploadTourImages
} = require("../controller/tourController");
const { protect, restrictTo } = require("../controller/authController.js");
const reviewRouter = require("./reviewRoutes");
const router = express.Router();
//merge parmas
//NESTING ROUTES
//GET /tour/:id/reviews/   :- nested route
//GET /tour/:id/reviews/:id  :- nested route
//POST /tour/:id/reviews/   :- nested route
//review is child of tour
router.use("/:tourId/reviews", reviewRouter);

router.route("/top-5-cheap").get(aliasTopTours, allTours);
router.route("/tour-stats").get(getTourStats);
router
  .route("/monthly-plan/:year")
  .get(restrictTo("admin", "lead-guide", "guide"), getMonthlyPlan);

// PROTECT ALL ROUTES AFTER THIS MIDDLEWARE
// router.use(protect);

// main routes
router
  .route("/")
  .get(allTours)
  .post(protect, restrictTo("admin", "lead-guide"), createTour);

//tours-distance?distance=223,center=-40,45,unit=mi
//tours-distance/223/center/-40,45/unit/mi
router
  .route("/tours-within/:distance/center/:latlng/unit/:unit")
  .get(getTourWithin);

//agreagrating calculation distance
router.route("/distances/:latlng/unit/:unit").get(getDistances);

router
  .route("/:id")
  .get(getTour)
  .patch(protect, restrictTo("admin", "lead-guide"),uploadTourImages,resizeTourImages, updateTour)
  .delete(protect, restrictTo("admin", "lead-guide"), deletTour);

module.exports = router;
