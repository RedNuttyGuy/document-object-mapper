import { randomUUID } from 'node:crypto';

import { Driver, type Storage, createStorage } from 'unstorage';
import memoryDriver from 'unstorage/drivers/memory';
import fsLiteDriver from 'unstorage/drivers/fs-lite';

import type { ModelConfig } from './model-config.interface';

import { ModelAttribute } from '../attributes/model-attribute.class';
import { Attribute } from '../attributes/attribute.decorator';

import { Query } from '../query/query.class';
import type { QueryFilter } from '../query/query-filter.type';
import { compare } from '../query/compare.function';

import { StaticModel } from '../types/static-model.type';
import { OmitModel } from 'src/types/omit-model';

export class Model {
  // #region Default fields

  /**
   * The ID of the Model instance. This is set on creation and should not be modified.
   */
  @Attribute({ fillable: false })
  public id: string;

  // #endregion

  // #region Creation

  public constructor(data: OmitModel<unknown>) {
    this.fill(data);

    this.id =
      this.id ??
      (data as { id?: string }).id ??
      (this.constructor as typeof Model).generateId();
  }

  /**
   * Creates a new instance of the model and fills it with the provided data.
   *
   * @param {OmitModel<T>} data The data to fill the model with.
   * @returns {T} A new instance of the model.
   */
  public static create<T extends Model>(
    this: StaticModel<T>,
    data: OmitModel<T>,
  ): T {
    return new this(data);
  }

  /**
   * Generate a new Model ID.
   *
   * @returns A new Model ID.
   */
  protected static generateId(): string {
    return randomUUID();
  }

  // #endregion

  // #region Config

  private static _config: ModelConfig = {
    inMemory: false,
    baseDirectory: 'db',
    preventFillingWithExtraAttributes: true,
    serialization: {
      serialize: (data) => JSON.stringify(data, null, 2),
      deserialize: (data) => JSON.parse(data),
    },
  };

  private static _configured = false;

  private static _storage: Storage = createStorage({
    driver: fsLiteDriver({ base: this._config.baseDirectory }) as Driver,
  });

  /**
   * Configure the Model class.
   *
   * Note: This will recreate the underlying storage driver of the Model class.
   *
   * @param config The configuration options for the Model class. Options will be merged with the default configuration.
   * @throws `Error` if the Model class has already been configured.
   */
  public static configure<T extends Model>(
    this: StaticModel<T>,
    config: Partial<ModelConfig>,
  ): void {
    if (this._configured) {
      throw new Error(
        `Failed configuring Model class. You may only configure the Model class once`,
      );
    }

    this._config = { ...this._config, ...config };

    if (config.baseDirectory !== undefined) {
      this._storage = createStorage({
        driver: config.inMemory
          ? (memoryDriver() as Driver)
          : (fsLiteDriver({ base: this._config.baseDirectory }) as Driver),
      });
    }

    this._configured = true;
  }

  // #endregion

  // #region Persistance

  /**
   * Get the base storage key for the Model class. All instances are stored under this key.
   *
   * @returns The storage key for the Model class.
   */
  public static getStorageKey(): string;
  /**
   * Get the full storage key for a specific Model instance.
   *
   * @param id The ID of the Model instance.
   * @returns The storage key for the Model instance.
   */
  public static getStorageKey(id: string): string;
  public static getStorageKey(id?: string): string {
    const key = this.name;

    return id === undefined ? key : `${key}:${id}`;
  }

  private static async readEntityFromStorage<T extends Model>(
    this: StaticModel<T>,
    id: string,
  ): Promise<Record<string, any> | null> {
    const data = await this._storage.getItemRaw<string>(this.getStorageKey(id));

    return data === null ? null : this.deserialize<T>(data);
  }

  private static async writeEntityToStorage<T extends Model>(
    entity: T,
  ): Promise<string> {
    if (entity.id === undefined) {
      entity.id = this.generateId();
    }

    await this._storage.setItemRaw(
      this.getStorageKey(entity.id),
      this.serialize(entity.toObject()),
    );

    return entity.id;
  }

  // #endregion

  // #region Queries

  /**
   * Create a new query instance for the Model class.
   *
   * @returns A `Query` instance bound to the Model class it was called from.
   */
  public static query<T extends Model>(this: StaticModel<T>): Query<T> {
    return Query.for(this);
  }

  /**
   * Determine if an object matches the provided filter.
   *
   * @param record The object to check.
   * @param filter The filter to apply to the object.
   * @returns `true` if the object matches the filter, otherwise `false`.
   */
  protected static filterRecord<T extends Record<string, any>>(
    record: Record<any, any>,
    filter: QueryFilter<T>[],
  ): boolean {
    return filter.every((f) => compare(record[f.field], f.operator, f.value));
  }

  /**
   * Find a Model instance by its ID.
   *
   * @param id The ID of the Model instance to find.
   * @returns The Model instance if found, otherwise `null`.
   */
  public static async findById<T extends Model>(
    this: StaticModel<T>,
    id: string,
  ): Promise<T | null> {
    const data = await this.readEntityFromStorage(id);

    return data === null ? null : this.create<T>(data as OmitModel<T>);
  }

  /**
   * Find a Model instance.
   *
   * @returns The first Model instance found, otherwise `null`.
   */
  public static async first<T extends Model>(
    this: StaticModel<T>,
  ): Promise<T | null>;
  /**
   * Find the first Model instance that matches the provided query.
   *
   * @param query The query to match against.
   * @returns The first Model instance that matches the query, otherwise `null`.
   */
  public static async first<T extends Model>(
    this: StaticModel<T>,
    query: Query<T>,
  ): Promise<T | null>;
  public static async first<T extends Model>(
    this: StaticModel<T>,
    query?: Query<T>,
  ): Promise<T | null> {
    const { filter = undefined } = query?.build() ?? {};

    for (const id of await this.list()) {
      const entity = await this.readEntityFromStorage(id);

      if (entity === null) {
        continue;
      }

      if (query === undefined || filter === undefined) {
        return this.create(entity as OmitModel<T>);
      }

      for (const condition of filter) {
        if (
          compare(
            entity[condition.field as string],
            condition.operator,
            condition.value,
          )
        ) {
          return this.create(entity as OmitModel<T>);
        }
      }
    }

    return null;
  }

  /**
   * Get all Model instances.
   *
   * @returns An array of all Model instances
   */
  public static async find<T extends Model>(this: StaticModel<T>): Promise<T[]>;
  /**
   * Find all Model instances that match the provided query.
   *
   * @param query The query to search against.
   * @returns An array of Model instances that match the query.
   */
  public static async find<T extends Model>(
    this: StaticModel<T>,
    query: Query<T>,
  ): Promise<T[]>;
  public static async find<T extends Model>(
    this: StaticModel<T>,
    query?: Query<T>,
  ): Promise<T[]> {
    let _query: Query<T>;

    if (query === undefined) {
      _query = this.query();
    } else {
      _query = query;
    }

    const { filter } = _query.build();

    const entities = await Promise.all(
      (await this.list()).map<Promise<Record<string, any> | null>>(
        async (id) => {
          const entity = await this.readEntityFromStorage(id);

          if (entity === null) {
            return null;
          }

          return this.filterRecord(entity, filter) ? entity : null;
        },
      ),
    );

    return entities
      .filter((entity) => entity !== null)
      .map((entity) => this.create<T>(entity as OmitModel<T>));
  }

  /**
   * List all Model IDs.
   *
   * @returns An array of all Model IDs.
   */
  public static async list(): Promise<string[]> {
    return (await this._storage.getKeys(this.getStorageKey())).map((id) =>
      id.replace(new RegExp(`^${this.name}:`), ''),
    );
  }

  // #endregion

  // #region Data and Saving

  /**
   * Fill the Model instance with the provided data.
   *
   * All required fields must be provided when filling a new Model instance.
   *
   * @param data The data to fill the Model instance with. Attributes that are not `fillable` are stripped before setting the data.
   * @returns The Model instance overwritten with the provided data.
   * @throws `Error` if the data is invalid.
   */
  public fill(data: Partial<OmitModel<this>>): this {
    const requiredAttributes = ModelAttribute.getRequired(
      this.constructor as typeof Model,
    );
    const fillableAttributes = ModelAttribute.getFillable(
      this.constructor as typeof Model,
    );

    if (requiredAttributes === undefined || fillableAttributes === undefined) {
      throw new Error(
        `Cannot find attributes for class ${this.constructor.name}`,
      );
    }

    const filteredDataEntries = Object.entries(data).filter(
      ([key]) =>
        fillableAttributes.find((attr) => attr.name === key) !== undefined,
    );

    const filteredKeys = filteredDataEntries.map(([key]) => key);
    const dataValid =
      this.id === undefined &&
      requiredAttributes.every((attr) => filteredKeys.includes(attr.name));

    if (this.id === undefined && !dataValid) {
      throw new Error(
        `Attempted to create ${this.constructor.name} entity but data is invalid\n` +
          `Missing the following fields:\n - ${requiredAttributes
            .filter((attr) => !filteredKeys.includes(attr.name))
            .map((attr) => attr.name)
            .join('\n - ')}`,
      );
    }

    return Object.assign(this, Object.fromEntries(filteredDataEntries));
  }

  /**
   * Persist the Model instance to storage.
   *
   * @returns `true` if the Model instance was saved successfully.
   */
  public async save(): Promise<this> {
    this.id = await (
      this.constructor as typeof Model
    ).writeEntityToStorage<Model>(this);

    return this;
  }

  // #endregion

  // #region Transforms

  /**
   * Convert the Model instance to a plain object.
   * Only contains properties that are defined as attributes.
   *
   * @returns A plain object representation of the Model instance.
   */
  public toObject(): object {
    return Object.fromEntries(
      ModelAttribute.getFields(this.constructor as typeof Model)?.map(
        (attribute) => [attribute.name, this[attribute.name as keyof this]],
      ) ?? [],
    );
  }

  /**
   * Convert an object to a string using the Model's serialization function.
   *
   * @param data The data to serialize.
   * @returns The serialized data.
   */
  public static serialize(data: Record<string, any>): string {
    return this._config.serialization.serialize(data);
  }

  /**
   * Convert the current Model instance to a string.
   *
   * @returns The serialized Model instance.
   */
  public serialize(): string {
    return (this.constructor as typeof Model).serialize(this.toObject());
  }

  /**
   * Convert a string to an object using the Model's deserialization function.
   *
   * @param data The string to deserialize.
   * @returns An object created from the provided data.
   */
  public static deserialize<T extends Model>(
    this: StaticModel<T>,
    data: Buffer | string,
  ): Record<string, any> {
    return this._config.serialization.deserialize(data.toString());
  }

  // #endregion
}
