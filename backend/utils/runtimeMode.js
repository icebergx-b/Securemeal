const isDemoModeEnabled = () => {
  return String(process.env.DEMO_MODE || 'true').toLowerCase() !== 'false';
};

const isDatabaseUnavailable = (error) => {
  return [
    'ECONNREFUSED',
    'ENOTFOUND',
    'ETIMEDOUT',
    'PROTOCOL_CONNECTION_LOST',
  ].includes(error?.code);
};

const shouldUseDemoFallback = (error) => {
  return isDemoModeEnabled() && isDatabaseUnavailable(error);
};

module.exports = {
  isDatabaseUnavailable,
  isDemoModeEnabled,
  shouldUseDemoFallback,
};
