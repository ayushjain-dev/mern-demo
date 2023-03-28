const express = require("express");
const router = express.Router();
const {
  createUser,
  loginUser,
  emailVerification,
  resendEmailVerificationToken,
  forgetPassword,
  isValidPasswordResetToken,
  resetPassword,
} = require("../controller/user");
const {
  userValidator,
  validate,
  isUserExist,
  validatePassword,
} = require("../middlewares/validator");

router.post("/signup", isUserExist, validatePassword, validate, createUser);
router.post("/signin", userValidator, validate, loginUser);
router.post("/verify-email", emailVerification);
router.post("/re-verify-email", resendEmailVerificationToken);
router.post("/forget-password", forgetPassword);
router.post("/verify-reset-password-token", isValidPasswordResetToken);
router.post("/reset-password", validatePassword, validate, resetPassword);

module.exports = router;
