const mongoose = require("mongoose");

mongoose
  .connect(process.env.DB_URI)
  .then(() => {
    console.log("db is connected");
  })
  .catch((error) => {
    console.log("db connection failed", error);
  });
