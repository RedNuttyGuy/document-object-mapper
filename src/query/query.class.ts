import { QueryOperator } from './query-operator.type';
import type { QueryFilter } from './query-filter.type';
import type { CompiledQuery } from './compiled-query.interface';
import type { Model } from '../model/model.class';
import { This } from '../types/this.type';

export class Query<T extends Model, TModel extends typeof Model> {
  protected _model: TModel;

  public static for<T extends typeof Model>(model: T): Query<This<T>, T> {
    return new Query<This<T>, T>().for(model);
  }

  private for(model: TModel): this {
    this._model = model;

    return this;
  }

  private filters: QueryFilter<T>[] = [];

  public where<TField extends keyof T>(field: TField, value: T[TField]): this;
  public where<TField extends keyof T>(
    field: TField,
    operator: QueryOperator | `${QueryOperator}`,
    value: T[TField],
  ): this;
  public where<TField extends keyof T>(
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

  public async find(
    this: Query<This<TModel>, TModel>,
  ): Promise<This<TModel>[]> {
    return this._model.find<TModel>(this);
  }

  public async first(
    this: Query<This<TModel>, TModel>,
  ): Promise<This<TModel>[]> {
    return this._model.first<TModel>(this);
  }

  public clone(): Query<T, TModel> {
    const copy = new Query<T, TModel>().for(this._model);

    for (const { field, operator, value } of this.filters) {
      copy.where(field, operator, value);
    }

    return copy;
  }

  public build(): CompiledQuery<T> {
    return { filter: this.filters };
  }
}
