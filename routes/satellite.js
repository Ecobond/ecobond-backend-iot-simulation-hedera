const express = require("express");
const router = express.Router();
const satelliteController = require("../controllers/satelliteController");

// Capture new satellite image
router.post("/capture", satelliteController.captureImage);

// Analyze forest density
router.get(
  "/analysis/forest-density",
  satelliteController.analyzeForestDensity,
);

// Get NDVI trend
router.get("/analysis/ndvi/:region", satelliteController.getNDVITrend);

// Detect deforestation trend
router.get(
  "/analysis/deforestation/:region",
  satelliteController.detectDeforestationTrend,
);

// Estimate carbon stock
router.get("/analysis/carbon/:region", satelliteController.estimateCarbonStock);

// Get available regions
router.get("/regions", satelliteController.getRegions);

// Get image metadata
router.get("/metadata/:imageId", satelliteController.getImageMetadata);

module.exports = router;
