const _ = require('lodash');
const { shortLog } = require('./logging');

exports.sanitizeValue = (value) => {
  return `${
    value
      .trim()
      .replace(/"/g, '\\"') // remove double-quotes
      .replace(/'/g, "\\'") // remove single-quotes
      .replace(/(\r\n|\n|\r)/gm, '') // remove CR/LF chars
  }`;
};

const isPrimaryResult = (exports.isPrimaryResult = (responseTable) => {
  return responseTable.TableKind === 'PrimaryResult' || responseTable.kind === 'PrimaryResult';
});

// function to convert table responses to JSON data
exports.standardizeTableResponse = (response) => {
  const tables = response.tables.filter((tbl) => isPrimaryResult(tbl));
  if (!tables)
    throw new Error(`PrimaryResult table was not found in ${JSON.stringify(response.tables)}`);

  // merge multiple primary results
  let rows = [];

  for (let i = 0; i < tables.length; i++) {
    const table = tables[i];
    rows = rows.concat(
      table._rows.map((row) => {
        const obj = {};
        table.columns.forEach((col) => (obj[col.name] = row[col.ordinal]));
        return obj;
      })
    );
  }

  return rows;
};

exports.standardizeQueryResponse = (response) => {
  if (_.isString(response)) {
    response = JSON.parse(response);
  }

  // use 'tables' key for list of tables instead of sometimes using 'Tables'
  if (response.Tables) {
    response.tables = [...response.Tables];
    delete response.Tables;
  }

  const tables = response.tables;

  if (!tables) {
    console.log(`response missing tables: ${JSON.stringify(response)}`);
  }

  // use 'columns' instead of sometimes using 'Columns'
  // use '_rows' instead of sometimes using 'Rows'
  // give every column an ordinal value
  // use 'name' for column names instead of sometimes using 'ColumnName'
  tables.forEach((table) => {
    if (table.Columns) {
      table.columns = table.Columns;
      delete table.Columns;
    }
    if (table.Rows) {
      table._rows = table.Rows;
      delete table.Rows;
    }
    table.columns.forEach((col, i) => {
      if (col.ColumnName) {
        col.name = col.ColumnName;
        delete col.ColumnName;
      }
      col.ordinal = col.ordinal || i;
    });
  });

  // use 'kind' key instead of sometimes using 'TableKind' or a separate table with the kinds
  if (!tables[0].kind) {
    if (tables.length === 1) {
      // only table must be Primary
      tables[0].kind = 'PrimaryResult';
    } else if (tables[0].TableKind) {
      tables.forEach((table) => {
        table.kind = table.TableKind;
      });
    } else {
      let kindTableIndex = -1;
      let kindColumnIndex = -1;
      let ordinalColumnIndex = -1;
      let nameColumnIndex = -1;
      for (let i = tables.length - 1; i > -1; i--) {
        // kindTable is usually the last table
        kindColumnIndex = tables[i].columns.findIndex((col) => col.name === 'Kind');
        if (kindColumnIndex > -1) {
          ordinalColumnIndex = tables[i].columns.findIndex((col) => col.name === 'Ordinal');
          nameColumnIndex = tables[i].columns.findIndex((col) => col.name === 'Name');
          kindTableIndex = i;
          tables[i].kind = 'kindMap';
          break;
        }
      }
      if (kindTableIndex > -1) {
        // give each table its kind
        for (let rowIndex = 0; rowIndex < tables[kindTableIndex]._rows.length; rowIndex++) {
          const row = tables[kindTableIndex]._rows[rowIndex];
          const tableIndex = row[ordinalColumnIndex];
          tables[tableIndex].kind = row[nameColumnIndex];
        }
      } else {
        console.log(`Could not find kindTableIndex in response: ${shortLog(response)}`);
      }
    }
  }
  return response;
};

// function to extract key data from adx responses
exports.getFirstRowKeyFromResponse = (key, response) => {
  try {
    const table = response.tables.find((tbl) => isPrimaryResult(tbl));
    if (!table._rows.length) {
      console.log(
        `getFirstRowKeyFromResponse found no rows to use to find key: ${key}, in response: ${JSON.stringify(
          response
        )}`
      );
      return;
    }
    const column = table.columns.find((col) => col.name === key);
    return table._rows[0][column.ordinal];
  } catch (err) {
    console.log(
      `getFirstRowKeyFromResponse failed for key: ${key}, response: ${JSON.stringify(response)}`
    );
    console.log(err);
  }
};
