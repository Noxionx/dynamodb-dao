'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _q = require('q');

var _q2 = _interopRequireDefault(_q);

var _awsSdk = require('aws-sdk');

var _awsSdk2 = _interopRequireDefault(_awsSdk);

var _table = require('./table');

var _table2 = _interopRequireDefault(_table);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var DEFAULT_CONFIG = {
  region: 'eu-central-1',
  endpoint: 'http://localhost:8000',
  accessKeyId: 'myKey',
  secretAccessKey: 'secret'
};

function loadTables(db) {
  var deferred = _q2.default.defer();

  db.listTables({}, function (err, res) {
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

var DAO = function () {
  function DAO() {
    var config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : DEFAULT_CONFIG;

    _classCallCheck(this, DAO);

    this.config = config;
    _awsSdk2.default.config.update(this.config);
    this.db = new _awsSdk2.default.DynamoDB();
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


  _createClass(DAO, [{
    key: 'createTable',
    value: function createTable(name) {
      var _this = this;

      var keys = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];

      var deferred = _q2.default.defer();
      if (!name) {
        deferred.reject(new TypeError('You need to give a table name'));
      }
      if (!keys.length) {
        deferred.reject(new TypeError('You need at least one primary key to create table'));
      }

      var params = {
        TableName: name,
        AttributeDefinitions: [],
        KeySchema: [],
        ProvisionedThroughput: {
          ReadCapacityUnits: 10,
          WriteCapacityUnits: 10
        }
      };

      function getKeyType(type) {
        switch (type) {
          case 'string':
            return 'S';
          case 'number':
            return 'N';
          case 'boolean':
            return 'B';
          default:
            deferred.reject(new TypeError('Unknown primary key type ' + type));
            return null;
        }
      }

      function parseKey(key) {
        if (!key.name) {
          deferred.reject(new TypeError('Missing name in primary key ' + key));
        }
        if (!key.type) {
          deferred.reject(new TypeError('Missing type in primary key ' + key));
        }
        params.AttributeDefinitions.push({
          AttributeName: key.name,
          AttributeType: getKeyType(key.type)
        });
        params.KeySchema.push({
          AttributeName: key.name,
          KeyType: 'HASH'
        });
      }

      keys.forEach(parseKey);

      this.tablesPromise.then(function (tables) {
        if (tables.indexOf(name) > -1) {
          deferred.reject(new TypeError('The table ' + name + ' aready exists'));
        } else {
          _this.db.createTable(params, deferred.makeNodeResolver());
        }
      }).catch(deferred.reject);

      return deferred.promise;
    }

    /**
     * Delete a table
     * @param {String} name The table name
     */

  }, {
    key: 'deleteTable',
    value: function deleteTable(name) {
      var _this2 = this;

      var deferred = _q2.default.defer();
      if (!name) {
        deferred.reject(new TypeError('You need to give a table name'));
      }

      var params = {
        TableName: name
      };

      this.tablesPromise.then(function (tables) {
        if (tables.indexOf(name) !== -1) {
          deferred.reject(new TypeError('The table ' + name + ' doesn\'t exists'));
        } else {
          _this2.db.deleteTable(params, deferred.makeNodeResolver());
        }
      }).catch(deferred.reject);

      return deferred.promise;
    }

    /* eslint-disable */

  }, {
    key: 'table',
    value: function table(name) {
      return new _table2.default(name);
    }
  }]);

  return DAO;
}();

exports.default = DAO;
