import { randomUUID } from 'node:crypto';

import { type Storage, createStorage } from 'unstorage';
import fsLiteDriver from 'unstorage/drivers/fs-lite';

import type { ModelConfig } from './model-config.interface';

import { ModelAttribute } from '../attributes/model-attribute.class';
import { Attribute } from '../attributes/attribute.decorator';

import { Query } from '../query/query.class';
import type { QueryFilter } from '../query/query-filter.type';
import { compare } from '../query/compare.function';

import type { This } from '../types/this.type';
import type { ThisConstructor } from '../types/this-constructor.type';
import type { OmitBaseModel } from '../types/extended-model.type';

export class Model {
  // #region Default fields

  @Attribute({ fillable: false })
  public id: string;

  // #endregion

  // #region Creation

  protected constructor() {}

  public static create<T extends ThisConstructor<typeof Model>>(
    this: T,
    data: OmitBaseModel<T>,
  ): This<T> {
    const instance: Model = new this();

    instance.fill(data);

    instance.id =
      instance.id ?? (data as { id?: string }).id ?? this.generateId();

    return new Proxy<This<T>>(instance, {
      set(target, p, newValue, receiver) {
        if (
          typeof p !== 'symbol' &&
          ModelAttribute.getFields(target.constructor as typeof Model).find(
            (attr) => attr.name === p,
          ) !== null
        ) {
          target._dirty.add(p);
        }

        return Reflect.set(target, p, newValue, receiver);
      },
    });
  }

  protected static generateId(): string {
    return randomUUID();
  }

  private _dirty: Set<string> = new Set();

  public get dirty(): string[] {
    return Array.from(this._dirty.values());
  }

  // #endregion

  // #region Config

  private static _config: ModelConfig = {
    storageDriver: fsLiteDriver({ base: 'db' }),
    preventFillingWithExtraAttributes: true,
    serialization: {
      serialize: (data) => JSON.stringify(data, null, 2),
      deserialize: (data) => JSON.parse(data),
    },
  };

  private static _configured = false;
  public static configure<T extends ThisConstructor<typeof Model>>(
    this: T,
    config: Partial<ModelConfig>,
  ): void {
    if (this._configured) {
      throw new Error(
        `Failed configuring Model class. You may only configure the Model class once`,
      );
    }

    this._config = { ...this._config, ...config };

    if (config.storageDriver !== undefined) {
      this._storage = createStorage({
        driver: this._config.storageDriver,
      });
    }

    this._configured = true;
  }

  private static _storage: Storage = createStorage({
    driver: this._config.storageDriver,
  });

  // #endregion

  // #region Persistance

  public static getStorageKey(): string;
  public static getStorageKey(id: string): string;
  public static getStorageKey(id?: string): string {
    const key = this.name;

    return id === undefined ? key : `${key}:${id}`;
  }

  private static async readEntityFromStorage<
    T extends ThisConstructor<typeof Model>,
  >(this: ThisConstructor<T>, id: string): Promise<Record<string, any> | null> {
    const data = await this._storage.getItemRaw(this.getStorageKey(id));

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

  public static query<T extends typeof Model>(
    this: ThisConstructor<T>,
  ): Query<This<T>, T> {
    return Query.for<T>(this);
  }

  protected static filterRecord<T extends Record<string, any>>(
    record: Record<any, any>,
    filter: QueryFilter<T>[],
  ): boolean {
    return filter.every((f) => compare(record[f.field], f.operator, f.value));
  }

  public static async findById<T extends ThisConstructor<typeof Model>>(
    this: T,
    id: string,
  ): Promise<This<T> | null> {
    const data = await this.readEntityFromStorage(id);

    return data === null ? null : this.create<T>(data as OmitBaseModel<T>);
  }

  public static async first<T extends ThisConstructor<typeof Model>>(
    this: T,
  ): Promise<This<T>[]>;
  public static async first<T extends ThisConstructor<typeof Model>>(
    this: T,
    query: Query<This<T>, T>,
  ): Promise<This<T>[]>;
  public static async first<T extends ThisConstructor<typeof Model>>(
    this: T,
    query?: Query<This<T>, T>,
  ): Promise<This<T> | null> {
    const { filter } = query.build();

    (await this.list()).find(async (id) => {
      const entity = await this.readEntityFromStorage(id);

      if (entity === null) {
        return null;
      }

      for (const condition of filter) {
        if (
          compare(
            entity[condition.field as string],
            condition.operator,
            condition.value,
          )
        ) {
          return this.create(entity as OmitBaseModel<T>);
        }
      }
    });

    return null;
  }

  public static async find<T extends ThisConstructor<typeof Model>>(
    this: T,
  ): Promise<This<T>[]>;
  public static async find<T extends ThisConstructor<typeof Model>>(
    this: T,
    query: Query<This<T>, T>,
  ): Promise<This<T>[]>;
  public static async find<T extends ThisConstructor<typeof Model>>(
    this: T,
    query?: Query<This<T>, T>,
  ): Promise<This<T>[]> {
    let _query: Query<This<T>, T>;

    if (query === undefined) {
      _query = this.query<T>();
    } else {
      _query = query;
    }

    const { filter } = _query.build();

    const entities = await Promise.all(
      (await this.list()).map<Promise<Record<string, any> | null>>(
        async (id) => {
          const entity = await this.readEntityFromStorage(id);

          return this.filterRecord(entity, filter) ? entity : null;
        },
      ),
    );

    return entities
      .filter((entity) => entity !== null)
      .map((entity) => this.create<T>(entity as OmitBaseModel<T>));
  }

  public static async list(): Promise<string[]> {
    return (await this._storage.getKeys(this.getStorageKey())).map((id) =>
      id.replace(new RegExp(`^${this.name}:`), ''),
    );
  }

  // #endregion

  // #region Data and Saving

  public fill(data: Partial<Omit<this, keyof Model>>): this {
    const requiredAttributes = ModelAttribute.getRequired(
      this.constructor as typeof Model,
    );
    const fillableAttributes = ModelAttribute.getFillable(
      this.constructor as typeof Model,
    );
    
    const filteredDataEntries = Object.entries(data).filter(
      ([key]) => fillableAttributes.find((attr) => attr.name === key) !== undefined,
    );
    
    const filteredKeys = filteredDataEntries.map(([key]) => key);
    const dataValid =
      this.id === undefined &&
      requiredAttributes.every((attr) => filteredKeys.includes(attr.name));

    if (this.id === undefined && !dataValid) {
      throw new Error(
        `Attempted to create ${this.constructor.name} entity but data is invalid\n` +
          `Missing the following fields:\n${requiredAttributes
            .filter((attr) => !filteredKeys.includes(attr.name))
            .map((attr) => attr.name)
            .join('\n - ')}`,
      );
    }

    return Object.assign(this, Object.fromEntries(filteredDataEntries));
  }

  public async save(): Promise<true> {
    this.id = await (
      this.constructor as typeof Model
    ).writeEntityToStorage<Model>(this);

    this._dirty.clear();

    // (this.constructor as typeof Model)
    //   .updateIndexes(this)

    return true;
  }

  // #endregion

  // #region Transforms

  public toObject(): Object {
    return Object.fromEntries(
      ModelAttribute.getFields(this.constructor as typeof Model).map(
        (attribute) => [attribute.name, this[attribute.name as keyof this]],
      ),
    );
  }

  public static serialize(data: Record<string, any>): string {
    return this._config.serialization.serialize(data);
  }

  public serialize(): string {
    return (this.constructor as typeof Model).serialize(this.toObject());
  }

  public static deserialize<T extends ThisConstructor<typeof Model>>(
    this: T,
    data: Buffer | string,
  ): Record<string, any> {
    return this._config.serialization.deserialize(data.toString());
  }

  // #endregion
}
