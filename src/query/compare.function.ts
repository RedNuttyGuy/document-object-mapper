import { QueryOperator } from './query-operator.type';

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
