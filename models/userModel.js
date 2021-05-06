const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "User must have a name"],
    trim: true,
  },
  email: {
    type: String,
    required: [true, "User must provide an email"],
    trim: true,
    lowercase: true,
    validate: [validator.isEmail, "Please provide valid email address "],
  },
  photo: {
    type: String,
    default: "default.jpg",
  },
  role: {
    type: String,
    enum: {
      values: ["user", "admin", "guide", "lead-guide"],
    },
    default: "user",
  },
  password: {
    type: String,
    required: [true, "User must provide an password"],
    // minlength: 8,
    select: false,
  },
  confirmPassword: {
    type: String,
    required: [true, "Please confirm your password"],
    validate: {
      validator: function (value) {
        //this only ponints to cuurent doc on NEW document creation not on update
        return value === this.password;
      },
      message: "Password are not matching",
    },
  },

  active: {
    type: Boolean,
    default: true,
    select: false,
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
});

// HASH PASSWORD BEFORE SAVING INTO DATABASE
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }

  this.password = await bcrypt.hash(this.password, 12);
  this.confirmPassword = undefined;
  next();
});

// update password after reseting password
userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || this.isNew) {
    return next();
  }

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

//THIS MIDDLEWARE WE RUN BEFORE ANY FIND QUERY
userSchema.pre(/^find/, async function (next) {
  this.find({ active: true });
  next();
});

// match password
userSchema.methods.validatePassword = async function (
  Candidatepassword,
  userPassword
) {
  return await bcrypt.compare(Candidatepassword, userPassword);
};

userSchema.methods.changedPasswordAfter = async function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    // console.log(changedTimestamp, JWTTimestamp);
    return JWTTimestamp < changedTimestamp; // 100 < 200 = true
  }
  //false means not changed that is our default
  return false;
};

userSchema.methods.createResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");
  //encrypt the token for securety to store in database
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

  //send plain text token
  return resetToken;
};

module.exports = mongoose.model("User", userSchema);
