const express = require("express");
const router = express.Router();
const oracleController = require("../controllers/oracleController");

// Oracle status
router.get("/status", oracleController.getStatus);

// Push all project scores on-chain
router.post("/push", oracleController.pushAllScores);

// Push single project score on-chain
router.post("/push/:projectId", oracleController.pushScoreForProject);

// Read on-chain scores
router.get("/scores", oracleController.getOnChainScores);

// Compare simulated vs on-chain
router.get("/compare", oracleController.compareScores);

// Cron control
router.get("/cron/status", oracleController.getCronStatus);
router.post("/cron/start", oracleController.startCron);
router.post("/cron/stop", oracleController.stopCron);

module.exports = router;
