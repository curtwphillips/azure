// takes an array of expected env variables and throws an error or logs if they are missing
function verifyEnvVariables(expectedEnvVarsArray, doNotThrow = false) {
  const envErrors = {};

  for (let i = 0; i < expectedEnvVarsArray.length; i++) {
    const key = expectedEnvVarsArray[i];

    if (!Object.prototype.hasOwnProperty.call(process.env, key)) {
      envErrors[key] = '<not defined>';
    } else if (!process.env[key]) {
      envErrors[key] = '<defined empty>';
    }
  }

  if (Object.keys(envErrors).length) {
    const msg = `These env variables are missing: ${JSON.stringify(envErrors)}`;

    if (!doNotThrow) {
      throw new Error(msg);
    }

    console.log(msg);
  }
}

exports.verifyEnvVariables = verifyEnvVariables;
