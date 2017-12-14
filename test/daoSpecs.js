import { assert } from 'chai';
import aws from 'aws-sdk';

import DAO from '../src/dao';

const TEST_TABLE = 'dynamodb.dao.test';
const config = {
  region: 'eu-central-1',
  endpoint: 'http://localhost:8000',
  accessKeyId: 'myKey',
  secretAccessKey: 'secret',
};
aws.config.update(config);
const db = new aws.DynamoDB();
const dao = new DAO();

describe('DAO tests', () => {
  before((done) => {
    db.deleteTable({ TableName: TEST_TABLE }, () => {
      done();
    });
  });
  describe('Create table', () => {
    it('Should return error if no table name', () => dao.createTable()
      .then(() => {
        throw new TypeError('Table creation should not work');
      })
      .catch((err) => {
        assert.equal(err.message, 'You need to give a table name');
      }));

    it('Should return error if no table keys', () => dao.createTable(TEST_TABLE)
      .then(() => {
        throw new TypeError('Table creation should not work');
      })
      .catch((err) => {
        assert.equal(err.message, 'You need at least one primary key to create table');
      }));

    it('Should return error if table keys are in wrong format', () => dao.createTable(TEST_TABLE, [{ test: 'test' }])
      .then(() => {
        throw new TypeError('Table creation should not work');
      })
      .catch((err) => {
        assert.isTrue(!!err.message.match('Missing name in primary key'));
      }));

    it('Should create table', () => {
      const keys = [
        { name: 'id', type: 'string' },
      ];
      return dao.createTable(TEST_TABLE, keys);
    });
  });
  describe('Delete table', () => {
    it('Should return error if no table name', () => dao.deleteTable()
      .then(() => {
        throw new TypeError('Table creation should not work');
      })
      .catch((err) => {
        assert.equal(err.message, 'You need to give a table name');
      }));

    it('Should delete table', (done) => {
      dao.deleteTable(TEST_TABLE)
        .then(() => {
          done();
        })
        .catch(done);
    });
  });
});
