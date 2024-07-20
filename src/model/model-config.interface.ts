import type { Driver } from 'unstorage';

export interface ModelConfig {
  storageDriver: Driver;
  preventFillingWithExtraAttributes: boolean | 'warn';
  serialization?: {
    serialize: (data: Record<string, any>) => string;
    deserialize: (data: string) => Record<string, any>;
  };
}
