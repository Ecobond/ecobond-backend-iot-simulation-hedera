const { ethers } = require("ethers");
const logger = require("./logger");

// Minimal ABI for ProjectMod — only the functions this oracle needs
const PROJECT_MOD_ABI = [
  "function updateProjects(tuple(tuple(uint8 creditQuality, uint8 greenImpact) impactScore, uint256 projectId, string projectURI)[] _projectDetails)",
  "function getProjectScores() view returns (tuple(uint8 creditQuality, uint8 greenImpact)[])",
  "function getProjectScore(uint256 _projectId) view returns (tuple(uint8 creditQuality, uint8 greenImpact))",
  "function totalSupply() view returns (uint256)",
  "function getEcobondOracleAddress() view returns (address)",
];

class OracleService {
  constructor() {
    this.provider = null;
    this.wallet = null;
    this.contract = null;
    this.isConfigured = false;

    this._initialize();
  }

  _initialize() {
    const rpcUrl = process.env.HEDERA_RPC_URL;
    const privateKey = process.env.ORACLE_PRIVATE_KEY;
    const contractAddress = process.env.PROJECT_CONTRACT_ADDRESS;

    if (!rpcUrl || !privateKey || !contractAddress) {
      logger.warn("Oracle not configured — missing HEDERA_RPC_URL, ORACLE_PRIVATE_KEY, or PROJECT_CONTRACT_ADDRESS");
      return;
    }

    try {
      this.provider = new ethers.JsonRpcProvider(rpcUrl);
      this.wallet = new ethers.Wallet(privateKey, this.provider);
      this.contract = new ethers.Contract(contractAddress, PROJECT_MOD_ABI, this.wallet);
      this.isConfigured = true;

      logger.info(`Oracle service initialized — wallet: ${this.wallet.address}, contract: ${contractAddress}`);
    } catch (error) {
      logger.error("Failed to initialize oracle service:", { message: error.message });
    }
  }

  _ensureConfigured() {
    if (!this.isConfigured) {
      throw new Error("Oracle not configured. Set HEDERA_RPC_URL, ORACLE_PRIVATE_KEY, and PROJECT_CONTRACT_ADDRESS in .env");
    }
  }

  /**
   * Push impact scores on-chain for multiple projects.
   * @param {Array<{projectId: number, creditQuality: number, greenImpact: number, projectURI?: string}>} projectDetails
   * @returns {Promise<{txHash: string, projectCount: number}>}
   */
  async pushImpactScores(projectDetails) {
    this._ensureConfigured();

    // Format for the contract's ProjectDetails[] struct
    const formatted = projectDetails.map((p) => ({
      impactScore: {
        creditQuality: Math.max(0, Math.min(255, Math.round(p.creditQuality))),
        greenImpact: Math.max(0, Math.min(255, Math.round(p.greenImpact))),
      },
      projectId: p.projectId,
      projectURI: p.projectURI || "",
    }));

    logger.info(`Pushing impact scores for ${formatted.length} project(s) on-chain...`);

    const tx = await this.contract.updateProjects(formatted);
    logger.info(`Transaction submitted: ${tx.hash}`);

    const receipt = await tx.wait();
    logger.info(`Transaction confirmed in block ${receipt.blockNumber}`);

    return {
      txHash: tx.hash,
      blockNumber: receipt.blockNumber,
      projectCount: formatted.length,
      projects: formatted.map((p) => ({
        projectId: Number(p.projectId),
        creditQuality: p.impactScore.creditQuality,
        greenImpact: p.impactScore.greenImpact,
      })),
    };
  }

  /**
   * Read all on-chain project scores.
   * @returns {Promise<Array<{projectId: number, creditQuality: number, greenImpact: number}>>}
   */
  async getOnChainScores() {
    this._ensureConfigured();

    const scores = await this.contract.getProjectScores();
    return scores.map((score, index) => ({
      projectId: index + 1,
      creditQuality: Number(score.creditQuality),
      greenImpact: Number(score.greenImpact),
    }));
  }

  /**
   * Read on-chain score for a single project.
   * @param {number} projectId
   * @returns {Promise<{projectId: number, creditQuality: number, greenImpact: number}>}
   */
  async getProjectScore(projectId) {
    this._ensureConfigured();

    const score = await this.contract.getProjectScore(projectId);
    return {
      projectId: Number(projectId),
      creditQuality: Number(score.creditQuality),
      greenImpact: Number(score.greenImpact),
    };
  }

  /**
   * Read total number of projects on-chain.
   * @returns {Promise<number>}
   */
  async getTotalProjects() {
    this._ensureConfigured();

    const total = await this.contract.totalSupply();
    return Number(total);
  }

  /**
   * Get the address currently set as the Ecobond Oracle on the contract.
   * @returns {Promise<string>}
   */
  async getRegisteredOracleAddress() {
    this._ensureConfigured();

    return await this.contract.getEcobondOracleAddress();
  }

  /**
   * Get the wallet address this oracle is using.
   * @returns {string|null}
   */
  getWalletAddress() {
    return this.wallet ? this.wallet.address : null;
  }
}

module.exports = new OracleService();
