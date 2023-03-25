const express = require("express");
const router = express.Router();
const { createUser, loginUser, emailVerification } = require("../controller/user");
const {
  userValidator,
  validate,
  isUserExist,
} = require("../middlewares/validator");

// Signup
router.post("/signup", isUserExist, createUser);

// Login
router.post("/signin", userValidator, validate, loginUser);

// Verify Email
router.post("/verify-email", emailVerification);

module.exports = router;
