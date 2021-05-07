const express = require("express");
const {
  signUp,
  login,
  forgotPassword,
  resetPassword,
  updatePassword,
  protect,
  restrictTo,
  logout,
  isLoggedIn,

} = require("../controller/authController");
const {
  getAllUsers,
  updateMe,
  deleteUser,
  getMe,
  getUsers,
  uploadUserPhoto,
  resizeUserPhoto
} = require("../controller/userController");



// -------------------------------------//
const router = express.Router();

router.post("/signup", signUp);
router.post("/login", login);
router.get("/logout", logout);
router.post("/forgotPassword", forgotPassword);
router.patch("/resetPassword/:token", resetPassword);

// PROTECT ALL ROUTES AFTER THIS MIDDLEWARE
router.use(protect);
router.patch("/updateMyPassword", updatePassword);

// user controoler routes
router.get("/me", getMe, getUsers);
router.patch("/updateMe",uploadUserPhoto,resizeUserPhoto,updateMe);
router.delete("/deleteMe", deleteUser);

// RESTRICE ONLY ADMIN CAN ACCESS AFTER THIS MIDDLEWARE
// router.use(restrictTo("admin"));
router.get("/", getAllUsers);
router.get("/:id", getUsers);

module.exports = router;
