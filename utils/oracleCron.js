const oracleService = require("./oracleService");
const { solarSimulator } = require("../controllers/solarController");
const logger = require("./logger");

// ─── Constants ───────────────────────────────────────────────────────────────
const DEFAULT_INTERVAL_MS = 60_000; // 1 minute
const MAX_RETRIES = 3;
const BASE_BACKOFF_MS = 2_000;

class OracleCron {
  constructor() {
    this._timer = null;
    this._running = false;
    this._intervalMs =
      parseInt(process.env.ORACLE_UPDATE_INTERVAL_MS, 10) ||
      DEFAULT_INTERVAL_MS;

    // Tracking
    this._successCount = 0;
    this._failureCount = 0;
    this._cycleCount = 0;
    this._lastRunAt = null;
    this._lastSuccessAt = null;
    this._lastFailureAt = null;
    this._lastError = null;
    this._lastTxHash = null;
  }

  // ─── Lifecycle ─────────────────────────────────────────────────────────────

  /**
   * Start the periodic oracle update loop.
   * Safe to call multiple times — will no-op if already running.
   */
  start() {
    if (this._running) {
      logger.warn("⏳ Oracle cron is already running — ignoring start()");
      return;
    }

    // Pre-flight: check oracle configuration
    if (!oracleService.isConfigured) {
      logger.warn(
        "⚠️  Oracle cron NOT started — oracle service is not configured. " +
          "Set HEDERA_RPC_URL, ORACLE_PRIVATE_KEY, and PROJECT_CONTRACT_ADDRESS in .env",
      );
      return;
    }

    this._running = true;
    logger.info("═══════════════════════════════════════════════════════════");
    logger.info("🚀 Oracle cron STARTED");
    logger.info(`   Interval : ${this._intervalMs} ms (${(this._intervalMs / 1000).toFixed(1)}s)`);
    logger.info(`   Wallet   : ${oracleService.getWalletAddress()}`);
    logger.info(`   Contract : ${process.env.PROJECT_CONTRACT_ADDRESS}`);
    logger.info("═══════════════════════════════════════════════════════════");

    // Run immediately on start, then on interval
    this._executeCycle();
    this._timer = setInterval(() => this._executeCycle(), this._intervalMs);
  }

  /**
   * Stop the periodic loop. Safe to call when already stopped.
   */
  stop() {
    if (!this._running) {
      logger.warn("⏹️  Oracle cron is not running — ignoring stop()");
      return;
    }

    clearInterval(this._timer);
    this._timer = null;
    this._running = false;

    logger.info("═══════════════════════════════════════════════════════════");
    logger.info("🛑 Oracle cron STOPPED");
    logger.info(`   Total cycles  : ${this._cycleCount}`);
    logger.info(`   Successes     : ${this._successCount}`);
    logger.info(`   Failures      : ${this._failureCount}`);
    logger.info("═══════════════════════════════════════════════════════════");
  }

  // ─── Status ────────────────────────────────────────────────────────────────

  /**
   * Returns a snapshot of the cron's current state for API consumers.
   */
  getStatus() {
    return {
      running: this._running,
      intervalMs: this._intervalMs,
      intervalHuman: `${(this._intervalMs / 1000).toFixed(1)}s`,
      cycleCount: this._cycleCount,
      successCount: this._successCount,
      failureCount: this._failureCount,
      lastRunAt: this._lastRunAt,
      lastSuccessAt: this._lastSuccessAt,
      lastFailureAt: this._lastFailureAt,
      lastError: this._lastError,
      lastTxHash: this._lastTxHash,
      nextRunAt: this._running && this._lastRunAt
        ? new Date(this._lastRunAt.getTime() + this._intervalMs)
        : null,
    };
  }

  // ─── Core Cycle ────────────────────────────────────────────────────────────

  async _executeCycle() {
    this._cycleCount++;
    this._lastRunAt = new Date();
    const cycleId = this._cycleCount;

    logger.info("───────────────────────────────────────────────────────────");
    logger.info(`🔄 Oracle cron cycle #${cycleId} starting at ${this._lastRunAt.toISOString()}`);

    // ── Step 1: Gather simulated data ─────────────────────────────────────
    let projectDetails;
    try {
      projectDetails = this._gatherProjectData();
    } catch (err) {
      this._recordFailure(cycleId, `Data gathering failed: ${err.message}`);
      return;
    }

    if (!projectDetails || projectDetails.length === 0) {
      this._recordFailure(cycleId, "No project data available from simulator");
      return;
    }

    logger.info(
      `   📊 Gathered data for ${projectDetails.length} project(s):`,
    );
    projectDetails.forEach((p) => {
      logger.info(
        `      Project #${p.projectId} — creditQuality: ${p.creditQuality}, greenImpact: ${p.greenImpact}`,
      );
    });

    // ── Step 2: Push on-chain with retries ────────────────────────────────
    let lastErr = null;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        logger.info(
          `   ⛓️  Pushing on-chain (attempt ${attempt}/${MAX_RETRIES})...`,
        );

        const result = await oracleService.pushImpactScores(projectDetails);

        // Success!
        this._successCount++;
        this._lastSuccessAt = new Date();
        this._lastTxHash = result.txHash;
        this._lastError = null;

        logger.info(`   ✅ Cycle #${cycleId} SUCCESS`);
        logger.info(`      Tx hash      : ${result.txHash}`);
        logger.info(`      Block        : ${result.blockNumber}`);
        logger.info(`      Projects     : ${result.projectCount}`);
        result.projects.forEach((p) => {
          logger.info(
            `        → #${p.projectId}  credit=${p.creditQuality}  green=${p.greenImpact}`,
          );
        });
        logger.info("───────────────────────────────────────────────────────────");
        return; // done — exit cycle
      } catch (err) {
        lastErr = err;
        logger.warn(
          `   ⚠️  Attempt ${attempt}/${MAX_RETRIES} failed: ${err.message}`,
        );

        if (attempt < MAX_RETRIES) {
          const backoff = BASE_BACKOFF_MS * Math.pow(2, attempt - 1);
          logger.info(`   ⏳ Waiting ${backoff} ms before retry...`);
          await this._sleep(backoff);
        }
      }
    }

    // All retries exhausted
    this._recordFailure(
      cycleId,
      `On-chain push failed after ${MAX_RETRIES} attempts: ${lastErr?.message}`,
    );
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  /**
   * Read fresh statistics from the solar simulator and format them for the
   * oracle service's `pushImpactScores()` method.
   */
  _gatherProjectData() {
    const stats = solarSimulator.getStatistics();

    if (!stats || (Array.isArray(stats) && stats.length === 0)) {
      return null;
    }

    const statsArray = Array.isArray(stats) ? stats : [stats];

    return statsArray.map((s) => ({
      projectId: s.deviceId,
      creditQuality: s.creditQuality,
      greenImpact: s.greenImpact,
      projectURI: "",
    }));
  }

  /**
   * Record a failed cycle in internal state and emit a clear error log.
   */
  _recordFailure(cycleId, message) {
    this._failureCount++;
    this._lastFailureAt = new Date();
    this._lastError = message;

    logger.error(`   ❌ Cycle #${cycleId} FAILED — ${message}`);
    logger.error(
      `   📈 Score: ${this._successCount} successes / ${this._failureCount} failures out of ${this._cycleCount} cycles`,
    );
    logger.info("───────────────────────────────────────────────────────────");
  }

  /**
   * Promise-based sleep helper for retry backoff.
   */
  _sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

module.exports = new OracleCron();
