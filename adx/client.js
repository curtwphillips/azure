const { Client: KustoClient, KustoConnectionStringBuilder } = require('azure-kusto-data');

const { verifyEnvVariables } = require('./utilities');

verifyEnvVariables(['ADX_CLUSTER_NAME', 'ADX_CLIENT_ID', 'ADX_CLIENT_SECRET', 'ADX_TENANT_ID']);

const { ADX_CLUSTER_NAME, ADX_CLIENT_ID, ADX_CLIENT_SECRET, ADX_TENANT_ID } = process.env;

const kcsb = KustoConnectionStringBuilder.withAadApplicationKeyAuthentication(
  `https://${ADX_CLUSTER_NAME}.kusto.windows.net`,
  ADX_CLIENT_ID,
  ADX_CLIENT_SECRET,
  ADX_TENANT_ID
);

module.exports = new KustoClient(kcsb);
