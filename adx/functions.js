const execute = require('./execute');

exports.dropFunctionByName = async (name) => {
  const message = `.drop function ['${name}'] ifexists`;
  await execute(message);
};
