import q from 'q';
import { assert } from 'chai';

import DAO from '../src/dao';

const TEST_TABLE = 'dynamodb.dao.test';
const TEST_DATA = [
  { id: '1', field: 'azerty' },
  { id: '2', field: 'azerty' },
  { id: '3', field: 'azerty' },
  { id: '4', field: 'azerty' },
  { id: '5', field: 'azerty' },
];
const dao = new DAO();

describe('Table tests', () => {
  before((done) => {
    dao.createTable(TEST_TABLE, [{ name: 'id', type: 'string' }])
      .then(() => {
        done();
      });
  });
  it('Should add data', () => {
    const promises = TEST_DATA.map(data => dao.table(TEST_TABLE).put(data));
    return q.all(promises);
  });
  it('Should get all data', () => dao.table(TEST_TABLE).find()
    .then((data) => {
      assert.lengthOf(data, 5);
    }));
  it('Should get one item', () => dao.table(TEST_TABLE).findOne({ id: '3' })
    .then((item) => {
      assert.deepEqual(item, TEST_DATA[2]);
    }));
  it('Should update an item', () => dao.table(TEST_TABLE).update({ id: '3' }, { field: 'wxcvbn' })
    .then(() => dao.table(TEST_TABLE).findOne({ id: '3' }))
    .then((item) => {
      assert.deepEqual(item, { id: '3', field: 'wxcvbn' });
    }));
  it('Should delete an item', () => dao.table(TEST_TABLE).remove({ id: '6' })
    .then(() => dao.table(TEST_TABLE).findOne({ id: '6' }))
    .then((rep) => {
      assert.isNull(rep);
    }));
  after((done) => {
    dao.deleteTable(TEST_TABLE)
      .then(() => done());
  });
});
