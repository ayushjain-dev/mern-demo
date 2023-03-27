const { check, validationResult } = require("express-validator");
const User = require("../models/user");
const { sendError } = require("../utils/helper");

exports.isUserExist = async (req, res, next) => {
  const { email } = req.body;
  const emailExist = await User.findOne({ email });
  if (emailExist) return sendError(res, "User Already Exists!!");
  next();
};

exports.userValidator = [
  check("email").normalizeEmail().isEmail().withMessage("email is missing"),
  check("password")
    .trim()
    .not()
    .isEmpty()
    .withMessage("password is missing")
    .isLength({ min: 8, max: 20 })
    .withMessage("password lenght is not between 8 to 20"),
];

exports.validatePassword = [
  check("newPassword")
    .trim()
    .not()
    .isEmpty()
    .withMessage("password is missing")
    .isLength({ min: 8, max: 20 })
    .withMessage("password lenght is not between 8 to 20"),
];

exports.validate = (req, res, next) => {
  const error = validationResult(req).array();
  let allErrors = [];
  if (error.length > 0) {
    error.map((element) => {
      allErrors.push(element.msg);
    });
    return sendError(res, allErrors);
  }
  next();
};
