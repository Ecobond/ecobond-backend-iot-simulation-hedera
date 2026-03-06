const logger = require("../utils/logger");

class SatelliteImage {
  constructor(imageId, region, timestamp) {
    this.imageId = imageId;
    this.region = region;
    this.timestamp = timestamp;
    this.resolution = "10m"; // meters per pixel
    this.cloudCoverage = Math.random() * 50; // 0-50%
  }

  // Analyze forest density using AI simulation
  analyzeForestDensity() {
    // Simulate AI analysis of forest canopy
    // Higher values = denser forest
    const baseForestDensity = 0.6 + Math.random() * 0.3; // 60-90%
    const cloudImpact = (this.cloudCoverage / 100) * 0.2; // clouds reduce visibility

    const forestDensity = Math.max(
      0,
      Math.min(1, baseForestDensity - cloudImpact),
    );

    return {
      imageId: this.imageId,
      region: this.region,
      timestamp: this.timestamp,
      forestDensity: Math.round(forestDensity * 10000) / 100, // percentage
      cloudCoverage: Math.round(this.cloudCoverage * 100) / 100,
      confidence: Math.round((1 - this.cloudCoverage / 100) * 10000) / 100, // % confidence
      quality: this.cloudCoverage < 20 ? "high" : "medium",
      analysisTime: Math.round(Math.random() * 5000 + 1000), // ms
    };
  }

  // Detect vegetation changes (deforestation/reforestation)
  detectVegetationChange(previousDensity = null) {
    const currentAnalysis = this.analyzeForestDensity();

    if (!previousDensity) {
      return {
        ...currentAnalysis,
        change: 0,
        changeType: "baseline",
        alert: false,
      };
    }

    const change = currentAnalysis.forestDensity - previousDensity;
    const changePercent = Math.round((change / previousDensity) * 10000) / 100;

    return {
      ...currentAnalysis,
      change: Math.round(change * 10000) / 100,
      changePercent,
      changeType:
        change > 0.5
          ? "reforestation"
          : change < -0.5
            ? "deforestation"
            : "stable",
      alert: Math.abs(change) > 2, // Alert if change > 2%
    };
  }

  // Biomass estimation
  estimateBiomass() {
    const analysis = this.analyzeForestDensity();
    const densityRatio = analysis.forestDensity / 100; // 0-1

    // Biomass estimation based on forest density (tons/hectare)
    const agbPerHectare = densityRatio * 300; // up to 300 tons/hectare
    const totalBiomass = agbPerHectare * 10; // 10 hectare region

    return {
      imageId: this.imageId,
      region: this.region,
      timestamp: this.timestamp,
      agb: Math.round(agbPerHectare * 100) / 100, // Above Ground Biomass (tons/hectare)
      totalBiomass: Math.round(totalBiomass * 100) / 100, // Total biomass (tons)
      carbonSequestration: Math.round(totalBiomass * 0.47 * 100) / 100, // Carbon stock (tons)
      forestDensity: analysis.forestDensity,
    };
  }

  // NDVI (Normalized Difference Vegetation Index) calculation
  calculateNDVI() {
    const baseNDVI = 0.5 + Math.random() * 0.3; // 0.5-0.8 for healthy vegetation
    const cloudedNDVI = baseNDVI * (1 - this.cloudCoverage / 100);

    return {
      imageId: this.imageId,
      region: this.region,
      timestamp: this.timestamp,
      ndvi: Math.round(cloudedNDVI * 10000) / 10000, // -1 to 1, higher = healthier
      interpretation:
        cloudedNDVI > 0.6
          ? "Dense vegetation"
          : cloudedNDVI > 0.4
            ? "Moderate vegetation"
            : "Low vegetation",
    };
  }
}

class SatelliteImageryAI {
  constructor() {
    this.images = new Map();
    this.analysisCache = new Map();
    this.regions = [
      "Amazon Basin",
      "Congo Basin",
      "Southeast Asia",
      "Boreal Forest",
    ];
    this.analysisId = 0;
  }

  // Capture new satellite image (simulated)
  captureImage(region = null) {
    const selectedRegion =
      region || this.regions[Math.floor(Math.random() * this.regions.length)];
    const imageId = `SAT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const image = new SatelliteImage(imageId, selectedRegion, new Date());
    this.images.set(imageId, image);

    logger.info(`Captured satellite image: ${imageId} (${selectedRegion})`);
    return image;
  }

  // Analyze forest density for a region
  analyzeForestDensity(region = null, limit = 10) {
    const analysis = [];
    const relevantImages = Array.from(this.images.values())
      .filter((img) => !region || img.region === region)
      .slice(-limit);

    relevantImages.forEach((image) => {
      analysis.push(image.analyzeForestDensity());
    });

    return {
      analysisId: `ANALYSIS-${++this.analysisId}`,
      region: region || "all",
      imageCount: analysis.length,
      timestamp: new Date(),
      data: analysis,
      averageDensity:
        analysis.length > 0
          ? Math.round(
              (analysis.reduce((sum, a) => sum + a.forestDensity, 0) /
                analysis.length) *
                100,
            ) / 100
          : 0,
    };
  }

  // Detect changes between consecutive images
  detectDeforestationTrend(region, daysBack = 30) {
    const now = new Date();
    const cutoffDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);

    const relevantImages = Array.from(this.images.values())
      .filter((img) => img.region === region && img.timestamp > cutoffDate)
      .sort((a, b) => a.timestamp - b.timestamp);

    if (relevantImages.length < 2) {
      return {
        region,
        alert: false,
        message: "Insufficient data for trend analysis",
      };
    }

    const analyses = relevantImages.map((img, idx) => {
      const previousDensity =
        idx > 0
          ? relevantImages[idx - 1].analyzeForestDensity().forestDensity
          : null;
      return img.detectVegetationChange(previousDensity);
    });

    const deforestationDetected = analyses.some(
      (a) => a.alert && a.changeType === "deforestation",
    );

    return {
      region,
      daysAnalyzed: daysBack,
      imagesSampled: relevantImages.length,
      deforestationDetected,
      analyses: analyses.slice(-5), // last 5
      overallTrend:
        analyses.length > 0
          ? analyses[analyses.length - 1].changeType
          : "unknown",
      timestamp: new Date(),
    };
  }

  // Estimate carbon stock for a region
  estimateCarbonStock(region) {
    const relevantImages = Array.from(this.images.values())
      .filter((img) => img.region === region)
      .slice(-10);

    if (relevantImages.length === 0) {
      return null;
    }

    const biomassEstimates = relevantImages.map((img) => img.estimateBiomass());

    const totalCarbon = biomassEstimates.reduce(
      (sum, b) => sum + b.carbonSequestration,
      0,
    );
    const avgCarbon = totalCarbon / biomassEstimates.length;

    return {
      region,
      sampledImages: relevantImages.length,
      averageCarbonPerImage: Math.round(avgCarbon * 100) / 100,
      totalCarbonEstimate: Math.round(totalCarbon * 100) / 100,
      unit: "tons CO2 equivalent",
      timestamp: new Date(),
    };
  }

  // Calculate NDVI trend
  calculateNDVITrend(region, limit = 10) {
    const relevantImages = Array.from(this.images.values())
      .filter((img) => img.region === region)
      .slice(-limit);

    const ndviValues = relevantImages.map((img) => img.calculateNDVI());

    return {
      region,
      sampledImages: ndviValues.length,
      ndviValues: ndviValues,
      averageNDVI:
        ndviValues.length > 0
          ? Math.round(
              (ndviValues.reduce((sum, n) => sum + n.ndvi, 0) /
                ndviValues.length) *
                10000,
            ) / 10000
          : 0,
      timestamp: new Date(),
    };
  }

  // Get image metadata
  getImageMetadata(imageId) {
    const image = this.images.get(imageId);
    if (!image) {
      return null;
    }

    return {
      imageId: image.imageId,
      region: image.region,
      timestamp: image.timestamp,
      resolution: image.resolution,
      cloudCoverage: Math.round(image.cloudCoverage * 100) / 100,
    };
  }

  // Get all available regions
  getAvailableRegions() {
    const regions = new Set();
    this.images.forEach((img) => regions.add(img.region));
    return Array.from(regions);
  }

  // Get total captured images
  getTotaxlImages() {
    return this.images.size;
  }
}

module.exports = SatelliteImageryAI;
