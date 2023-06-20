// Rafael Ashurov 312054711
// Netanel Braginsky 205801160

const express = require("express");
const CostsHandler = require("../handlers/costs");

const router = express.Router();

router.post("/", (req, res, next) => {
  CostsHandler.createNewCost(req, res, next);
});

module.exports = router;
