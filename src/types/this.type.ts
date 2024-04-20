import type { ThisConstructor } from './this-constructor.type';

export type This<T extends ThisConstructor> = T['prototype'];
