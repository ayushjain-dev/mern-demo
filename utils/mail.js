const nodemailer = require("nodemailer");

exports.generateOtp = () => {
  return parseInt(Math.random() * 1000000).toString();
};

exports.mailService = () =>
  nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 2525,
    auth: {
      user: process.env.MAIL_TRAP_ID,
      pass: process.env.MAIL_TRAP_PASS,
    },
  });
