import type { Typeof } from '../types/typeof.type';

export interface ModelAttributeOptions {
  type?: Typeof | Function;
  optional?: boolean;
}
