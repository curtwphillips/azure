const { shortLog } = require('./logging');

exports.getErrorMessage = (err, query = '') => {
  try {
    if (!err.includes || !err.includes('Kusto request erred')) return err;

    // check for "error": because the string spacing comes in different formats
    // such as sometimes including newlines and extra spaces between '{' and "error":
    var value = err.substring(err.indexOf('"error":'), err.length - 1);
    const parsed = JSON.parse(`{${value.trim()}`);

    if (!parsed.error) {
      console.log(`Unexpected value for parsed.error in parsed error: ${JSON.stringify(parsed)}`);
    }

    let errResponse = '';
    let queryMessage = '';

    if (parsed.error.code) {
      errResponse += `${parsed.error.code}: `;
    }

    if (!parsed.error.innererror) {
      if (parsed.error['@message']) {
        return `${errResponse}${parsed.error['@message']}${queryMessage}`;
      }

      return `${errResponse}${parsed.error}${queryMessage}`;
    }

    errResponse = `${errResponse} ${parsed.error.innererror['@errorMessage']} ${parsed.error.innererror['@message']}`;

    if (query && !errResponse.includes('Query:')) {
      query = query.replace(/\s\s+/g, ' ');
      queryMessage += `. Query: ${shortLog(query, 1000)}`;
    }

    return `${errResponse} ${queryMessage}`;
  } catch (e) {
    console.log(e);
    console.log(`failed to format error message from err: ${err} for query: ${query}`);
    console.log(
      `\n substring value of err parameter: ${value}\n (end substring value of error)\n\n`
    );
    return err;
  }
};

// errors containing these words are retried
// if the error is all lowercase then the passed error will be set to lowercase before comparing
// if the error has uppercase letters it must match the passed error casing
// the value is how many ms to sleep before retrying
const retryErrorText = {
  ENOTFOUND: 10000, // watch for casing to avoid accidentally getting Download_Sourc[eNotFound] error
  ESOCKETTIMEDOUT: 10000,
  ETIMEDOUT: 10000,
  'The request was aborted': 10000,
  throttl: 20000, // leave off ending to find variations such as throttled and throttling
};

exports.isErrorRetriable = (err) => {
  const errStr = err.toString();
  const lowerCaseError = errStr.toLowerCase();

  // return true if the error contains retriable error text
  for (let key in retryErrorText) {
    const lowerCaseRetryError = key.toLowerCase();
    const isLowerCase = key === lowerCaseRetryError;
    let useRetryError = key;
    let useErrorStr = errStr;
    if (isLowerCase) {
      useRetryError = lowerCaseRetryError;
      useErrorStr = lowerCaseError;
    }
    if (useErrorStr.includes(useRetryError)) {
      console.log(`Retry error that includes ${key}`);
      return retryErrorText[key];
    }
  }
};

/* example kusto parsed error without innererror property
{
  "error": {
    "code": "BadRequest_EntityNotFound",
    "message": "Request is invalid and cannot be executed.",
    "@type": "Kusto.Data.Exceptions.EntityNotFoundException",
    "@message": "Entity ID 'mocha_test' of kind 'ExpressionFunction' was not found.",
    "@context": {
      "timestamp": "2020-04-17T16:35:52.5095531Z",
      "serviceAlias": "USCPIRSTASADE01",
      "machineName": "KEngine000002",
      "processName": "Kusto.WinSvc.Svc",
      "processId": 8368,
      "threadId": 13860,
      "appDomainName": "Kusto.WinSvc.Svc.exe",
      "clientRequestId": "KNC.execute;f3ec2f76-bcf8-44e4-aee9-5d4ebf32a5c4",
      "activityId": "480859a3-72c4-4fab-94f6-c54ac52058a1",
      "subActivityId": "ee5d61cd-3122-4f86-ab5b-045c162ac989",
      "activityType": "DN.AdminCommand.FunctionsShowCommand",
      "parentActivityId": "fed6737d-d2b1-4324-adda-f4696a14c15f",
      "activityStack": "(Activity stack: CRID=KNC.execute;f3ec2f76-bcf8-44e4-aee9-5d4ebf32a5c4 ARID=480859a3-72c4-4fab-94f6-c54ac52058a1 > DN.Admin.Client.ExecuteControlCommand/0fb858da-db48-4da4-ba87-5c2c612e9457 > P.WCF.Service.ExecuteControlCommandInternal..IAdminClientServiceCommunicationContract/6dcebc3b-0dac-4203-96be-4aa0335fa88c > DN.FE.ExecuteControlCommand/fed6737d-d2b1-4324-adda-f4696a14c15f > DN.AdminCommand.FunctionsShowCommand/ee5d61cd-3122-4f86-ab5b-045c162ac989)"
    },
    "@permanent": true
  }
}
*/
