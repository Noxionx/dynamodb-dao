import q from 'q';
import aws from 'aws-sdk';
import Table from './table';

const DEFAULT_CONFIG = {
  region: 'eu-central-1',
  endpoint: 'http://localhost:8000',
  accessKeyId: 'myKey',
  secretAccessKey: 'secret',
};

function loadTables (db) {
  const deferred = q.defer();

  db.listTables({}, (err, res) => {
    if (err) {
      deferred.reject(err);
    } else if (res.TableNames) {
      deferred.resolve(res.TableNames);
    } else {
      deferred.reject(new TypeError('Error with tables fetching'));
    }
  });

  return deferred.promise;
}

export default class DAO {
  constructor (config = DEFAULT_CONFIG) {
    this.config = config;
    aws.config.update(this.config);
    this.db = new aws.DynamoDB();
    this.tablesPromise = loadTables(this.db);
  }


  /**
   * Create a table
   * @param {string} name The table name
   * @param {Object[]} keys The list of primary keys
   * @returns {Promise} The DB reponse
   *
   * Example of keys list :
   * [
   *  {
   *    name: 'id',
   *    type: 'string', (either 'string', 'number' or 'boolean')
   *  }
   * ]
   */
  createTable (name, keys = []) {
    const deferred = q.defer();
    if (!name) {
      deferred.reject(new TypeError('You need to give a table name'));
    }
    if (!keys.length) {
      deferred.reject(new TypeError('You need at least one primary key to create table'));
    }

    const params = {
      TableName: name,
      AttributeDefinitions: [],
      KeySchema: [],
      ProvisionedThroughput: {
        ReadCapacityUnits: 10,
        WriteCapacityUnits: 10,
      },
    };

    function getKeyType (type) {
      switch (type) {
      case 'string': return 'S';
      case 'number': return 'N';
      case 'boolean': return 'B';
      default:
        deferred.reject(new TypeError(`Unknown primary key type ${type}`));
        return null;
      }
    }

    function parseKey (key) {
      if (!key.name) {
        deferred.reject(new TypeError(`Missing name in primary key ${key}`));
      }
      if (!key.type) {
        deferred.reject(new TypeError(`Missing type in primary key ${key}`));
      }
      params.AttributeDefinitions.push({
        AttributeName: key.name,
        AttributeType: getKeyType(key.type),
      });
      params.KeySchema.push({
        AttributeName: key.name,
        KeyType: 'HASH',
      });
    }

    keys.forEach(parseKey);

    this.tablesPromise.then((tables) => {
      if (tables.indexOf(name) > -1) {
        deferred.reject(new TypeError(`The table ${name} aready exists`));
      } else {
        this.db.createTable(params, deferred.makeNodeResolver());
      }
    }).catch(deferred.reject);

    return deferred.promise;
  }

  /**
   * Delete a table
   * @param {String} name The table name
   */
  deleteTable (name) {
    const deferred = q.defer();
    if (!name) {
      deferred.reject(new TypeError('You need to give a table name'));
    }

    const params = {
      TableName: name,
    };

    this.tablesPromise.then((tables) => {
      if (tables.indexOf(name) !== -1) {
        deferred.reject(new TypeError(`The table ${name} doesn't exists`));
      } else {
        this.db.deleteTable(params, deferred.makeNodeResolver());
      }
    }).catch(deferred.reject);

    return deferred.promise;
  }

  /* eslint-disable */
  table (name) {
    return new Table(name);
  }
}
