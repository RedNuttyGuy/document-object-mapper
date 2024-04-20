import { Attribute } from '../src/attributes/attribute.decorator';
import { Model } from '../src/model/model.class';

export class DataTestModel extends Model {
  @Attribute()
  str: string;

  @Attribute()
  bool: boolean;

  @Attribute()
  num: number;

  @Attribute()
  obj: object;

  @Attribute({ optional: true })
  optional?: string;
}
