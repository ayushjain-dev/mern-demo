const nodemailer = require("nodemailer");

exports.generateOtp = () => {
  return parseInt(Math.random() * 1000000).toString();
};

exports.mailService = () =>
  nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 2525,
    auth: {
      user: "7451490dc5a936",
      pass: "bf2310906c2a3c",
    },
  });
