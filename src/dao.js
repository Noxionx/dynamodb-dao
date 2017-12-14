import q from 'q';
import aws from 'aws-sdk';

// import Table from './table';

const DEFAULT_CONFIG = {
  region: 'eu-central-1',
  endpoint: 'http://localhost:8000',
  accessKeyId: 'myKey',
  secretAccessKey: 'secret',
};

export default class DAO {
  constructor (config = DEFAULT_CONFIG) {
    this.config = config;
    aws.config.update(this.config);
    this.db = new aws.DynamoDB();
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

    this.db.createTable(params, (err, res) => {
      if (err) {
        deferred.reject(err);
      } else {
        deferred.resolve(res);
      }
    });

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

    this.db.deleteTable(params, (err, res) => {
      if (err) {
        deferred.reject(err);
      } else {
        deferred.resolve(res);
      }
    });

    return deferred.promise;
  }
}
