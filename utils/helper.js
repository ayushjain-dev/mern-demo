const crypto = require("crypto");

exports.sendError = (res, error, statusCode = 401) => {
  return res.status(statusCode).json({ error });
};

exports.sendSuccess = (res, success, statusCode = 200) => {
  return res.status(statusCode).json({ success });
};

exports.generateCryptoToken = () => {
  return new Promise((resolve, reject) => {
    crypto.randomBytes(30, (err, buf) => {
      if (err) reject(err);
      const token = buf.toString("hex");
      resolve(token);
    });
  });
};
