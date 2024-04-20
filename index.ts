import 'reflect-metadata';

import { AttributeTestModel } from './testing/attribute-test-model.model';

// export { Model } from './src/model/model.class';
// export { Attribute } from './src/attributes/attribute.decorator';
// export { Index } from './src/indexes/index.decorator';

// export { Query } from './src/query/query.class';
// export { QueryOperator } from './src/query/query-operator.type';
// export { QueryFilter } from './src/query/query-filter.type';

const a = AttributeTestModel.create({
  name: 'John Doe',
  age: 20,
  email: 'test@test.test',
});
