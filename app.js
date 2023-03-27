const express = require("express");
require("./db");
const app = express();
const userRouter = require("./routes/user");

app.use(express.json());
app.use("/ws/user", userRouter);

app.listen(8000, () => {
  console.log("app is listning to port: 8000");
});
