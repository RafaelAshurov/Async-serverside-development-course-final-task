const express = require("express");
const mongoose = require("mongoose");
const costsRouter = require("./routes/costs");
const reportsRouter = require("./routes/reports");
const aboutRouter = require("./routes/about");
const User = require("./models/user");

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI =
  "mongodb+srv://serverside-dev:serverside-dev@cluster0.yxhlqvk.mongodb.net/hit-server-side-development?retryWrites=true&w=majority";

// Atlas connection
mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    console.log("Connected to MongoDB Atlas");

    // Add the demo user if not exist
    const user = await User.findOneAndUpdate(
      { id: 123123 },
      {
        id: 123123,
        first_name: "moshe",
        last_name: "israeli",
        birthday: new Date(1990, 0, 10),
      },
      { upsert: true, new: true }
    );
    console.log("User created:", user);
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB Atlas:", err);
  });

// Using express middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Routes
app.use("/addcost", costsRouter);
app.use("/report", reportsRouter);
app.use("/about", aboutRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res
    .status(err.status || 500)
    .json({ error: err.message || "Internal Server Error" });
});

// Start the server
app.listen(PORT, () => {
  console.log(`http://localhost:3000`);
});
