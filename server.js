const express = require("express");
const mongoose = require("mongoose");
const path = require("path");

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use("/uploads", express.static("uploads"));

mongoose.connect("mongodb+srv://mina:123@dmbadminton.lpjcvef.mongodb.net/?appName=DMBadminton")
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));

app.use("/", require("./routes/web"));

app.listen(3000, () => console.log("http://localhost:3000"));