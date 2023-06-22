// Rafael Ashurov 312054711
// Netanel Braginsky 205801160

// Import required modules
const express = require("express");
const mongoose = require("mongoose");
const costsRouter = require("./routes/costs");
const reportsRouter = require("./routes/reports");
const aboutRouter = require("./routes/about");
const User = require("./models/user");
const Report = require("./models/report");
const Cost = require("./models/cost");

// Create an Express application
const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI =
  "mongodb+srv://serverside-dev:serverside-dev@cluster0.yxhlqvk.mongodb.net/hit-server-side-development?retryWrites=true&w=majority";

/**
 * Connect to MongoDB Atlas and restart the database.
 */
mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(restartDatabase())
  .catch((err) => {
    console.error("Error connecting to MongoDB Atlas:", err);
  });

// Use JSON and URL encoded middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Configure routes
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
  console.log(`Server running at http://localhost:${PORT}`);
});

/**
 * Restart the database by emptying the collections and creating a demo user if not exist.
 */
async function restartDatabase() {
  console.log("Connected to MongoDB Atlas");

  // Empty the costs and reports collections
  const deletedReports = await Report.deleteMany({});
  const deletedCosts = await Cost.deleteMany({});
  console.log(`${deletedReports.deletedCount} report(s) deleted.`);
  console.log(`${deletedCosts.deletedCount} costs(s) deleted.`);

  // Add the demo user if it doesn't exist
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
}
