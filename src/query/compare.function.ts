import { QueryOperator } from './query-operator.enum';

/**
 * Compare two values using the provided operator.
 *
 * @param a - The first value to compare.
 * @param op - The operator to use for comparison.
 * @param b - The second value to compare.
 * @returns `true` if the comparison is true, otherwise `false`.
 */
export const compare = (
  a: any,
  op: QueryOperator | `${QueryOperator}`,
  b: any,
): boolean =>
  ({
    [QueryOperator.eq]: () => a === b,
    [QueryOperator.gt]: () => a > b,
    [QueryOperator.gte]: () => a >= b,
    [QueryOperator.lt]: () => a < b,
    [QueryOperator.lte]: () => a <= b,
    [QueryOperator.ne]: () => a !== b,
  })[op]();
