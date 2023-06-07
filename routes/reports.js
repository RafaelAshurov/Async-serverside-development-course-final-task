const express = require("express");
const ReportsHandler = require("../handlers/reports");

const router = express.Router();

router.get("/", (req, res, next) => ReportsHandler.getReport(req, res, next));

module.exports = router;
