export interface Queryable<T> {
  where<TField extends keyof T>(field: TField, value: T[TField]): this;

  find(): Promise<T[]>;

  first(): Promise<T>;
}
