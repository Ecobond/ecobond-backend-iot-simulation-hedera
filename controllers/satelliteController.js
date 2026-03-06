const SatelliteImageryAI = require("../simulators/SatelliteImageryAI");
const logger = require("../utils/logger");

// Initialize simulator
const satelliteAI = new SatelliteImageryAI();

// Capture new satellite image
exports.captureImage = (req, res) => {
  try {
    const { region } = req.body;
    logger.info(
      `Capturing satellite image${region ? ` for region: ${region}` : ""}`,
    );

    const image = satelliteAI.captureImage(region);

    res.status(201).json({
      success: true,
      message: "Satellite image captured",
      data: image.getStatus
        ? image.getStatus()
        : {
            imageId: image.imageId,
            region: image.region,
            timestamp: image.timestamp,
          },
    });
  } catch (error) {
    logger.error("Error capturing image:", { message: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
};

// Analyze forest density
exports.analyzeForestDensity = (req, res) => {
  try {
    const { region } = req.query;
    const limit = parseInt(req.query.limit) || 10;

    logger.info(
      `Analyzing forest density${region ? ` for region: ${region}` : ""}`,
    );

    const analysis = satelliteAI.analyzeForestDensity(region, limit);

    res.status(200).json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    logger.error("Error analyzing forest density:", { message: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
};

// Detect deforestation trend
exports.detectDeforestationTrend = (req, res) => {
  try {
    const { region } = req.params;
    const daysBack = parseInt(req.query.days) || 30;

    logger.info(
      `Detecting deforestation trend for ${region} (${daysBack} days)`,
    );

    const trend = satelliteAI.detectDeforestationTrend(region, daysBack);

    res.status(200).json({
      success: true,
      data: trend,
    });
  } catch (error) {
    logger.error("Error detecting deforestation:", { message: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
};

// Estimate carbon stock
exports.estimateCarbonStock = (req, res) => {
  try {
    const { region } = req.params;
    logger.info(`Estimating carbon stock for region: ${region}`);

    const carbonEstimate = satelliteAI.estimateCarbonStock(region);

    if (!carbonEstimate) {
      return res.status(404).json({
        success: false,
        error: `No data available for region: ${region}`,
      });
    }

    res.status(200).json({
      success: true,
      data: carbonEstimate,
    });
  } catch (error) {
    logger.error("Error estimating carbon stock:", { message: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get NDVI trend
exports.getNDVITrend = (req, res) => {
  try {
    const { region } = req.params;
    const limit = parseInt(req.query.limit) || 10;

    logger.info(`Computing NDVI trend for region: ${region}`);

    const ndviTrend = satelliteAI.calculateNDVITrend(region, limit);

    res.status(200).json({
      success: true,
      data: ndviTrend,
    });
  } catch (error) {
    logger.error("Error computing NDVI trend:", { message: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get available regions
exports.getRegions = (req, res) => {
  try {
    logger.info("Fetching available satellite regions");

    const defaultRegions = [
      "Amazon Basin",
      "Congo Basin",
      "Southeast Asia",
      "Boreal Forest",
    ];
    const capturedRegions = satelliteAI.getAvailableRegions();
    const allRegions = [...new Set([...defaultRegions, ...capturedRegions])];

    res.status(200).json({
      success: true,
      data: {
        regions: allRegions,
        capturedCount: capturedRegions.length,
        totalImagesProcessed: satelliteAI.getTotaxlImages(),
      },
    });
  } catch (error) {
    logger.error("Error fetching regions:", { message: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get image metadata
exports.getImageMetadata = (req, res) => {
  try {
    const { imageId } = req.params;
    logger.info(`Fetching metadata for image: ${imageId}`);

    const metadata = satelliteAI.getImageMetadata(imageId);

    if (!metadata) {
      return res.status(404).json({
        success: false,
        error: `Image not found: ${imageId}`,
      });
    }

    res.status(200).json({
      success: true,
      data: metadata,
    });
  } catch (error) {
    logger.error("Error fetching image metadata:", { message: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
};
