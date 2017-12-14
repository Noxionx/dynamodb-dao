'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _q = require('q');

var _q2 = _interopRequireDefault(_q);

var _awsSdk = require('aws-sdk');

var _awsSdk2 = _interopRequireDefault(_awsSdk);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Table = function () {
  function Table(tableName) {
    _classCallCheck(this, Table);

    this.dbClient = new _awsSdk2.default.DynamoDB.DocumentClient();
    this.tableName = tableName;
  }

  _createClass(Table, [{
    key: 'find',
    value: function find(param) {
      var deferred = _q2.default.defer();

      var params = {
        TableName: this.tableName
      };

      if (param) {
        params.FilterExpression = '';
        params.ExpressionAttributeValues = {};
        Object.keys(param).forEach(function (key) {
          params.FilterExpression += key + ' = :' + key + ' ';
          params.ExpressionAttributeValues[':' + key] = param[key];
        });
      }

      this.dbClient.scan(params, function (err, res) {
        if (err) {
          deferred.reject(err);
        } else {
          deferred.resolve(res.Items || []);
        }
      });
      return deferred.promise;
    }
  }, {
    key: 'findOne',
    value: function findOne() {
      var param = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      var deferred = _q2.default.defer();
      var params = {
        TableName: this.tableName,
        Key: param
      };
      this.dbClient.get(params, function (err, res) {
        if (err) {
          deferred.reject(err);
        } else {
          deferred.resolve(res.Item ? res.Item : null);
        }
      });
      return deferred.promise;
    }
  }, {
    key: 'put',
    value: function put(data) {
      var deferred = _q2.default.defer();
      var params = {
        TableName: this.tableName,
        Item: data,
        ReturnValues: 'NONE'
      };
      this.dbClient.put(params, function (err) {
        if (err) {
          deferred.reject(err);
        } else {
          deferred.resolve();
        }
      });
      return deferred.promise;
    }
  }, {
    key: 'update',
    value: function update(param, data) {
      var deferred = _q2.default.defer();
      var params = {
        TableName: this.tableName,
        Key: param,
        UpdateExpression: 'set',
        ExpressionAttributeValues: {}
      };

      Object.keys(data).forEach(function (key) {
        params.UpdateExpression += ' ' + key + ' = :' + key + ',';
        params.ExpressionAttributeValues[':' + key] = data[key];
      });
      params.UpdateExpression = params.UpdateExpression.slice(0, -1);

      this.dbClient.update(params, function (err) {
        if (err) {
          deferred.reject(err);
        } else {
          deferred.resolve();
        }
      });
      return deferred.promise;
    }
  }, {
    key: 'remove',
    value: function remove(param) {
      var deferred = _q2.default.defer();
      var params = {
        TableName: this.tableName,
        Key: param
      };
      this.dbClient.delete(params, function (err) {
        if (err) {
          deferred.reject(err);
        } else {
          deferred.resolve();
        }
      });
      return deferred.promise;
    }
  }]);

  return Table;
}();

exports.default = Table;
