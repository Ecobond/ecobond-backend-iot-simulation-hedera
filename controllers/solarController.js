const SolarFarmSimulator = require("../simulators/SolarFarmSimulator");
const logger = require("../utils/logger");

// Initialize simulator
const solarSimulator = new SolarFarmSimulator();

// Add some default devices
solarSimulator.addDevice(
  1,
  "OcCalifornia Solar Farmeanic Cleanup Initiative",
  500,
);
solarSimulator.addDevice(2, "Solar Grid Innovators", 750);
solarSimulator.addDevice(3, "Rainforest Protectors", 600);
solarSimulator.addDevice(4, "H2O Pure Streams", 600);
solarSimulator.addDevice(5, "Wind Energy Co.", 600);
solarSimulator.addDevice(6, "Agri-Eco Collective", 600);
solarSimulator.addDevice(7, "Carbon Zero Org", 600);
solarSimulator.addDevice(8, "Eco-Plastics Inc.", 600);
solarSimulator.addDevice(9, "Biodiversity Fund", 600);
solarSimulator.addDevice(10, "Solar Powered Arrays", 600);
solarSimulator.addDevice(11, "Serengeti Preservation Network", 600);
solarSimulator.addDevice(12, "The Planet Restoration Commission", 600);

// Get current reading from a device
exports.getDeviceReading = (req, res) => {
  try {
    const { deviceId } = req.params;
    logger.info(`Fetching reading for device: ${deviceId}`);

    const reading = solarSimulator.getDeviceReading(deviceId);

    if (!reading) {
      return res.status(404).json({
        success: false,
        error: `Device ${deviceId} not found`,
      });
    }

    res.status(200).json({
      success: true,
      data: reading,
    });
  } catch (error) {
    logger.error("Error fetching device reading:", { message: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get readings from all devices
exports.getAllReadings = (req, res) => {
  try {
    logger.info("Fetching all solar farm readings");
    const readings = solarSimulator.getAllReadings();

    res.status(200).json({
      success: true,
      data: readings,
      count: readings.length,
    });
  } catch (error) {
    logger.error("Error fetching all readings:", { message: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get all devices
exports.getAllDevices = (req, res) => {
  try {
    logger.info("Fetching all solar farm devices");
    const devices = solarSimulator.getAllDevices();

    res.status(200).json({
      success: true,
      data: devices,
      count: devices.length,
    });
  } catch (error) {
    logger.error("Error fetching devices:", { message: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get device history
exports.getDeviceHistory = (req, res) => {
  try {
    const { deviceId } = req.params;
    const limit = parseInt(req.query.limit) || 100;

    logger.info(`Fetching history for device: ${deviceId} (limit: ${limit})`);

    const history = solarSimulator.getHistory(deviceId, limit);

    if (history.length === 0) {
      return res.status(404).json({
        success: false,
        error: `No history found for device ${deviceId}`,
      });
    }

    res.status(200).json({
      success: true,
      data: history,
      count: history.length,
    });
  } catch (error) {
    logger.error("Error fetching device history:", { message: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get statistics
exports.getStatistics = (req, res) => {
  try {
    const { deviceId } = req.params;
    logger.info(`Calculating statistics for device: ${deviceId || "all"}`);

    const stats = solarSimulator.getStatistics(deviceId);

    if (!stats) {
      return res.status(404).json({
        success: false,
        error: "No statistics available",
      });
    }

    res.status(200).json({
      success: true,
      data: stats,
      ...(Array.isArray(stats) ? { count: stats.length } : {}),
    });
  } catch (error) {
    logger.error("Error calculating statistics:", { message: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
};

// Add device
exports.addDevice = (req, res) => {
  try {
    const { deviceId, farmName, capacity } = req.body;

    if (!deviceId || !farmName) {
      return res.status(400).json({
        success: false,
        error: "deviceId and farmName are required",
      });
    }

    logger.info(`Adding new device: ${deviceId}`);
    const device = solarSimulator.addDevice(
      deviceId,
      farmName,
      capacity || 100,
    );

    res.status(201).json({
      success: true,
      message: "Device added successfully",
      data: device.getStatus(),
    });
  } catch (error) {
    logger.error("Error adding device:", { message: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
};

// Toggle device status
exports.toggleDeviceStatus = (req, res) => {
  try {
    const { deviceId } = req.params;
    const { isOnline } = req.body;

    if (typeof isOnline !== "boolean") {
      return res.status(400).json({
        success: false,
        error: "isOnline must be a boolean",
      });
    }

    logger.info(`Toggling device status: ${deviceId} -> ${isOnline}`);
    const status = solarSimulator.setDeviceStatus(deviceId, isOnline);

    if (!status) {
      return res.status(404).json({
        success: false,
        error: `Device ${deviceId} not found`,
      });
    }

    res.status(200).json({
      success: true,
      message: `Device status updated`,
      data: status,
    });
  } catch (error) {
    logger.error("Error toggling device status:", { message: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
};
