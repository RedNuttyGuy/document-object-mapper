import { Model } from '../model/model.class';
import { This } from './this.type';

export type OmitBaseModel<T extends typeof Model> = Omit<This<T>, keyof Model>;
