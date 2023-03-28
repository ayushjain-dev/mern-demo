const express = require("express");
const morgan = require("morgan");
require('dotenv').config();
require("./db");
const app = express();
const userRouter = require("./routes/user");

app.use(express.json());
app.use(morgan("dev"));
app.use("/ws/user", userRouter);

app.listen(8000, () => {
  console.log("app is listning to port: 8000");
});
