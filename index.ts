import 'reflect-metadata';

export { Model } from './src/model/model.class';
export type { ModelConfig } from './src/model/model-config.interface';

export { Attribute } from './src/attributes/attribute.decorator';
export type { AttributeOptions } from './src/attributes/attribute-options.interface';
export { ModelAttribute } from './src/attributes/model-attribute.class';

export { Query } from './src/query/query.class';
export { QueryOperator } from './src/query/query-operator.enum';
export type { QueryFilter } from './src/query/query-filter.type';
