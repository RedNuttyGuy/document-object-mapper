import { randomUUID } from 'node:crypto';

import { type Storage, createStorage } from 'unstorage';
import fsLiteDriver from 'unstorage/drivers/fs-lite';

import type { ModelConfig } from './model-config.interface';

import type { ModelAttribute } from '../attributes/model-attribute.interface';
import {
  Attribute,
  attributesMetadataKey,
} from '../attributes/attribute.decorator';

import type { ModelIndex } from '../indexes/model-index.interface';
import { Index, indexesMetadataKey } from '../indexes/index.decorator';

import { Query } from '../query/query.class';
// import type { Queryable } from '../query/queryable.interface';
import type { QueryFilter } from '../query/query-filter.type';

import type { This } from '../types/this.type';
import type { ThisConstructor } from '../types/this-constructor.type';
import { QueryOperator } from 'src/query/query-operator.type';

export class Model {
  // #region Default fields

  @Attribute()
  // @Index({ name: '_id' })
  public id: string;

  // #endregion

  // #region Creation

  protected constructor() {}

  public static create<T extends ThisConstructor<typeof Model>>(
    this: T,
    data: Omit<This<T>, keyof Model>,
  ): This<T> {
    const instance: Model = new this();

    instance.fill(data);

    instance.id =
      instance.id ?? (data as { id?: string }).id ?? this.generateId();

    return new Proxy<This<T>>(instance, {
      set(target, p, newValue, receiver) {
        if (
          typeof p !== 'symbol' &&
          (target.constructor as typeof Model)._getAttributes().includes(p)
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
  };

  private static _configured = false;
  public static configure<T extends ThisConstructor<typeof Model>>(
    this: T,
    config: Partial<ModelConfig>,
  ): void {
    if (this._configured === true) {
      throw new Error(
        `Failed configuring Model class ${this.name}. You may only configure a Model class once`,
      );
    }

    this._config = Object.assign({}, this._config, config);

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

  protected static getStorageKey(): string;
  protected static getStorageKey(id: string): string;
  protected static getStorageKey(id?: string): string {
    const key = this.name;

    return (id === undefined) 
      ? key
      : `${key}:${id}`;
  }

  protected static getIndexKey(): string;
  protected static getIndexKey(index: ModelIndex): string;
  protected static getIndexKey(index?: ModelIndex): string {
    const key = `${this.name}:_indexes`;

    return (index === undefined)
      ? key
      : `${key}:${index.name}`;
  }

  // #endregion

  // #region Metadata

  private get _name(): string {
    return this.constructor.name;
  }

  private static _getAttributeMetadata(): Map<string, ModelAttribute> {
    const a = Reflect.getMetadata(attributesMetadataKey, this);

    return a as Map<string, ModelAttribute>;
  }

  private static _getAttributes(): string[] {
    return Array.from(this._getAttributeMetadata().keys());
  }

  private static _getFillableAttributes(): string[] {
    return Array.from(this._getAttributeMetadata().entries())
      .filter(([name, attr]) => name !== 'id')
      .map(([attr]) => attr);
  }

  private static _getRequiredAttributes(): string[] {
    return Array.from(this._getAttributeMetadata().entries())
      .filter(([name, attr]) => name !== 'id')
      .filter(([name, attr]) => !attr.optional)
      .map(([attr]) => attr);
  }

  private static _getIndexMetadata(): Map<string, ModelIndex> {
    return Reflect.getMetadata(indexesMetadataKey, this) as Map<
      string,
      ModelIndex
    >;
  }

  private static _getIndexes(): ModelIndex[] {
    return Array.from(this._getIndexMetadata().values());
  }

  // #endregion

  // #region Persistance

  private static async readEntityFromStorage<T>(id: string): Promise<T | null> {
    const data = await this._storage.getItem(this.getStorageKey(id));

    return data === null || typeof data !== 'object' ? null : (data as T);
  }

  private static async writeEntityToStorage<T extends Model>(
    entity: T,
  ): Promise<string> {
    if (entity.id === undefined) {
      entity.id = this.generateId();
    }

    await this._storage.setItem(
      this.getStorageKey(entity.id),
      entity.toObject(),
    );

    return entity.id;
  }

  // #endregion

  // #region Indexes

  private static async readIndexFromStorage(
    index: ModelIndex,
  ): Promise<Record<any, string[]>> {
    const data = await this._storage.getItem(this.getIndexKey(index));

    return data === null || typeof data !== 'object'
      ? null
      : (data as Record<any, string[]>);
  }

  private static writeIndexToStorage(
    index: ModelIndex,
    indexData: Record<any, string[]>,
  ) {
    const indexKey = this.getIndexKey(index);
    let indexData = await this.readIndexFromStorage(index);

    if (indexData === null) {
      // indexData = buildIndex(index);
    }

    // set(indexData, field, value, id)

    await this._storage.setItem(indexKey, indexData);
  }

  private static async getIdsFromIndexes<T extends Model>(
    filters: QueryFilter<T>[],
  ): Promise<string[]> {

    let possibleIds: string[] | null = null;

    let i = 0;
    do {
      const filter = filters[i];
      // get index
      const index = this._getIndexMetadata().get(filter.field as string)
      //get index data
      const indexData = await this.readIndexFromStorage(index)
      // get ids for filter from indexData
      const ids = indexData[filter.value];

      possibleIds = (i === 0 && possibleIds === null) 
        ? ids
        : possibleIds.filter(id => ids.includes(id));
    
    } while(i++ < filters.length || possibleIds !== null || possibleIds.length > 2)






    const filtersByField = filters
      .reduce<Record<string, QueryFilter<T>[]>>((a, c) => {
        const field = c.field as string;

        a[field] === undefined ? (a[field] = [c]) : a[field].push(c)
      
        return a;
      }, {});

    const indexes = this._getIndexes()
      .filter(index => filtersByField.hasOwnProperty(index.field));

    const possibleMatches = new Set<string>();
    let i = 0;

    do {
      const index = indexes[i];
      const indexData = await this.readIndexFromStorage(index);
  
      for (const filter of filtersByField[index.field]) {
        const ids = {
          [QueryOperator.eq]:  (value: QueryFilter<T>['value']) => indexData[value],
          [QueryOperator.gt]:  (value: QueryFilter<T>['value']) => Object.entries(indexData).reduce(
            (a, [val, ids]) => { if(value > val) {a.push(...ids) } return a}, []),
          [QueryOperator.gte]: (value: QueryFilter<T>['value']) => Object.entries(indexData).reduce(
            (a, [val, ids]) => { if(value >= val) {a.push(...ids) } return a}, []),
          [QueryOperator.in]:  (value: QueryFilter<T>['value'][]) => Object.entries(indexData).reduce(
            (a, [val, ids]) => { if(val in value) {a.push(...ids) } return a}, []),
          [QueryOperator.lt]:  (value: QueryFilter<T>['value']) => Object.entries(indexData).reduce(
            (a, [val, ids]) => { if(value < val) {a.push(...ids) } return a}, []),
          [QueryOperator.lte]: (value: QueryFilter<T>['value']) => Object.entries(indexData).reduce(
            (a, [val, ids]) => { if(value <= val) {a.push(...ids) } return a}, []),
          [QueryOperator.ne]:  (value: QueryFilter<T>['value']) => Object.entries(indexData).reduce(
            (a, [val, ids]) => { if(value !== val) {a.push(...ids) } return a}, []),
        }[filter.operator](filter.value)
      }
      const ids = indexData[]
      if (possibleMatches.size === 0) {
        possibleMatches.add(...indexData)
      }
    }
    while (possibleMatches.size > 1 && i <= indexes.length)
  }

  // private static async generateIndex<T extends Model>(index: ModelIndex) {
  //   const idIndex = await this.readIndexFromStorage(
  //     this._getIndexMetadata().get('_id'),
  //   );

  //   const fields = index.fields as (keyof T)[];

  //   const ids = Object.keys(idIndex);

  //   // Creates the following data structure
  //   // {
  //   //   ...index.fields[0]: {
  //   //     ...index.fields[1]: {
  //   //       ...: [...ids]
  //   //     }
  //   //   }
  //   // }
  //   const generateIndexLayer = (i: number, entities: T[]) => {
  //     const field = fields[i];
  //     const lastField = i === fields.length - 1;

  //     interface LayerEntries<T> {
  //       [value: string | number | symbol]: (T | string)[] | undefined;
  //     }

  //     const entries = entities.reduce<LayerEntries<T>>((entries, entity) => {
  //       const val = entity[field] as string | number | symbol;

  //       if (entries[val] === undefined) {
  //         entries[val] = [];
  //       }

  //       entries[val].push(lastField ? entity.id : entity);

  //       return entries;
  //     }, {});

  //     const layer: Record<any, unknown> = {};

  //     if (!lastField) {
  //       for (const [uniqueVal, entities] of Object.entries(entries)) {
  //         layer[uniqueVal] = generateIndexLayer(i + 1, entities as T[]);
  //       }
  //     }

  //     return layer;
  //   };

  // const indexes = await Promise.all({ })
  // const entity = await this.readEntityFromStorage(id)
  // }

  // private static updateIndexes<T extends Model>(entity: T) {
  //   const indexes = (entity.constructor as typeof Model)._getIndexesByField();

  //   for (const index of indexes) {
  //     const indexObject = this.readIndex
  //   }

  // }

  // #endregion

  // #region Queries

  public static query<T extends typeof Model>(
    this: ThisConstructor<T>,
  ): Query<This<T>, T> {
    return Query.for<This<T>, T>(this);
  }

  public static async findById<T extends typeof Model>(
    this: T,
    id: string,
  ): Promise<This<T> | null> {
    const data = await this.readEntityFromStorage<This<T>>(id);

    if (data === null) {
      return null;
    }

    return this.create<T>(data);
  }

  public static async findFirst<T extends typeof Model>(
    this: ThisConstructor<T>,
    filter: QueryFilter<This<T>>[],
  ): Promise<This<T> | null> {
    const id = await this.getIdFromIndexes(null, filter);

    return this.findById(id);
  }

  public static async findAll<T extends typeof Model>(
    this: ThisConstructor<T>,
    filter: QueryFilter<This<T>>[],
  ): Promise<This<T>[]> {
    const ids = await this.getIdsFromIndexes(filter);

    return Promise.all(ids.map((id) => this.findById<T>(id)));
  }

  // #endregion

  // #region Data and Saving

  public fill(data: Partial<Omit<this, keyof Model>>): this {
    const requiredAttributes = (
      this.constructor as typeof Model
    )._getRequiredAttributes();
    const fillableAttributes = (
      this.constructor as typeof Model
    )._getFillableAttributes();

    const filteredDataEntries = Object.entries(data).filter(([key]) =>
      fillableAttributes.includes(key),
    );

    const filteredKeys = filteredDataEntries.map(([key]) => key);
    const dataValid =
      this.id === undefined &&
      requiredAttributes.every((attr) => filteredKeys.includes(attr));

    if (this.id === undefined && !dataValid) {
      throw new Error(
        `Attempted to create ${this._name} entity but data is invalid\n` +
          `Missing the following fields:\n${requiredAttributes.filter((attr) => !filteredKeys.includes(attr)).join('\n - ')}`,
      );
    }

    return Object.assign(this, Object.fromEntries(filteredDataEntries));
  }

  public async save(): Promise<boolean> {
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
      (this.constructor as typeof Model)
        ._getAttributes()
        .map((attribute) => [attribute, this[attribute as keyof this]]),
    );
  }

  // #endregion
}
