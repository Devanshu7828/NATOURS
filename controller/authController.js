const { promisify } = require("util");
const User = require("../models/userModel");
const AppError = require("../utils/appError");
const Email = require("../utils/email");
const catchAsync = require("../utils/catchAsync");
const jwt = require("jsonwebtoken");
const userModel = require("../models/userModel");
const crypto = require("crypto");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createAndSendToken = (user, statusCode, res,req) => {
  const token = generateToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.COOKIE_EXPIRES * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    // secure: req.secure || req.headers("x-forwarded-proto") === "https",
  };

  // if (process.env.NODE_ENV === "production") cookieOptions.secure = true;
  if (req.secure || req.header("x-forwarded-proto") === "https")
    cookieOptions.secure = true;

  res.cookie("jwt", token, cookieOptions);
  //remove password from output;
  user.password = undefined;
  //response
  res.status(statusCode).json({
    sucess: "success",
    data: {
      user,
      token,
    },
  });
};
exports.signUp = catchAsync(async (req, res, next) => {
  const newUser = await User.create(req.body);

  const url = `${req.protocol}://${req.get("host")}/me`;
  await new Email(newUser, url).sendWelcome();
  console.log("email sendt successfully");
  createAndSendToken(newUser, 201, res,req);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new AppError("Please provide email and password", 400));
  }
  // check if email exist in database
  const user = await User.findOne({ email }).select("+password");
  // match the password
  const isMatch = await user.validatePassword(password, user.password);
  if (!user || !isMatch) {
    return next(new AppError("Incorect email or password", 401));
  }
  //if ok send token to client
  createAndSendToken(user, 200,req,res);
});

exports.logout = catchAsync(async (req, res, next) => {
  res.cookie("jwt", "loggedout", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({
    status: "success",
  });
});
exports.protect = catchAsync(async (req, res, next) => {
  // 1) Getting token and check of it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError("You are not logged in! Please log in to get access.", 401)
    );
  }
  //2) validate token
  const decodedPayload = await jwt.verify(token, process.env.JWT_SECRET);

  // 3) check if user exists
  const currentUser = await User.findById(decodedPayload.id);
  if (!currentUser) {
    return next(new AppError("You are not ther owner of this route", 401));
  }
  //4) check if user changed password after the token was issued
  // if (currentUser.changedPasswordAfter(decodedPayload.iat)) {
  //   return next(
  //     new AppError("User recently change password! log in again", 401)
  //   );
  // }
  //grant access to protect route
  req.user = currentUser;
  res.locals.user = currentUser;

  next();
});

//ONLY FOR RENDER PAGES, NO ERROR
exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      // 1) verify token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      // 2) Check if user still exists
      const currentUser = await User.findById(decoded.id);

      if (!currentUser) {
        return next();
      }
      // 3) Check if user changed password after the token was issued

      // THERE IS A LOGGED IN USER
      res.locals.user = currentUser;
      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    //roles is an array['admin','lead-guide'] role='user'
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You dont have permission to access this route", 403)
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  //1) Get user based on posted email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError("There is no user with this email address", 404));
  }
  //2)generate random reset token
  const resetToken = user.createResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  // const message =
  //   `Forgot your password Submit a patch request with your new password and password confirmation to: ${restUrl}
  //  \n if you did not forget your password please egnore this message`;
  try {
    //3) send back as an email
    // const resetUrl = `${req.protocol}://${req.get(
    //   "host"
    // )}/api/v1/users/me`;

    // await sendEmail({
    //   email: user.email,
    //   subject: `Your password reset token (valid for 10 min)`,
    //   message,
    // });
    // console.log(resetUrl);
    // await new Email(user, resetUrl).sendPasswordResetLink();
    const reseturl = `${req.protocol}://${req.get(
      "host"
    )}/resetPassword/${resetToken}`;
    await new Email(user, reseturl).sendPasswordResetLink();
    res.status(200).json({
      msg: "email send succesfully",
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError("There was an error sending the email try again later", 500)
    );
  }
});
exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) get user based on the token
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  //2) If token has not expireda and there is user,set the new password
  if (!user) {
    return new AppError("Token has been expired or invlaid", 400);
  }
  // Set new password
  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  //3) Update changePasswordAt property for the users
  //4) Log the user in, send jwt
  createAndSendToken(user, 200,req,res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  //1) get user from the collection
  const user = await User.findById(req.user.id).select("+password");
  //2) posted password is correct
  const isMatch = await user.validatePassword(
    req.body.passwordCurrent,
    user.password
  );

  if (!user || !isMatch) {
    return next(new AppError("Your current password is incorrect", 401));
  }
  //3) if currect update the password
  user.password = req.body.password;
  user.confirmPassword = req.body.passwordConfirm;
  await user.save();
  //4)log user in, send jwt
  createAndSendToken(user, 200, req,res);
});
