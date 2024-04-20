import { Model } from 'src/model/model.class';
import { ModelIndexOptions } from './model-index-options.interface';
import { ModelIndex } from './model-index.interface';

export const indexesMetadataKey = Symbol('model.indexes');

/**
 * Define an index for faster searching by non-id fields
 */
export function Index(options?: ModelIndexOptions) {
  return function (target: Model, propertyKey: string | symbol) {
    if (typeof propertyKey === 'symbol') {
      throw new Error(
        `Property '${propertyKey.description}' cannot indexed. Defining indexes for symbol properties is not supported`,
      );
    }

    const indexes: Map<string, ModelIndex> =
      Reflect.getMetadata(indexesMetadataKey, target.constructor) ?? new Map();

    const indexName = options?.name ?? `${propertyKey}Index`;

    const index: ModelIndex = indexes.get(indexName) ?? {
      name: indexName,
      fields: [propertyKey],
      unique: options?.unique ?? false,
    };

    if (!indexes.has(indexName)) {
      indexes.set(indexName, index);
    } else {
      index.fields.push(propertyKey);
    }

    Reflect.defineMetadata(indexesMetadataKey, indexes, target.constructor);
  };
}
