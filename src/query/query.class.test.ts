import { describe, expect, it, jest } from '@jest/globals';
import { Query } from './query.class';
import { DataTestModel } from '../../testing/data-test-model.model';
import { QueryOperator } from './query-operator.enum';
import { Model } from '../model/model.class';

const staticFindMock = jest
  .spyOn(Model, 'find')
  .mockImplementation(() => Promise.resolve([]));
const staticFirstMock = jest
  .spyOn(Model, 'first')
  .mockImplementation(() => Promise.resolve(null));

describe('Query Builder', () => {
  const createTestQuery = (): Query<DataTestModel, typeof DataTestModel> => {
    return Query.for(DataTestModel);
  };

  it('Sets the internal model when created', () => {
    const query = createTestQuery();

    expect(query['_model']).toBe(DataTestModel);
  });

  it('Uses "=" as the default operator', () => {
    const query = createTestQuery();

    query.where('str', 'John Doe');

    expect(query['filters']).toEqual([
      { field: 'str', operator: '=', value: 'John Doe' },
    ]);
  });

  it('Accepts an operator as the second argument', () => {
    const query = createTestQuery();

    query.where('num', '<', 42);

    expect(query['filters']).toEqual([
      { field: 'num', operator: '<', value: 42 },
    ]);
  });

  it('Accepts an enum as the second argument', () => {
    const query = createTestQuery();

    query.where('str', QueryOperator.lt, 'John Doe');

    expect(query['filters']).toEqual([
      { field: 'str', operator: '<', value: 'John Doe' },
    ]);
  });

  it('Adds a filter to the query when where is called', () => {
    const query = createTestQuery();

    query.where('str', 'John Doe');

    expect(query['filters']).toHaveLength(1);
    expect(query['filters']).toEqual([
      { field: 'str', operator: '=', value: 'John Doe' },
    ]);

    query.where('num', '>', 25);

    expect(query['filters']).toHaveLength(2);
    expect(query['filters']).toEqual([
      { field: 'str', operator: '=', value: 'John Doe' },
      { field: 'num', operator: '>', value: 25 },
    ]);
  });

  it('Calls the model findAll method to find all matching records', async () => {
    const query = createTestQuery();
    query.where('str', 'John Doe');

    await query.find();

    expect(staticFindMock).toHaveBeenCalledWith({
      _model: DataTestModel,
      filters: [{ field: 'str', operator: '=', value: 'John Doe' }],
    });
  });

  it('Calls the model "first" method to find the first matching record', async () => {
    const query = createTestQuery();
    query.where('str', 'John Doe');

    await query.first();

    expect(staticFirstMock).toHaveBeenCalledWith({
      _model: DataTestModel,
      filters: [{ field: 'str', operator: '=', value: 'John Doe' }],
    });
  });

  it('clones filter array', () => {
    const query = createTestQuery()
      .where('str', 'John Doe')
      .where('num', '>', 25);

    expect(query['filters']).toHaveLength(2);
    expect(query['filters']).toContainEqual({
      field: 'str',
      operator: '=',
      value: 'John Doe',
    });
    expect(query['filters']).toContainEqual({
      field: 'num',
      operator: '>',
      value: 25,
    });

    const cloned = query.clone();

    expect(cloned['filters']).toHaveLength(2);
    expect(cloned['filters']).toContainEqual({
      field: 'str',
      operator: '=',
      value: 'John Doe',
    });
    expect(cloned['filters']).toContainEqual({
      field: 'num',
      operator: '>',
      value: 25,
    });
  });

  it('is chainable', () => {
    const query = createTestQuery();

    expect(query).toBeInstanceOf(Query);
    expect(query.where('str', 'John Doe')).toBeInstanceOf(Query);
    expect(query.where('num', '>', 25)).toBe(query);
  });
});
