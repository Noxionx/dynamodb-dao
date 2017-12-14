import q from 'q';
import aws from 'aws-sdk';

export default class Table {
  constructor (tableName) {
    this.dbClient = new aws.DynamoDB.DocumentClient();
    this.tableName = tableName;
  }

  find (param) {
    const deferred = q.defer();

    const params = {
      TableName: this.tableName,
    };

    if (param) {
      params.FilterExpression = '';
      params.ExpressionAttributeValues = {};
      Object.keys(param).forEach((key) => {
        params.FilterExpression += `${key} = :${key} `;
        params.ExpressionAttributeValues[`:${key}`] = param[key];
      });
    }

    this.dbClient.scan(params, (err, res) => {
      if (err) {
        deferred.reject(err);
      } else {
        deferred.resolve(res.Items || []);
      }
    });
    return deferred.promise;
  }

  findOne (param = {}) {
    const deferred = q.defer();
    const params = {
      TableName: this.tableName,
      Key: param,
    };
    this.dbClient.get(params, (err, res) => {
      if (err) {
        deferred.reject(err);
      } else {
        deferred.resolve(res.Item ? res.Item : null);
      }
    });
    return deferred.promise;
  }

  put (data) {
    const deferred = q.defer();
    const params = {
      TableName: this.tableName,
      Item: data,
      ReturnValues: 'NONE',
    };
    this.dbClient.put(params, (err) => {
      if (err) {
        deferred.reject(err);
      } else {
        deferred.resolve();
      }
    });
    return deferred.promise;
  }

  update (param, data) {
    const deferred = q.defer();
    const params = {
      TableName: this.tableName,
      Key: param,
      UpdateExpression: 'set',
      ExpressionAttributeValues: {},
    };

    Object.keys(data).forEach((key) => {
      params.UpdateExpression += ` ${key} = :${key},`;
      params.ExpressionAttributeValues[`:${key}`] = data[key];
    });
    params.UpdateExpression = params.UpdateExpression.slice(0, -1);

    this.dbClient.update(params, (err) => {
      if (err) {
        deferred.reject(err);
      } else {
        deferred.resolve();
      }
    });
    return deferred.promise;
  }

  remove (param) {
    const deferred = q.defer();
    const params = {
      TableName: this.tableName,
      Key: param,
    };
    this.dbClient.delete(params, (err) => {
      if (err) {
        deferred.reject(err);
      } else {
        deferred.resolve();
      }
    });
    return deferred.promise;
  }
}
