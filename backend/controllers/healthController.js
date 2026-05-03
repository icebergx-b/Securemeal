const db = require('../db');
const { isDemoModeEnabled } = require('../utils/runtimeMode');

const healthCheck = async (req, res) => {
  try {
    await db.query('SELECT 1');

    return res.status(200).json({
      success: true,
      message: 'API is healthy',
      mode: 'database',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    if (!isDemoModeEnabled()) {
      return res.status(500).json({
        success: false,
        error: error.message,
        mode: 'database',
        timestamp: new Date().toISOString(),
      });
    }

    return res.status(200).json({
      success: true,
      message: 'API is healthy in demo mode',
      mode: 'demo',
      timestamp: new Date().toISOString(),
    });
  }
};

module.exports = {
  healthCheck,
};
