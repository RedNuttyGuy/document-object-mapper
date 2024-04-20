import { Attribute } from '../src/attributes/attribute.decorator';
import { Index } from '../src/indexes/index.decorator';
import { Model } from '../src/model/model.class';

export class IndexTestModel extends Model {
  @Attribute()
  @Index()
  defaultIndexAttribute: string;

  @Attribute()
  @Index({ name: 'customIndexName' })
  customNamedIndexAttribute: string;

  // NOTE: These MUST be in an odd order to test the ordering of the indexed fields

  @Attribute()
  @Index({ order: 1 })
  orderedIndexAttributeOne: number;

  @Attribute()
  @Index({ order: 3 })
  orderedIndexAttributeThree: number;

  @Attribute()
  @Index({ order: 2 })
  orderedIndexAttributeTwo: number;

  @Attribute()
  @Index({ order: 4 })
  orderedIndexAttributeFour: number;

  @Attribute()
  @Index({ unique: true })
  uniqueAttribute: string;
}
