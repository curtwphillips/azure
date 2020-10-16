const client = require('./client');
const { getErrorMessage } = require('./errors');
const { logADXMessages } = require('./logging');
const { standardizeQueryResponse } = require('./responseConversions');
const { sleep } = require('../utilities');

const defaultDB = process.env.ADX_DATABASE_NAME;

// promisified adx message execution
function execute(message, raw, dbName = defaultDB, doNotLog, retries = 0) {
  return new Promise((resolve, reject) => {
    // setting dbName here allows callee to pass null for dbName and true or false for doNotLog
    dbName = dbName || defaultDB;

    // get an error stack in advance or else there will be no stack available showing
    // the caller of execute
    const errWithStack = new Error();
    const stack = errWithStack.stack;

    client.execute(
      dbName,
      message,
      async (err, results) => {
        if (err) {
          // retry after a delay when adx throttles requests
          if (err.toString().includes('throttl')) {
            console.log(err.toString());
            const sleepMs = 2000;
            console.log(`Retrying execute in ${sleepMs} ms`);
            await sleep(retries * sleepMs + sleepMs);
            return execute(message, raw, (dbName = defaultDB), doNotLog, ++retries);
          }

          if (!err.stack) {
            const e = new Error(getErrorMessage(err, message));

            e.stack =
              e.stack.split('\n').slice(0, 2).join('\n') + '\n' + stack.slice('Error\n'.length);

            return reject(e);
          }

          err.stack =
            err.stack.split('\n').slice(0, 2).join('\n') + '\n' + stack.slice('Error\n'.length);

          return reject(err);
        }
        resolve(standardizeQueryResponse(results));
      },
      { raw }
    );
  });
}

module.exports = execute;
