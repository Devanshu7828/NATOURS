const mongoose = require("mongoose");
const validator = require("validator");
const Tour = require("./tourModel");
const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, "Review can not be empty"],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    //parent refrencing
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: "Tour",
      required: [true, "Review must belong to tour"],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "Review must belong to user"],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

//for populating user and tour
reviewSchema.pre(/^find/, function (next) {
  // this.populate({
  //   path: "tour",
  //   select: "name",
  // }).populate({
  //   path: "user",
  //   select: "name",
  // });
  this.populate({
    path: "user",
    select: "name photo",
  });

  next();
});

// ***********************************************************************
reviewSchema.statics.calcAverageRatings = async function (tourId) {
  //AGGREAGRATE PIPELINE this call on model directly
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: "$tour",
        nRating: { $sum: 1 },
        avgRating: { $avg: "$rating" },
      },
    },
  ]);

  // console.log(stats);
  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};

//AVOIDING CREATING DUPLICATE REVIEW USING INDEXES
reviewSchema.index({tour:1,user:1},{unique:true});


//CALCULATING RATING AVERAGE AFTER UPDATING AND DELETEING THE REVIEW
//findByIdAndUpdate
//findByIdAndDelet
reviewSchema.pre(/^findOneAnd/, async function (next) {
  //goal is to access the current documet because in thease method we dont point to current document in this point to current query so we have to execute query first to get the documet
  this.r = await this.findOne();
  // console.log(this.r);

  next();
});
reviewSchema.post(/^findOneAnd/, async function () {
  // await this.findOne() DOES NOT WORK HERE BECAUSE QUERY HAS ALREADY EXEQUTED
  await this.r.constructor.calcAverageRatings(this.r.tour);
});

//CALCULATING REVIEW AFTER SAVING INTO DATABASE
reviewSchema.post("save", function () {
  //this points to current review
  //Review.calcAverageRatings(this.tour) to do this we have to use a below code
  this.constructor.calcAverageRatings(this.tour);
});

module.exports = mongoose.model("Review", reviewSchema);
