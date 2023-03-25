const nodemailer = require("nodemailer");
const User = require("../models/user");
const EmailToken = require("../models/emailVerificationToken");
const { isValidObjectId } = require("mongoose");

exports.createUser = async (req, res) => {
  const { name, email, password } = req.body;
  const newUser = new User({ name, email, password });
  await newUser.save();

  // generate 6 digit otp
  const otp = parseInt(Math.random() * 1000000).toString();

  // store otp
  const newEmailToken = new EmailToken({ owner: newUser._id, token: otp });
  await newEmailToken.save();

  // sending otp to user email
  var transport = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 2525,
    auth: {
      user: "5958f0adfbc4f0",
      pass: "dd8accbe4a83c7",
    },
  });

  transport.sendMail({
    from: "verification@reviewapp.com",
    to: email,
    subject: "Email Verification",
    html: `
      <p>Your OTP is: ${otp}</p>
    `,
  });

  res
    .status(201)
    .json("Please verify your email. OTP has been sent to your email account!");
};

exports.emailVerification = async (req, res) => {
  const { userId, otp } = req.body;
  if (!isValidObjectId(userId))
    return res.status(401).json({ error: "Invalid user" });

  const user = await User.findOne({ _id: userId });
  if (!user) return res.status(401).json({ error: "Account not found" });
  if (user.isVerified) return res.json({ error: "User is already verified" });
  
  const token = await EmailToken.findOne({ owner: userId });
  if (!token) return res.json({ error: "token not found" });
  
  const isMatched = await token.compareToken(otp);
  if (!isMatched) return res.json({ error: "Invalid OTP" });
  user.isVerified = true;
  await user.save();

  await EmailToken.findByIdAndDelete(token._id);

  // sending welcome email to user
  var transport = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 2525,
    auth: {
      user: "5958f0adfbc4f0",
      pass: "dd8accbe4a83c7",
    },
  });
  transport.sendMail({
    from: "verification@reviewapp.com",
    to: user.email,
    subject: "Welcome Email",
    html: `
      <p>Thanks for verification</p>
    `,
  });
  res.json({ message: "Your email is verified." });
};

exports.loginUser = (req, res) => {
  res.json("Connected");
};
