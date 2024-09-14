import type { Model } from 'src/model/model.class';

export type StaticModel<T extends Model> = (new (...args: any[]) => T) &
  typeof Model;
