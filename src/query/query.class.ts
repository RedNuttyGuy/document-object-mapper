import type { Model } from '../model/model.class';
import { QueryOperator } from './query-operator.type';
import type { QueryFilter } from './query-filter.type';
import type { ThisConstructor } from '../types/this-constructor.type';
import type { This } from '../types/this.type';

export class Query<T extends Model, TModel extends typeof Model> {
  protected _model: ThisConstructor<TModel>;

  public static for<T extends Model, TModel extends typeof Model>(
    model: TModel,
  ): Query<T, TModel> {
    return new Query<T, TModel>().for(model);
  }

  private for(model: TModel): this {
    this._model = model;

    return this;
  }

  private filters: QueryFilter<T>[] = [];

  public where<TField extends Exclude<keyof T, keyof Model>>(
    field: TField,
    value: T[TField],
  ): this;
  public where<TField extends Exclude<keyof T, keyof Model>>(
    field: TField,
    operator: QueryOperator | `${QueryOperator}`,
    value: typeof operator extends 'in' ? T[TField][] : T[TField],
  ): this;
  public where<TField extends Exclude<keyof T, keyof Model>>(
    field: TField,
    operator: QueryOperator | T[TField],
    value?: typeof operator extends 'in' ? T[TField][] : T[TField],
  ): this {
    const _field: TField = field;
    const _operator: QueryOperator | `${QueryOperator}` =
      value === undefined ? '=' : (operator as QueryOperator);
    const _value: T[TField] | T[TField][] =
      value === undefined ? (operator as T[TField]) : value;

    this.filters.push({
      field: _field,
      operator: _operator,
      value: _value,
    });

    return this;
  }

  public async find(): Promise<T[]> {
    return this._model.findAll<TModel>(
      this.filters as QueryFilter<This<TModel>>[],
    ) as Promise<T[]>;
  }

  public async first(): Promise<T> {
    return this._model.findFirst<TModel>(
      this.filters as QueryFilter<This<TModel>>[],
    ) as Promise<T>;
  }

  public clone(): Query<T, TModel> {
    const copy = new Query<T, TModel>().for(this._model);

    for (const { field, operator, value } of this.filters) {
      copy.where(field, operator, value as any);
    }

    return copy;
  }
}
