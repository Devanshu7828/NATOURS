const catchAsync = require("../utils/catchAsync");
const User = require("../models/userModel");
const AppError = require("../utils/appError");
const factory = require("./handlerFactory");

const multer = require("multer");
const sharp = require("sharp"); //for image resizing

// const { findById, findByIdAndUpdate } = require("../models/userModel");

// MULTER
// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, "public/img/users");
//   },
//   filename: (req, file, cb) => {
//     const ext = file.mimetype.split("/")[1]; // image/[1]=jpeg
//     cb(null, `user-${req.user.id}=${Date.now()}.${ext}`);
//   },
// });
const multerStorage = multer.memoryStorage(); //for buffer storage of resizeing
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images.', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter
});
//MULTER UPLOAD
exports.uploadUserPhoto = upload.single('photo');
//rezise photo
exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
});



const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) {
      newObj[el] = obj[el];
    }
  });
  return newObj;
};

exports.updateMe = catchAsync(async (req, res, next) => {
  const { email, name } = req.body;
  //1) create error if user POST password data
  if (req.body.password || req.body.confirmPassword) {
    return next(new AppError("This route is not for passwords updates", 400));
  }
  //2)filter unwanted fileds name like that are not allowed to updated
  // we user findbyidandupdate becasue in here we dont want to run validators
  //body.role='admin'
  // 2) Filtered out unwanted fields names that are not allowed to be updated
  const filteredBody = filterObj(req.body, 'name', 'email');
  if (req.file) filteredBody.photo = req.file.filename;
  //3)update user document
  const Updateduser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  //response
  res.status(200).json({
    sucess: "success",
    data: {
      user: Updateduser,
    },
  });

  //render the package
  // res.status(200).render("account", {
  //   title: "Login into your account",
  //   user: Updateduser,
  // });
});

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.getAllUsers = factory.getAll(User);
exports.getUsers = factory.getOne(User);
//DON NOT UPDATE PASSWORD WITH THIS
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
