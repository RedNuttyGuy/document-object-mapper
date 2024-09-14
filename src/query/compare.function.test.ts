import { describe, expect, it } from '@jest/globals';
import { QueryOperator } from './query-operator.enum';
import { compare } from './compare.function';

describe('Compare function', () => {
  it('Compares equality strictly', () => {
    expect(compare(1, QueryOperator.eq, 1)).toBe(true);

    // @ts-expect-error Testing invalid input
    expect(compare(1, QueryOperator.eq, '1')).toBe(false);

    // @ts-expect-error Testing invalid input
    expect(compare('1', QueryOperator.eq, 1)).toBe(false);

    expect(compare('1', QueryOperator.eq, '1')).toBe(true);

    expect(compare(true, QueryOperator.eq, true)).toBe(true);

    expect(compare(true, QueryOperator.eq, false)).toBe(false);

    expect(compare({}, QueryOperator.eq, {})).toBe(false);

    expect(compare([], QueryOperator.eq, [])).toBe(false);

    expect(compare(null, QueryOperator.eq, null)).toBe(true);

    expect(compare(undefined, QueryOperator.eq, undefined)).toBe(true);

    expect(compare(undefined, QueryOperator.eq, null)).toBe(false);

    expect(compare(NaN, QueryOperator.eq, NaN)).toBe(false);
  });

  it('Compares inequality strictly', () => {
    expect(compare(1, QueryOperator.ne, 1)).toBe(false);

    // @ts-expect-error Testing invalid input
    expect(compare(1, QueryOperator.ne, '1')).toBe(true);

    // @ts-expect-error Testing invalid input
    expect(compare('1', QueryOperator.ne, 1)).toBe(true);

    expect(compare('1', QueryOperator.ne, '1')).toBe(false);

    expect(compare(true, QueryOperator.ne, true)).toBe(false);

    expect(compare(true, QueryOperator.ne, false)).toBe(true);

    expect(compare({}, QueryOperator.ne, {})).toBe(true);

    expect(compare([], QueryOperator.ne, [])).toBe(true);

    expect(compare(null, QueryOperator.ne, null)).toBe(false);

    expect(compare(undefined, QueryOperator.ne, undefined)).toBe(false);

    expect(compare(undefined, QueryOperator.ne, null)).toBe(true);

    expect(compare(NaN, QueryOperator.ne, NaN)).toBe(true);
  });

  it('Compares greater than', () => {
    expect(compare(1, QueryOperator.gt, 0)).toBe(true);

    expect(compare(1, QueryOperator.gt, 1)).toBe(false);

    expect(compare(1, QueryOperator.gt, 2)).toBe(false);
  });

  it('Compares greater than or equal', () => {
    expect(compare(1, QueryOperator.gte, 0)).toBe(true);

    expect(compare(1, QueryOperator.gte, 1)).toBe(true);

    expect(compare(1, QueryOperator.gte, 2)).toBe(false);
  });

  it('Compares less than', () => {
    expect(compare(1, QueryOperator.lt, 0)).toBe(false);

    expect(compare(1, QueryOperator.lt, 1)).toBe(false);

    expect(compare(1, QueryOperator.lt, 2)).toBe(true);
  });

  it('Compares less than or equal', () => {
    expect(compare(1, QueryOperator.lte, 0)).toBe(false);

    expect(compare(1, QueryOperator.lte, 1)).toBe(true);

    expect(compare(1, QueryOperator.lte, 2)).toBe(true);
  });

  it('Throws an error for an unknown operator', () => {
    expect(() => compare(1, 'unknown' as QueryOperator, 1)).toThrowError();
  });
});
