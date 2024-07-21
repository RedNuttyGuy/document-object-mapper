import { CustomType } from '../../testing/custom-type.class';
import { EmptyTestModel } from '../../testing/empty-test-model.class';
import { AttributeTestModel } from '../../testing/attribute-test-model.model';
import { Attribute, attributesMetadataKey } from './attribute.decorator';
import { ModelAttribute } from './model-attribute.class';

describe('Attribute Decorator', () => {
  const getTestModelAttributes = (): Map<string, ModelAttribute> =>
    Reflect.getMetadata(attributesMetadataKey, AttributeTestModel);

  it('sets attribute metadata', () => {
    const attributes = getTestModelAttributes();

    expect(attributes).toBeDefined();
    expect(attributes).toBeInstanceOf(Map);
  });

  it('saves attribute metadata with correct shape', () => {
    const attributes = getTestModelAttributes();

    for (const metadata of attributes.values()) {
      expect([
        {
          name: expect.any(String),
          type: expect.any(String),
          optional: expect.any(Boolean),
          fillable: expect.any(Boolean),
        },
        {
          name: expect.any(String),
          type: expect.any(Function),
          optional: expect.any(Boolean),
          fillable: expect.any(Boolean),
        },
      ]).toContainEqual(metadata);
    }
  });

  it('uses default options', () => {
    const attributes = getTestModelAttributes();

    const defaultAttribute = attributes.get('defaultAttribute');

    expect(defaultAttribute).toBeDefined();
    expect(defaultAttribute).toHaveProperty('name', 'defaultAttribute');
    expect(defaultAttribute).toHaveProperty('type', 'boolean');
    expect(defaultAttribute).toHaveProperty('optional', false);
  });

  it('infers the type of primitive property types', () => {
    const attributes = getTestModelAttributes();

    const expectedAttributes = {
      booleanAttribute: 'boolean',
      numberAttribute: 'number',
      objectAttribute: 'object',
      stringAttribute: 'string',
    };

    for (const [name, type] of Object.entries(expectedAttributes)) {
      const attribute = attributes.get(name);

      expect(attribute).toBeDefined();
      expect(attribute).toHaveProperty('name', name);
      expect(attribute).toHaveProperty('type', type);
    }
  });

  it('uses custom provided type option', () => {
    const attributes = getTestModelAttributes();

    const customAttribute = attributes.get('customAttribute');

    expect(customAttribute).toBeDefined();
    expect(customAttribute).toHaveProperty('type', CustomType);
  });

  it('saves provided optional setting', () => {
    const attributes = getTestModelAttributes();

    const optionalAttribute = attributes.get('optionalAttribute');

    expect(optionalAttribute).toBeDefined();
    expect(optionalAttribute).toHaveProperty('optional', true);
  });

  it('assumes provided type is correct over the reflected type', () => {
    const attributes = getTestModelAttributes();

    const overriddenTypeAttribute = attributes.get('overriddenTypeAttribute');

    const reflectedType: string = typeof Reflect.getMetadata(
      'design:type',
      AttributeTestModel.prototype,
      'overriddenTypeAttribute',
    )();

    expect(reflectedType).toBeDefined();
    expect(reflectedType).toBe('string');

    expect(overriddenTypeAttribute).toBeDefined();
    expect(overriddenTypeAttribute).toHaveProperty('type', 'boolean');
  });

  it('throws an error when a symbol property is used', () => {
    expect(() =>
      Attribute()(EmptyTestModel.create({}), Symbol('test')),
    ).toThrow(
      "Property 'test' cannot be used as an attribute. Defining symbol properties as attributes is not supported",
    );
  });
});
