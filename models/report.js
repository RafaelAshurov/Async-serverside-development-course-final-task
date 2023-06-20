// Rafael Ashurov 312054711
// Netanel Braginsky 205801160

const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema({
  user_id: {
    type: Number,
    required: true,
  },
  year: {
    type: Number,
    required: true,
  },
  month: {
    type: Number,
    required: true,
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
});

const Report = mongoose.model("Report", reportSchema);

module.exports = Report;
