const express = require("express");

//routes
const userRouter = require("./routes/userRouter");
const operatorRouter = require("./routes/operatorRoutes");
const dotenv = require("dotenv");

dotenv.config();

const port = process.env.PORT || process.env.port;

const app = express();

//input middleware
app.use(express.json());
app.use("/", userRouter);
app.use("/", operatorRouter);

app.listen(port, () => {
  console.log(`server is listening on port ${port}`);
});
