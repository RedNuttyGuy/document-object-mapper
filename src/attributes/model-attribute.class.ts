import type { Model } from '../model/model.class';
import type { Typeof } from '../types/typeof.type';
import type { AttributeOptions } from './attribute-options.interface';
import { attributesMetadataKey } from './attribute.decorator';

/**
 * Represents a model attribute.
 */
export class ModelAttribute {
  constructor(
    name: string,
    { type, optional = false, fillable = true }: AttributeOptions,
  ) {
    if (type === undefined) {
      type = 'undefined';
    }

    this.name = name;
    this.type = type;
    this.optional = optional;
    this.fillable = fillable;
  }

  public readonly name: string;
  public readonly type: Typeof | Function;
  public readonly optional: boolean;
  public readonly fillable: boolean;

  private static readonly initializedModels: Set<Function> = new Set();

  public static set<T extends Function>(
    model: T,
    property: string,
    attribute: ModelAttribute,
  ): void {
    let attributes: Map<string, ModelAttribute> =
      (Reflect.getMetadata(attributesMetadataKey, model) as
        | Map<string, ModelAttribute>
        | undefined) ?? new Map<string, ModelAttribute>();

    const isInitialized = this.initializedModels.has(model);

    if (!isInitialized || attributes === undefined) {
      // Copy attributes to prevent overriding base class prototype
      attributes = new Map(attributes);
    }

    attributes.set(property, attribute);

    Reflect.defineMetadata(attributesMetadataKey, attributes, model);
  }

  /**
   * Get a name -> `ModelAttribute` Map all model attributes.
   *
   * @param model The model to get attributes from.
   * @returns A map of model attributes.
   */
  private static get<T extends typeof Model>(
    model: T,
  ): Map<string, ModelAttribute> {
    return Reflect.getMetadata(attributesMetadataKey, model) as Map<
      string,
      ModelAttribute
    >;
  }

  /**
   * Get a list of all model attributes.
   *
   * @param model The model to get attributes from.
   * @returns An array of model attributes.
   */
  public static getFields<T extends typeof Model>(
    model: T,
  ): ModelAttribute[] | undefined {
    const attributes = this.get(model);

    return attributes !== undefined
      ? Array.from(attributes.values())
      : undefined;
  }

  /**
   * Get a list of all fillable model attributes.
   *
   * @param model The model to get attributes from.
   * @returns An array of model attributes with `fillable: true`.
   */
  public static getFillable<T extends typeof Model>(
    model: T,
  ): ModelAttribute[] | undefined {
    const attributes = this.get(model);

    return attributes !== undefined
      ? Array.from(attributes.entries())
          .filter(([, attr]) => attr.fillable)
          .map(([, attr]) => attr)
      : undefined;
  }

  /**
   * Get a list of all required model attributes.
   *
   * @param model The model to get attributes from.
   * @returns An array of model fillable attributes with `optional: false`.
   */
  public static getRequired<T extends typeof Model>(
    model: T,
  ): ModelAttribute[] | undefined {
    const attributes = this.get(model);

    return attributes !== undefined
      ? Array.from(attributes.entries())
          .filter(([, attr]) => attr.fillable && !attr.optional)
          .map(([, attr]) => attr)
      : undefined;
  }
}
