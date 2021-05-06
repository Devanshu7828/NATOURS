const mongoose = require("mongoose");
const { default: slugify } = require("slugify");
const slug = require("slugify");
const validator = require("validator");
const User = require("./userModel");
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      unique: true,
      trim: true,
      // built in validator
      required: [true, "A tour must have a name"],
      maxLength: [40, "A tour name must have less or equal then 40 characters"],
      minLength: [10, "A tour name must have more or equal then 10 characters"],
    },
    slug: {
      type: String,
    },
    duration: {
      type: Number,
      required: [true, "A tour must have a duration"],
    },
    maxGroupSize: {
      type: Number,
      required: [true, "A tour must have a group size"],
    },
    difficulty: {
      type: String,
      required: [true, "A tour must have a difficulty"],
      enum: {
        values: ["easy", "medium", "difficult"],
        message: "Difficulty is either: easy, medium, difficult",
      },
    },
    ratingsAverage: {
      type: Number,
      // built in validator
      min: [1, "Rating must be above 1.0"],
      max: [5, "Rating must be below 5.0"],
      set: (val) => Math.round(val * 10) / 10, //4.66666 ,46.6666,47,4.7
      default: 4.5,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, "A tour must have a Price"],
    },
    priceDiscount: {
      type: Number,
      // CUSTOM validator
      validate: {
        validator: function (value) {
          //this only ponints to cuurent doc on NEW document creation not on update
          return value < this.price; // 100 < 200 = true || 250 < 200 =false
        },
        message: "Discount price ({VALUE}) should be below regular price",
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, "A tour must have a summary"],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      // required: [true, "A tour must have a cover image"],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: new Date(),
      select: false,
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      //GEOJSON
      type: {
        type: String,
        default: "Point",
        enum: ["Point"],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: "Point",
          enum: ["Point"],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    //guides:Array for embading
    //below is for refrancing
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "User",
      },
    ],
    //for virtual populate :- reviews without storing array of id of reviews
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

//single field index for improve read performance
//ex:- query:- ?price[lt]=1000
//tourSchema.index({price:1}) //1 is for sorting in accending order

//COMPOUND INDEX
//ex:- query:- ?price[lt]=1000&ratingsAverage[gte]=4.7
tourSchema.index({ price: 1, ratingAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: "2dsphere" }); //index for geo special data
//***********************************************************************//

//VIRTUAL not show in database but show whenever we get output
tourSchema.virtual("durationWeeks").get(function () {
  return this.duration / 7;
});

//-------***** VIRTUAL POPULATE *****-------
tourSchema.virtual("reviews", {
  ref: "Review",
  foreignField: "tour", //field in review model
  localField: "_id", //id of tour document
});

// *******************************************************//
//DOCUMENT MIDDLEWARE: runds before .save() command and .create().
//this refere to current document
tourSchema.pre("save", function (next) {
  this.slug = slugify(this.name, {
    lower: true,
  });
  next();
});

// Embading user data into tour model guides Array
// tourSchema.pre('save', async function (next) {
//   //this will be an array so we will loop through them using a map(), so each iteration get current user id
//   const guidesPromises = this.guides.map(async id => await User.findById(id));
//   //guidesPromises this will give us promises to execute promise we use below method
//   this.guides=await Promise.all(guidesPromises);
//   next();
// })

// -----------------------------------------------------------//
// QUERY MIDDLEWARE
//this refere to current query
// /^find/ it will works with every query that start with find.
tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();
  next();
});

//for populating user
tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: "guides",
    select: " -__v -passwordChangedAt",
  });

  next();
});

//AGGREGRATION MIDDLEWARE
//this refere to current AGGREGRATION object
//COMMENTING IT BECAUSE IT WILL CREATE ERROR IN GEO PIPELINE
// tourSchema.pre("aggregate", function (next) {
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });

//   next();
// });

module.exports = mongoose.model("Tour", tourSchema);
