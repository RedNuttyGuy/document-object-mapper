import type { QueryFilter } from './query-filter.type';

export interface CompiledQuery<T extends Record<string, any>> {
  filter: QueryFilter<T>[];
}
