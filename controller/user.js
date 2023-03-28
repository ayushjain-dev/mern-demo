const jwt = require("jsonwebtoken");
const User = require("../models/user");
const EmailToken = require("../models/emailVerificationToken");
const PasswordResetToken = require("../models/passwordResetToken");
const { isValidObjectId } = require("mongoose");
const { mailService, generateOtp } = require("../utils/mail");
const {
  sendError,
  sendSuccess,
  generateCryptoToken,
} = require("../utils/helper");

exports.createUser = async (req, res) => {
  const { name, email, password } = req.body;

  // generate 6 digit otp
  const otp = generateOtp();

  // sending otp to user email
  var transport = mailService();
  transport.sendMail({
    from: "verification@reviewapp.com",
    to: email,
    subject: "Email Verification",
    html: `
      <p>Your OTP is: <b>${otp}</b></p>
      <p>Note: OTP valid till 5 minutes</p>
    `,
  });

  // create new user
  const newUser = new User({ name, email, password });
  await newUser.save();

  // store otp
  const newEmailToken = new EmailToken({ owner: newUser._id, token: otp });
  await newEmailToken.save();

  // api success response
  return sendSuccess(
    res,
    "OTP has been sent to your email, Please verify your account!"
  );
};

exports.emailVerification = async (req, res) => {
  const { userId, otp } = req.body;

  // check is valid id
  if (!isValidObjectId(userId)) return sendError(res, "Invalid user");

  // check if user exist and is already verified
  const user = await User.findOne({ _id: userId });
  if (!user) return sendError(res, "Account not found");
  if (user.isVerified) return sendError(res, "User is already verified");

  // check if token exist and is valid
  const token = await EmailToken.findOne({ owner: userId });
  if (!token) return sendError(res, "token not found");

  const isMatched = await token.compareToken(otp);
  if (!isMatched) return sendError(res, "Invalid OTP");

  // verify token and delete token after verification
  user.isVerified = true;
  await user.save();
  await EmailToken.findByIdAndDelete(token._id);

  // sending welcome email to user
  var transport = mailService();
  transport.sendMail({
    from: "verification@reviewapp.com",
    to: user.email,
    subject: "Welcome Email",
    html: `
      <p>Thanks for verification</p>
    `,
  });

  // api success response
  return sendSuccess(res, "Your email is verified.");
};

exports.resendEmailVerificationToken = async (req, res) => {
  const { userId } = req.body;

  // check is valid id
  if (!isValidObjectId(userId)) return sendError(res, "Invalid user");
  // check is user exist & already verified
  const user = await User.findOne({ _id: userId });
  if (!user) return sendError(res, "Account not found");
  if (user.isVerified) return sendError(res, "User already verified");

  // check if token expired and send new token
  const token = await EmailToken.findOne({ owner: userId });
  if (token) return sendError(res, "Apply for new OTP after 5 min");

  const otp = generateOtp();
  var transport = mailService();
  transport.sendMail({
    from: "verification@reviewapp.com",
    to: user.email,
    subject: "Email Verification",
    html: `
      <p>Your OTP is: <b>${otp}</b></p>
      <p>Note: OTP valid till 5 minutes</p>
    `,
  });

  const newEmailToken = new EmailToken({ owner: userId, token: otp });
  await newEmailToken.save();
  return sendSuccess(res, "New OTP sent successfully to your email.");
};

exports.forgetPassword = async (req, res) => {
  const { email } = req.body;

  // if email id is missing
  if (!email) return sendError(res, "Email is missing");

  // check account linked with email
  const user = await User.findOne({ email });
  if (!user) return sendError(res, "Account not found", 404);

  // find existing reset token if any
  const token = await PasswordResetToken.findOne({ owner: user._id });
  if (token) return sendError(res, "Apply after 5 minutes");

  // generate new token and save in DB
  const newToken = await generateCryptoToken();
  const newPasswordResetToken = await new PasswordResetToken({
    owner: user._id,
    token: newToken,
  });
  await newPasswordResetToken.save();

  // creating password reset link and sending to user's email
  const resetPasswordUrl = `http://localhost:3000/reset-password?token=${newToken}&id=${user._id}`;
  var transport = mailService();
  transport.sendMail({
    from: "security@reviewapp.com",
    to: user.email,
    subject: "Reset Password",
    html: `
      <p><a href="${resetPasswordUrl}">Click here to Reset Password</a><p>
    `,
  });

  // success response
  return sendSuccess(res, "password link sent to email");
};

exports.isValidPasswordResetToken = async (req, res) => {
  const { token, userId } = req.body;

  // check object id is valid
  if (!isValidObjectId(userId) || !token)
    return sendError(res, "Invalid request!");

  // check user is valid
  const user = await User.findOne({ _id: userId });
  if (!user) return sendError(res, "User not found", 404);

  // check token is valid
  const resetToken = await PasswordResetToken.findOne({ owner: userId });
  if (!resetToken)
    return sendError(res, "unauthorised access, invalid request");

  const isMatched = await resetToken.compareToken(token);
  if (!isMatched) return sendError(res, "unauthorised access, invalid request");

  // success response
  return sendSuccess(res, "Verified successfully.");
};

exports.resetPassword = async (req, res) => {
  const { password, userId, token } = req.body;

  // check user is valid
  const user = await User.findOne({ _id: userId });
  if (!user) return sendError(res, "User not found", 404);

  // validate password reset token
  const resetToken = await PasswordResetToken.findOne({ owner: userId });
  if (!resetToken) return sendError(res, "Unauthorised access!");
  const tokenMatched = await resetToken.compareToken(token);
  if (!tokenMatched) return sendError(res, "Unauthorised access!");

  // compare new password with old password
  const isOldPassword = await user.comparePassword(password);
  if (isOldPassword)
    return sendError(res, "New password must be different from old password!");

  // delete password reset token and save new password
  await PasswordResetToken.findByIdAndDelete(resetToken._id);
  user.password = password;
  await user.save();

  // success response
  return sendSuccess(res, "Password changed successfully");
};

exports.loginUser = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return sendError(res, "Email/Password mismatch!");

  const matchPassword = await user.comparePassword(password);
  if (!matchPassword) return sendError(res, "Email/Password mismatch");

  const { _id, name } = user;

  const jwtToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
  return sendSuccess(res, { id: _id, name, email, token: jwtToken });
};
