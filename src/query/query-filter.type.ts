import { QueryOperator } from './query-operator.type';

export type QueryFilter<T extends Record<string, any>> = {
  [K in keyof T]: {
    field: K;
    operator: QueryOperator | `${QueryOperator}`;
    value: T[K];
  };
}[keyof T];
