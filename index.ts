import 'reflect-metadata';
export { Model } from './src/model/model.class';
export { Attribute } from './src/attributes/attribute.decorator';

export { Query } from './src/query/query.class';
export { QueryOperator } from './src/query/query-operator.type';
export { QueryFilter } from './src/query/query-filter.type';

import { Attribute } from './src/attributes/attribute.decorator';
import { Model } from './src/model/model.class';
import { QueryOperator } from './src/query/query-operator.type';

class TestModel extends Model {
  @Attribute()
  name: string;
  @Attribute()
  age: number;
  @Attribute()
  dob: string;
}

(async () => {
  const start = Date.now();

  // const tests = Array.from(Array(5000).keys())
  //     .map(async (index) => await TestModel.create({
  //         name: `John_${index}`,
  //         age: index*5,
  //         dob: new Date(new Date().getFullYear(), new Date().getMonth()).toISOString()
  //     }).save());

  console.log(
    await TestModel.findFirst([
      { field: 'name', operator: QueryOperator.eq, value: 'asd' },
    ]),
  );

  const total = (Date.now() - start) / 1000;

  console.log('Total: ', total.toFixed(2));
  console.log('Avg:   ', total / 5000);
})();
