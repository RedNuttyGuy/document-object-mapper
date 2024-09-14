import { QueryOperator } from './query-operator.enum';
import type { QueryFilter } from './query-filter.type';
import type { CompiledQuery } from './compiled-query.interface';
import type { Model } from '../model/model.class';
import type { StaticModel } from '../types/static-model.type';
import type { OmitModel } from 'src/types/omit-model';

/**
 * Query builder used to filter and retrieve data from a model.
 */
export class Query<T extends Model> {
  public constructor(model: StaticModel<T>) {
    this.for(model);
  }

  protected _model: StaticModel<T>;

  public static for<T extends Model>(model: StaticModel<T>): Query<T> {
    return new Query<T>(model);
  }

  private for(model: StaticModel<T>): this {
    this._model = model;

    return this;
  }

  private filters: QueryFilter<OmitModel<T>>[] = [];

  public where<TField extends keyof OmitModel<T>>(
    field: TField,
    value: T[TField],
  ): this;
  public where<TField extends keyof OmitModel<T>>(
    field: TField,
    operator: QueryOperator | `${QueryOperator}`,
    value: T[TField],
  ): this;
  public where<TField extends keyof OmitModel<T>>(
    field: TField,
    operator: QueryOperator | `${QueryOperator}` | T[TField],
    value?: T[TField],
  ): this {
    const _field: TField = field;
    const _operator: QueryOperator =
      value === undefined ? QueryOperator.eq : (operator as QueryOperator);
    const _value: T[TField] = value ?? (operator as T[TField]);

    this.filters.push({
      field: _field,
      operator: _operator,
      value: _value,
    });

    return this;
  }

  public async find(this: Query<T>): Promise<T[]> {
    return this._model.find(this);
  }

  public async first(this: Query<T>): Promise<T | null> {
    return this._model.first(this);
  }

  public clone(): Query<T> {
    const copy = new Query<T>(this._model);

    for (const { field, operator, value } of this.filters) {
      copy.where(field, operator, value);
    }

    return copy;
  }

  public build(): CompiledQuery<T> {
    return { filter: this.filters };
  }
}
