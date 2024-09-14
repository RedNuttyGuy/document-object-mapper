import type { Model } from 'src/model/model.class';

export type OmitModel<T> = Omit<T, keyof Model>;
