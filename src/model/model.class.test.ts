import 'reflect-metadata';
import { Model } from './model.class';
import { DataTestModel } from '../../testing/data-test-model.model';
import { Query } from '../query/query.class';

const defaultModelConfig = Model['_config'];

describe('Model Class', () => {
  beforeAll(() => {
    Model.configure({
      inMemory: true,
      baseDirectory: 'test',
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();

    Model['_config'] = defaultModelConfig;
    Model['_configured'] = false;
  });

  it('creates a new instance', () => {
    const newInstance = DataTestModel.create({
      str: 'Test',
      bool: true,
      num: 42,
      obj: { key: 'value' },
      optional: 'Optional',
    });

    expect(newInstance).toBeInstanceOf(Model);
    expect(newInstance).toBeInstanceOf(DataTestModel);

    expect(newInstance).toHaveProperty('str', 'Test');
    expect(newInstance).toHaveProperty('bool', true);
    expect(newInstance).toHaveProperty('num', 42);
    expect(newInstance).toHaveProperty('obj', { key: 'value' });
    expect(newInstance).toHaveProperty('optional', 'Optional');
  });

  it('is created with an auto-generated guid', () => {
    const generateIdMock = jest.spyOn(DataTestModel, 'generateId' as any);

    const newInstance = DataTestModel.create({
      str: 'Test',
      bool: true,
      num: 42,
      obj: { key: 'value' },
      optional: 'Optional',
    });

    expect(generateIdMock).toHaveBeenCalled();
    expect(newInstance.id).toBeDefined();
    // Expected GUID format
    expect(newInstance.id).toMatch(
      /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i,
    );
  });

  it('throws an error if the model is created with missing data', () => {
    expect(() => {
      //@ts-expect-error Testing error is thrown if required data is missing
      DataTestModel.create({
        str: 'Test',
        bool: true,
        num: 42,
      });
    }).toThrow(Error);
  });

  it('throws an error if the model is created with extra data', () => {
    expect(() => {
      DataTestModel.create({
        str: 'Test',
        bool: true,
        num: 42,
        //@ts-expect-error Testing error is thrown if extra data is provided
        nonExistent: 'Extra',
      });
    }).toThrow(Error);
  });

  it('allows creation with optional data missing', () => {
    const newInstance = DataTestModel.create({
      str: 'Test',
      bool: true,
      num: 42,
      obj: { key: 'value' },
    });

    expect(newInstance).not.toHaveProperty('optional');
  });

  it('fills instance with data from an object', () => {
    const newInstance = DataTestModel.create({
      str: 'Test',
      bool: true,
      num: 42,
      obj: { key: 'value' },
      optional: 'Optional',
    });

    expect(newInstance).toHaveProperty('str', 'Test');
    expect(newInstance).toHaveProperty('bool', true);
    expect(newInstance).toHaveProperty('num', 42);
    expect(newInstance).toHaveProperty('obj', { key: 'value' });
    expect(newInstance).toHaveProperty('optional', 'Optional');

    newInstance.fill({
      str: 'New Test',
      bool: false,
      num: 24,
      obj: { newKey: 'newValue' },
      optional: 'New Optional',
    });

    expect(newInstance).toHaveProperty('str', 'New Test');
    expect(newInstance).toHaveProperty('bool', false);
    expect(newInstance).toHaveProperty('num', 24);
    expect(newInstance).toHaveProperty('obj', { newKey: 'newValue' });
    expect(newInstance).toHaveProperty('optional', 'New Optional');
  });

  it('allows filling with partial data', () => {
    const newInstance = DataTestModel.create({
      str: 'Test',
      bool: true,
      num: 42,
      obj: { key: 'value' },
      optional: 'Optional',
    });

    expect(newInstance).toHaveProperty('str', 'Test');
    expect(newInstance).toHaveProperty('bool', true);
    expect(newInstance).toHaveProperty('num', 42);
    expect(newInstance).toHaveProperty('obj', { key: 'value' });
    expect(newInstance).toHaveProperty('optional', 'Optional');

    newInstance.fill({
      str: 'New Test',
      bool: false,
    });

    expect(newInstance).toHaveProperty('str', 'New Test');
    expect(newInstance).toHaveProperty('bool', false);
    expect(newInstance).toHaveProperty('num', 42);
    expect(newInstance).toHaveProperty('obj', { key: 'value' });
    expect(newInstance).toHaveProperty('optional', 'Optional');
  });

  it('prevents filling an instances id', () => {
    const newInstance = DataTestModel.create({
      str: 'Test',
      bool: true,
      num: 42,
      obj: { key: 'value' },
      optional: 'Optional',
    });

    const id = newInstance.id;

    newInstance.fill({
      //@ts-expect-error testing that filling from stored data with ID sets the ID correctly
      id: 'newid',
    });

    expect(newInstance.id).toBe(id);
  });

  it('allows configuration of the model class', () => {
    Model.configure({
      preventFillingWithExtraAttributes: true,
    });

    expect(Model['_config']).toBeDefined();
    expect(Model['_config'].preventFillingWithExtraAttributes).toBe(true);
  });

  it('prevents multiple calls to the configure functiion', () => {
    Model.configure({
      preventFillingWithExtraAttributes: true,
    });

    expect(() => {
      Model.configure({
        preventFillingWithExtraAttributes: false,
      });
    }).toThrow(Error);
  });

  it('allows configuration of seperate models', () => {
    class ConfigTestModel extends Model {}
    class ConfigTestModel2 extends Model {}

    ConfigTestModel.configure({
      preventFillingWithExtraAttributes: true,
    });

    ConfigTestModel2.configure({
      preventFillingWithExtraAttributes: false,
    });

    expect(ConfigTestModel['_config']).toBeDefined();
    expect(ConfigTestModel['_config'].preventFillingWithExtraAttributes).toBe(
      true,
    );

    expect(ConfigTestModel2['_config']).toBeDefined();
    expect(ConfigTestModel2['_config'].preventFillingWithExtraAttributes).toBe(
      false,
    );
  });

  it('allows configuration of the base model class with default values', () => {
    class ConfigTestModel extends Model {}

    Model.configure({
      preventFillingWithExtraAttributes: false,
    });

    expect(ConfigTestModel['_config']).toBeDefined();
    expect(ConfigTestModel['_config'].preventFillingWithExtraAttributes).toBe(
      false,
    );
  });

  it('custom models do not override the base model config and all unconfigured inheritors', () => {
    class ConfigTestModel extends Model {}
    class ConfigTestModel2 extends Model {}

    ConfigTestModel.configure({
      preventFillingWithExtraAttributes: 'warn',
    });

    expect(Model['_config'].preventFillingWithExtraAttributes).toBe(true);
    expect(ConfigTestModel['_config'].preventFillingWithExtraAttributes).toBe(
      'warn',
    );
    expect(ConfigTestModel2['_config'].preventFillingWithExtraAttributes).toBe(
      true,
    );

    Model.configure({
      preventFillingWithExtraAttributes: false,
    });

    expect(Model['_config']).toBeDefined();
    expect(Model['_config'].preventFillingWithExtraAttributes).toBe(false);

    expect(ConfigTestModel['_config']).toBeDefined();
    expect(ConfigTestModel['_config'].preventFillingWithExtraAttributes).toBe(
      'warn',
    );

    expect(ConfigTestModel2['_config']).toBeDefined();
    expect(ConfigTestModel2['_config'].preventFillingWithExtraAttributes).toBe(
      false,
    );
  });

  it('dynamically generates a storage key based on the model class name', () => {
    expect(DataTestModel['getStorageKey']()).toBe('DataTestModel');
    expect(DataTestModel['getStorageKey']('someId')).toBe(
      'DataTestModel:someId',
    );
  });

  it('extracts attributes to a plain object', () => {
    const newInstance = DataTestModel.create({
      str: 'Test',
      bool: true,
      num: 42,
      obj: { key: 'value' },
      optional: 'Optional',
    });

    //@ts-expect-error Testing that extra data is not included in the plain object
    newInstance.extra = 'Extra';

    const plain = newInstance.toObject();

    expect(plain).toEqual({
      id: newInstance.id,
      str: 'Test',
      bool: true,
      num: 42,
      obj: { key: 'value' },
      optional: 'Optional',
    });
  });

  it('Saves to storage', async () => {
    const newInstance = DataTestModel.create({
      str: 'John Doe',
      bool: true,
      num: 25,
      obj: { key: 'value' },
      optional: 'Optional',
    });

    await newInstance.save();

    const modelStorage = DataTestModel['_storage'];
    const storageKey = DataTestModel['getStorageKey'](newInstance.id);

    const expectedData = {
      id: newInstance.id,
      str: 'John Doe',
      bool: true,
      num: 25,
      obj: { key: 'value' },
      optional: 'Optional',
    };

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    expect(modelStorage.getItem(storageKey)).resolves.toEqual(expectedData);
  });

  it('retrieves and creates new instances from storage', async () => {
    const testData = {
      str: 'John Doe',
      bool: true,
      num: 25,
      obj: { key: 'value' },
      optional: 'Optional',
    };

    const newInstance = DataTestModel.create(testData);

    await newInstance.save();

    const retrievedInstance = await DataTestModel.findById(newInstance.id);

    expect(retrievedInstance).toBeDefined();
    expect(retrievedInstance).not.toBeNull();
    expect(retrievedInstance).toBeInstanceOf(DataTestModel);

    // Tested by .toBeDefined and .not.toBeNull above
    if (retrievedInstance === undefined || retrievedInstance === null) {
      return;
    }

    expect(retrievedInstance.toObject()).toEqual({
      ...testData,
      id: newInstance.id,
    });
  });

  it('returns null if the instance is not found in storage', async () => {
    const retrievedInstance = await DataTestModel.findById('nonExistentId');

    expect(retrievedInstance).toBeNull();
  });

  it('ensures that the entity has an id before saving', async () => {
    const generateIdMock = jest.spyOn(DataTestModel, 'generateId' as any);

    const newInstance = DataTestModel.create({
      str: 'John Doe',
      bool: true,
      num: 25,
      obj: { key: 'value' },
      optional: 'Optional',
    });

    expect(generateIdMock).toHaveBeenCalledTimes(1);
    expect(newInstance.id).toBeDefined();

    const oldId = newInstance.id;
    // @ts-expect-error Testing error condition if id initialization does not occur
    newInstance.id = undefined;

    expect(newInstance.id).toBeUndefined();
    await newInstance.save();

    expect(generateIdMock).toHaveBeenCalledTimes(2);
    expect(newInstance.id).toBeDefined();
    expect(newInstance.id).not.toBe(oldId);
  });

  it('creates a new query instance', () => {
    const query = DataTestModel.query();

    expect(query).toBeDefined();
    expect(query).toBeInstanceOf(Query);

    expect(query['_model']).toBe(DataTestModel);
  });
});
