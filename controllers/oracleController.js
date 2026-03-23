const oracleService = require("../utils/oracleService");
const oracleCron = require("../utils/oracleCron");
const { solarSimulator } = require("./solarController");
const logger = require("../utils/logger");

// Push all project scores on-chain
exports.pushAllScores = async (req, res) => {
  try {
    logger.info("Oracle: pushing all project scores on-chain");

    const stats = solarSimulator.getStatistics();
    if (!stats || (Array.isArray(stats) && stats.length === 0)) {
      return res.status(400).json({
        success: false,
        error: "No simulated statistics available. Generate some readings first.",
      });
    }

    const projectDetails = (Array.isArray(stats) ? stats : [stats]).map(
      (s) => ({
        projectId: s.deviceId,
        creditQuality: s.creditQuality,
        greenImpact: s.greenImpact,
        projectURI: "",
      }),
    );

    const result = await oracleService.pushImpactScores(projectDetails);

    res.status(200).json({
      success: true,
      message: `Pushed scores for ${result.projectCount} project(s)`,
      data: result,
    });
  } catch (error) {
    logger.error("Error pushing all scores:", { message: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
};

// Push score for a single project
exports.pushScoreForProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    logger.info(`Oracle: pushing score for project ${projectId}`);

    const stats = solarSimulator.getStatistics(projectId);
    if (!stats) {
      return res.status(404).json({
        success: false,
        error: `No statistics found for project/device ${projectId}`,
      });
    }

    const projectDetails = [
      {
        projectId: stats.deviceId,
        creditQuality: stats.creditQuality,
        greenImpact: stats.greenImpact,
        projectURI: "",
      },
    ];

    const result = await oracleService.pushImpactScores(projectDetails);

    res.status(200).json({
      success: true,
      message: `Pushed score for project ${projectId}`,
      data: result,
    });
  } catch (error) {
    logger.error(`Error pushing score for project ${req.params.projectId}:`, {
      message: error.message,
    });
    res.status(500).json({ success: false, error: error.message });
  }
};

// Read on-chain scores
exports.getOnChainScores = async (req, res) => {
  try {
    logger.info("Oracle: reading on-chain scores");

    const scores = await oracleService.getOnChainScores();

    res.status(200).json({
      success: true,
      data: scores,
      count: scores.length,
    });
  } catch (error) {
    logger.error("Error reading on-chain scores:", { message: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
};

// Compare simulated vs on-chain scores
exports.compareScores = async (req, res) => {
  try {
    logger.info("Oracle: comparing simulated vs on-chain scores");

    // Get simulated scores
    const stats = solarSimulator.getStatistics();
    const simulated = (Array.isArray(stats) ? stats : stats ? [stats] : []).map(
      (s) => ({
        projectId: s.deviceId,
        projectName: s.projectName,
        creditQuality: s.creditQuality,
        greenImpact: s.greenImpact,
      }),
    );

    // Try to get on-chain scores
    let onChain = null;
    let onChainError = null;
    try {
      onChain = await oracleService.getOnChainScores();
    } catch (err) {
      onChainError = err.message;
    }

    // Build comparison
    const comparison = simulated.map((sim) => {
      const chain = onChain
        ? onChain.find((c) => c.projectId === sim.projectId)
        : null;

      return {
        projectId: sim.projectId,
        projectName: sim.projectName,
        simulated: {
          creditQuality: sim.creditQuality,
          greenImpact: sim.greenImpact,
        },
        onChain: chain
          ? {
              creditQuality: chain.creditQuality,
              greenImpact: chain.greenImpact,
            }
          : null,
        drift: chain
          ? {
              creditQuality: sim.creditQuality - chain.creditQuality,
              greenImpact: sim.greenImpact - chain.greenImpact,
            }
          : null,
      };
    });

    res.status(200).json({
      success: true,
      data: {
        comparison,
        onChainAvailable: onChain !== null,
        ...(onChainError ? { onChainError } : {}),
      },
      count: comparison.length,
    });
  } catch (error) {
    logger.error("Error comparing scores:", { message: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get oracle status / info
exports.getStatus = async (req, res) => {
  try {
    const status = {
      configured: oracleService.isConfigured,
      walletAddress: oracleService.getWalletAddress(),
      contractAddress: process.env.PROJECT_CONTRACT_ADDRESS || null,
      rpcUrl: process.env.HEDERA_RPC_URL || null,
    };

    if (oracleService.isConfigured) {
      try {
        status.registeredOracleAddress =
          await oracleService.getRegisteredOracleAddress();
        status.totalOnChainProjects =
          await oracleService.getTotalProjects();
        status.isAuthorized =
          status.registeredOracleAddress.toLowerCase() ===
          status.walletAddress.toLowerCase();
      } catch (err) {
        status.contractError = err.message;
      }
    }

    res.status(200).json({
      success: true,
      data: status,
    });
  } catch (error) {
    logger.error("Error getting oracle status:", { message: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
};

// ─── Cron Control ────────────────────────────────────────────────────────────

// Get cron status
exports.getCronStatus = (req, res) => {
  try {
    logger.info("Oracle: fetching cron status");
    const status = oracleCron.getStatus();

    res.status(200).json({
      success: true,
      data: status,
    });
  } catch (error) {
    logger.error("Error getting cron status:", { message: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
};

// Start the cron
exports.startCron = (req, res) => {
  try {
    logger.info("Oracle: manual cron start requested via API");
    oracleCron.start();

    res.status(200).json({
      success: true,
      message: "Oracle cron start command issued",
      data: oracleCron.getStatus(),
    });
  } catch (error) {
    logger.error("Error starting cron:", { message: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
};

// Stop the cron
exports.stopCron = (req, res) => {
  try {
    logger.info("Oracle: manual cron stop requested via API");
    oracleCron.stop();

    res.status(200).json({
      success: true,
      message: "Oracle cron stop command issued",
      data: oracleCron.getStatus(),
    });
  } catch (error) {
    logger.error("Error stopping cron:", { message: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
};
