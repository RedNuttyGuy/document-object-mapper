import { Query } from './query.class';

export type Queryable = Function & {
  find<T>(query: Query<T>): Promise<T[]>;

  first<T>(
    query?: Query<T> | ((query: Query<T>) => Query<T>),
  ): Promise<T | null>;
};
