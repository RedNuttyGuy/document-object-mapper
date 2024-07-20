import { Model } from './src/model/model.class';

class TestModel extends Model {
  name: string;
  age: number;
  dob: Date;
}

const tests = Array.from(Array(5).keys()).map((index) =>
  TestModel.create({
    name: `John_${index}`,
    age: index * 5,
    dob: new Date(new Date().getFullYear() - index * 5),
  }),
);

console.log(tests);
