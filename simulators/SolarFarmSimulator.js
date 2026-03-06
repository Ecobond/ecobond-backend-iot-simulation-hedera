const logger = require("../utils/logger");

class SolarFarmDevice {
  constructor(deviceId, farmName, capacity = 100) {
    this.deviceId = deviceId;
    this.farmName = farmName;
    this.capacity = capacity; // kW
    this.isOnline = true;
    this.lastUpdate = new Date();
  }

  // Simulate real-time solar output
  generateReading() {
    // Simulate daily cycle: peak at noon, lower at morning/evening
    const hour = new Date().getHours();
    const dayProgress = Math.sin((hour - 6) * (Math.PI / 12));
    const baseOutput = Math.max(0, dayProgress * this.capacity);

    // Add random fluctuations (clouds, etc.)
    const fluctuation = (Math.random() - 0.5) * (this.capacity * 0.2);
    const output = Math.max(0, baseOutput + fluctuation);

    const reading = {
      deviceId: this.deviceId,
      farmName: this.farmName,
      timestamp: new Date(),
      output: Math.round(output * 100) / 100, // kW
      capacity: this.capacity, // kW
      efficiency: Math.round((output / this.capacity) * 10000) / 100, // %
      temperature: 25 + Math.random() * 30, // Celsius
      humidity: 40 + Math.random() * 40, // %
      status: this.isOnline ? "online" : "offline",
    };

    this.lastUpdate = reading.timestamp;
    return reading;
  }

  // Toggle device status
  setOnline(status) {
    this.isOnline = status;
    logger.info(
      `Solar farm device ${this.deviceId} is now ${status ? "online" : "offline"}`,
    );
  }

  getStatus() {
    return {
      deviceId: this.deviceId,
      farmName: this.farmName,
      isOnline: this.isOnline,
      lastUpdate: this.lastUpdate,
      capacity: this.capacity,
    };
  }
}

class SolarFarmSimulator {
  constructor() {
    this.devices = new Map();
    this.readingsHistory = [];
    this.maxHistorySize = 1000;
  }

  // Add a new solar farm device
  addDevice(deviceId, farmName, capacity = 100) {
    const normalizedDeviceId = this._normalizeDeviceId(deviceId);
    if (!normalizedDeviceId) {
      throw new Error("deviceId must be a positive whole number");
    }

    const numericDeviceId = Number(normalizedDeviceId);
    const device = new SolarFarmDevice(numericDeviceId, farmName, capacity);
    this.devices.set(normalizedDeviceId, device);
    logger.info(`Added solar farm device: ${numericDeviceId} (${farmName})`);
    return device;
  }

  // Get reading from a specific device
  getDeviceReading(deviceId) {
    const normalizedDeviceId = this._normalizeDeviceId(deviceId);
    if (!normalizedDeviceId) {
      return null;
    }

    const device = this.devices.get(normalizedDeviceId);
    if (!device) {
      logger.warn(`Device not found: ${deviceId}`);
      return null;
    }

    const reading = device.generateReading();
    this._addToHistory(reading);
    return reading;
  }

  // Get all active devices
  getAllDevices() {
    return Array.from(this.devices.values()).map((device) =>
      device.getStatus(),
    );
  }

  // Get readings from all devices
  getAllReadings() {
    const readings = [];
    this.devices.forEach((device) => {
      const reading = device.generateReading();
      readings.push(reading);
      this._addToHistory(reading);
    });
    return readings;
  }

  // Get historical data for a device
  getHistory(deviceId, limit = 100) {
    const normalizedDeviceId = this._normalizeDeviceId(deviceId);
    if (!normalizedDeviceId) {
      return [];
    }

    return this.readingsHistory
      .filter((reading) => String(reading.deviceId) === normalizedDeviceId)
      .slice(-limit);
  }

  // Get aggregated statistics
  getStatistics(deviceId = null) {
    if (deviceId !== null && deviceId !== undefined) {
      const normalizedDeviceId = this._normalizeDeviceId(deviceId);
      if (!normalizedDeviceId || !this.devices.has(normalizedDeviceId)) {
        return null;
      }

      let relevantReadings = this.readingsHistory.filter(
        (reading) => String(reading.deviceId) === normalizedDeviceId,
      );

      if (relevantReadings.length === 0) {
        const reading = this.getDeviceReading(normalizedDeviceId);
        if (!reading) {
          return null;
        }
        relevantReadings = [reading];
      }

      return this._buildProjectStatistics(normalizedDeviceId, relevantReadings);
    }

    const allProjectStats = Array.from(this.devices.keys())
      .map((id) => {
        let deviceReadings = this.readingsHistory.filter(
          (reading) => String(reading.deviceId) === id,
        );

        if (deviceReadings.length === 0) {
          const reading = this.getDeviceReading(id);
          if (reading) {
            deviceReadings = [reading];
          }
        }

        if (deviceReadings.length === 0) {
          return null;
        }

        return this._buildProjectStatistics(id, deviceReadings);
      })
      .filter(Boolean);

    return allProjectStats.length > 0 ? allProjectStats : null;
  }

  // Toggle device online/offline
  setDeviceStatus(deviceId, isOnline) {
    const normalizedDeviceId = this._normalizeDeviceId(deviceId);
    if (!normalizedDeviceId) {
      return null;
    }

    const device = this.devices.get(normalizedDeviceId);
    if (!device) {
      return null;
    }
    device.setOnline(isOnline);
    return device.getStatus();
  }

  _addToHistory(reading) {
    this.readingsHistory.push(reading);
    if (this.readingsHistory.length > this.maxHistorySize) {
      this.readingsHistory.shift();
    }
  }

  _buildProjectStatistics(deviceId, readings) {
    const normalizedDeviceId = this._normalizeDeviceId(deviceId);
    if (!normalizedDeviceId) {
      return null;
    }

    const device = this.devices.get(normalizedDeviceId);
    if (!device || readings.length === 0) {
      return null;
    }

    const outputs = readings.map((reading) => reading.output);
    const efficiencies = readings.map((reading) => reading.efficiency);

    const averageOutput =
      Math.round(
        (outputs.reduce((sum, value) => sum + value, 0) / outputs.length) * 100,
      ) / 100;

    const averageEfficiency =
      Math.round(
        (efficiencies.reduce((sum, value) => sum + value, 0) /
          efficiencies.length) *
          100,
      ) / 100;

    const utilization = Math.min(
      100,
      Math.max(0, (averageOutput / device.capacity) * 100),
    );

    return {
      deviceId: device.deviceId,
      projectName: device.farmName,
      creditQuality: this._calculateCreditQualityScore(averageEfficiency),
      greenImpact: this._calculateGreenImpactScore(utilization),
      totalReadings: readings.length,
      averageOutput,
      maxOutput: Math.max(...outputs),
      minOutput: Math.min(...outputs),
      averageEfficiency,
      timestamp: new Date(),
    };
  }

  _calculateCreditQualityScore(averageEfficiency) {
    return Math.max(0, Math.min(100, Math.round(averageEfficiency)));
  }

  _calculateGreenImpactScore(utilizationScore) {
    return Math.max(0, Math.min(100, Math.round(utilizationScore)));
  }

  _normalizeDeviceId(deviceId) {
    if (deviceId === null || deviceId === undefined) {
      return null;
    }

    const numericDeviceId = Number(deviceId);
    if (!Number.isInteger(numericDeviceId) || numericDeviceId <= 0) {
      return null;
    }

    return String(numericDeviceId);
  }
}

module.exports = SolarFarmSimulator;
