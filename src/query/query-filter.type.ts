import { Model } from '../model/model.class';
import { QueryOperator } from './query-operator.type';

export class QueryFilter<T extends Model, F extends Exclude<keyof T, keyof Model>> {
  field: F;
  operator: QueryOperator;
  value: T[F];
}