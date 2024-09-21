const express = require("express");

const rootRouter = require("./routes/index");

const cors = require("cors");

const app = express();

app.use(cors());
app.use("/api/v1", rootRouter);
app.use(express.json());

app.listen(3000, () => console.log("We running a 3000, babiedowl"));


