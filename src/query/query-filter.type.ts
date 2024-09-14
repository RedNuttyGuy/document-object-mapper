import type { QueryOperator } from './query-operator.enum';

export type QueryFilter<T extends Record<string, any>> = {
  [K in keyof T]: {
    field: K;
    operator: QueryOperator | `${QueryOperator}`;
    value: T[K];
  };
}[keyof T];
