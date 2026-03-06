const express = require("express");
const router = express.Router();
const solarController = require("../controllers/solarController");

// Get all devices
router.get("/devices", solarController.getAllDevices);

// Add new device
router.post("/devices", solarController.addDevice);

// Get current reading from all devices
router.get("/readings", solarController.getAllReadings);

// Get reading from specific device
router.get("/devices/:deviceId/reading", solarController.getDeviceReading);

// Get history for specific device
router.get("/devices/:deviceId/history", solarController.getDeviceHistory);

// Get statistics
router.get("/statistics/:deviceId", solarController.getStatistics);
router.get("/statistics", solarController.getStatistics);

// Toggle device online/offline
router.patch("/devices/:deviceId/status", solarController.toggleDeviceStatus);

module.exports = router;
