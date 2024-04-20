import { CustomType } from '../../testing/custom-type.class';
import { IndexTestModel } from '../../testing/index-test-model.model';
import { Index, indexesMetadataKey } from './index.decorator';
import { ModelIndex } from './model-index.interface';

describe('Index Decorator', () => {
  const getTestModelIndexes = (): Map<string, ModelIndex> =>
    Reflect.getMetadata(indexesMetadataKey, IndexTestModel);

  it('sets index metadata', () => {
    const indexes = getTestModelIndexes();

    expect(indexes).toBeDefined();
    expect(indexes).toBeInstanceOf(Map);
  });

  it('saves index metadata with correct shape', () => {
    const indexes = getTestModelIndexes();

    for (const metadata of indexes.values()) {
      expect([
        {
          name: expect.any(String),
          type: expect.any(String),
          optional: expect.any(Boolean),
        },
        {
          name: expect.any(String),
          type: expect.any(Function),
          optional: expect.any(Boolean),
        },
      ]).toContainEqual(metadata);
    }
  });

  it('uses default options', () => {
    const indexes = getTestModelIndexes();

    const defaultIndex = indexes.get('defaultAttribute');

    expect(defaultIndex).toBeDefined();
    expect(defaultIndex).toHaveProperty('name', 'defaultAttribute');
    expect(defaultIndex).toHaveProperty('type', 'boolean');
    expect(defaultIndex).toHaveProperty('optional', false);
  });

  it('infers the type of primitive property types', () => {
    const indexes = getTestModelIndexes();

    const expectedIndexes = {
      booleanIndex: 'boolean',
      numberIndex: 'number',
      objectIndex: 'object',
      stringIndex: 'string',
    };

    for (const [name, type] of Object.entries(expectedIndexes)) {
      const index = indexes.get(name);

      expect(index).toBeDefined();
      expect(index).toHaveProperty('name', name);
      expect(index).toHaveProperty('type', type);
    }
  });

  it('uses custom provided type option', () => {
    const indexes = getTestModelIndexes();

    const customIndex = indexes.get('customAttribute');

    expect(customIndex).toBeDefined();
    expect(customIndex).toHaveProperty('type', CustomType);
  });

  it('saves provided optional setting', () => {
    const indexes = getTestModelIndexes();

    const optionalIndex = indexes.get('optionalAttribute');

    expect(optionalIndex).toBeDefined();
    expect(optionalIndex).toHaveProperty('optional', true);
  });

  it('assumes provided type is correct over the reflected type', () => {
    const indexes = getTestModelIndexes();

    const overriddenTypeIndex = indexes.get('overriddenTypeAttribute');

    const reflectedType = typeof Reflect.getMetadata(
      'design:type',
      IndexTestModel.prototype,
      'overriddenTypeAttribute',
    )();

    expect(reflectedType).toBeDefined();
    expect(reflectedType).toBe('string');

    expect(overriddenTypeIndex).toBeDefined();
    expect(overriddenTypeIndex).toHaveProperty('type', 'boolean');
  });

  it('throws an error when a symbol property is used', () => {
    expect(() => Index()(undefined, Symbol('test'))).toThrow(
      "Property 'test' cannot be used as an index. Defining symbol properties as indexes is not supported",
    );
  });
});
