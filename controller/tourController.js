const fs = require("fs");
// const { networkInterfaces } = require("os");
const Tours = require("../models/tourModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const factory = require("./handlerFactory");
const multer = require("multer");
const sharp = require("sharp"); //for image resizing

const multerStorage = multer.memoryStorage(); //for buffer storage of resizeing
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new AppError("Not an image! Please upload only images.", 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadTourImages = upload.fields([
  { name: "imageCover", maxCount: 1 },
  { name: "images", maxCount: 3 },
]);

// upload.array('images',5); when only one field

exports.resizeTourImages = catchAsync(async (req, res, next) => {
  if (!req.files.imageCover || !req.files.images) return next();
  //1) COVER IMAGE
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat("jpeg")
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${req.body.imageCover}`);
  //2 IMAGES
  req.body.images = [];

  await Promise.all(
    req.files.images.map(async (file, i) => {
      const filename = `tour-${req.params.id}-${Date.now()}-${(i + 1)}.jpeg`;
      await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat("jpeg")
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${filename}`);
      req.body.images.push(filename);
    })
  );
  next();
});

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = "5";
  req.query.sort = "-ratingAverage,price";
  req.query.fields = "name,price,ratingAverage,summary,difficulty";
  next();
};

exports.allTours = factory.getAll(Tours);

exports.createTour = factory.createOne(Tours);

exports.getTour = factory.getOne(Tours, { path: "reviews" });

exports.updateTour = factory.updateOne(Tours);

exports.deletTour = factory.deleteOne(Tours);

exports.getTourStats = catchAsync(async (req, res) => {
  const stats = await Tours.aggregate([
    {
      $match: { ratingAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        _id: { $toUpper: "$difficulty" },
        numTours: { $sum: 1 },
        numRatings: { $sum: "$ratingsQuantity" },
        avgRating: { $avg: "$ratingAverage" },
        avgPrice: { $avg: "$price" },
        minPrice: { $min: "$price" },
        maxPrice: { $max: "$price" },
      },
    },
    {
      $sort: { avgPrice: 1 },
    },
  ]);

  // SEND RESPONSE
  res.status(200).json({
    sucess: true,
    time: req.requestTime,
    data: {
      stats,
    },
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res) => {
  const year = req.params.year * 1; // 2021
  const plan = await Tours.aggregate([
    {
      $unwind: "$startDates",
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`), // 1 day of year
          $lte: new Date(`${year}-12-31`), //last day of year
        },
      },
    },
    {
      $group: {
        _id: { $month: "$startDates" }, //to group by months
        numToursStarts: { $sum: 1 }, //add 1 to each document
        tours: { $push: "$name" }, //push name into array
      },
    },
    { $addFields: { month: "$_id" } },
    {
      $project: {
        _id: 0, //0 for remove 1 for show
      },
    },
    {
      $sort: {
        numToursStarts: -1, //1 for accending and -1 for desending
      },
    },
    {
      $limit: 12,
    },
  ]);
  // SEND RESPONSE
  res.status(200).json({
    sucess: true,
    time: req.requestTime,
    data: {
      plan,
    },
  });
});

// router.route('/tours-within/:distance/center/:latlng/unit/:unit');
//tours-distance/223/center/34.111745,-118.11349/unit/250mi
exports.getTourWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(",");
  //radians =  distance/earth radius
  const radius = unit === "mi" ? distance / 3963.2 : distance / 6378.1;

  if (!lat || !lng) {
    next(
      new AppError(
        "Please provide latitude and longatiute in format lat,lng",
        400
      )
    );
  }

  const tours = await Tours.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });
  //to use this we need provide index in tour model

  res.status(200).json({
    status: "success",
    results: tours.length,
    data: {
      data: tours,
    },
  });
});

exports.getDistances = catchAsync(async (req, res) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(",");
  const multiplier = unit === "mi" ? 0.000621371 : 0.001;

  if (!lat || !lng) {
    next(
      new AppError(
        "Please provide latitude and longatiute in format lat,lng",
        400
      )
    );
  }
  //to use this aggragratin on geo we need to provide index in tour model
  const distances = await Tours.aggregate([
    {
      $geoNear: {
        near: {
          type: "Point",
          coordinates: [lng * 1, lat * 1], //to convert into number
        },
        distanceField: "distance",
        distanceMultiplier: multiplier, // divide 1000
      },
    },
    {
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);
  res.status(200).json({
    status: "success",

    data: {
      data: distances,
    },
  });
});
