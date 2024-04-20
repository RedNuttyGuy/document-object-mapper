import type { Driver } from 'unstorage';

export interface ModelConfig {
  storageDriver: Driver;
  preventFillingWithExtraAttributes: boolean | 'warn';
}
