const express = require("express");
const CostsHandler = require("../handlers/costs");

const router = express.Router();

router.post("/", (req, res, next) => {
  CostsHandler.createNewCost(req, res, next);
});

module.exports = router;
