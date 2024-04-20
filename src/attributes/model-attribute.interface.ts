import type { Typeof } from '../types/typeof.type';

export interface ModelAttribute {
  name: string | Symbol;
  type: Typeof | Function;
  optional: boolean;
}
