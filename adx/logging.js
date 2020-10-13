exports.logADXMessages = { on: process.env.LOG_ADX_MESSAGES || false };

exports.setLogADXMessages = (setting) => {
  exports.logADXMessages.on = setting;
  console.log('exports.logADXMessages.on set to ' + exports.logADXMessages.on || 'false');
};

// log a short part of a possibly large object to help with debugging
exports.shortLog = (item, length = 500) => JSON.stringify(item).slice(0, length);
