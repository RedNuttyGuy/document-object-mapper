import { Attribute } from '../src/attributes/attribute.decorator';
import { Model } from '../src/model/model.class';
import { CustomType } from './custom-type.class';

export class AttributeTestModel extends Model {
  @Attribute()
  defaultAttribute: boolean;

  @Attribute()
  booleanAttribute: boolean;

  @Attribute()
  numberAttribute: number;

  @Attribute()
  objectAttribute: object;

  @Attribute()
  stringAttribute: string;

  @Attribute({ type: CustomType })
  customAttribute: CustomType;

  @Attribute({ optional: true })
  optionalAttribute: string;

  @Attribute({ type: 'boolean' })
  overriddenTypeAttribute: string;
}
