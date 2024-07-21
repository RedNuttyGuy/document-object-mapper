import { Model } from '../model/model.class';
import type { Typeof } from '../types/typeof.type';
import { attributesMetadataKey } from './attribute.decorator';
import { AttributeOptions } from './attribute-options.interface';

/**
 * Represents a model attribute.
 */
export class ModelAttribute {
  constructor(
    name: string,
    { type, optional = false, fillable = true }: AttributeOptions,
  ) {
    if (type === undefined) {
      type = 'undefined'
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

  /**
   * Get a name -> `ModelAttribute` Map all model attributes.
   *
   * @param model The model to get attributes from.
   * @returns A map of model attributes.
   */
  public static get<T extends typeof Model>(
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
  public static getFields<T extends typeof Model>(model: T): ModelAttribute[] {
    return Array.from(this.get(model).values());
  }

  /**
   * Get a list of all fillable model attributes.
   *
   * @param model The model to get attributes from.
   * @returns An array of model attributes with `fillable: true`.
   */
  public static getFillable<T extends typeof Model>(
    model: T,
  ): ModelAttribute[] {
    return Array.from(this.get(model).entries())
      .filter(([, attr]) => attr.fillable)
      .map(([, attr]) => attr);
  }

  /**
   * Get a list of all required model attributes.
   *
   * @param model The model to get attributes from.
   * @returns An array of model fillable attributes with `optional: false`.
   */
  public static getRequired<T extends typeof Model>(
    model: T,
  ): ModelAttribute[] {
    return Array.from(this.get(model).entries())
      .filter(([, attr]) => attr.fillable && !attr.optional)
      .map(([, attr]) => attr);
  }
}
