const execute = require('./execute');

exports.dropFunctionByName = async (name) => {
  const message = `.drop function ['${name}'] ifexists`;
  await execute(message);
};

// returns function body as a string
// ex: "{['test'] | extend col5 = strcat(col4, '_calc'), col6 = strcat(col4, '_calc2')}"
exports.getFunctionBody = async (functionName) => {
  const message = `.show function ['${functionName}']`;
  const response = await execute(message);
  const rows = standardizeTableResponse(response);
  return rows && rows[0] && rows[0].Body;
};

// removes whitespace, periods, and dashes
exports.stringToVariableName = (str) => {
  if (!str) throw new Error('Failed to determine variable name. Input not provided.');
  return str.replace(/[\s\.-]/gi, '');
};
