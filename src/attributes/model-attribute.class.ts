import { Model } from '../model/model.class';
import type { Typeof } from '../types/typeof.type';
import { attributesMetadataKey } from './attribute.decorator';
import { ModelAttributeOptions } from './model-attribute-options.interface';

export class ModelAttribute {
  constructor(
    name: string,
    { type, optional = false, fillable = true }: ModelAttributeOptions,
  ) {
    this.name = name;
    this.type = type;
    this.optional = optional;
    this.fillable = fillable;
  }

  public readonly name: string;
  public readonly type: Typeof | Function;
  public readonly optional: boolean;
  public readonly fillable: boolean;

  public static get<T extends typeof Model>(
    model: T,
  ): Map<string, ModelAttribute> {
    return Reflect.getMetadata(attributesMetadataKey, model) as Map<
      string,
      ModelAttribute
    >;
  }

  public static getFields<T extends typeof Model>(model: T): ModelAttribute[] {
    return Array.from(this.get(model).values());
  }

  public static getFillable<T extends typeof Model>(
    model: T,
  ): ModelAttribute[] {
    return Array.from(this.get(model).entries())
      .filter(([, attr]) => attr.fillable)
      .map(([, attr]) => attr);
  }

  public static getRequired<T extends typeof Model>(
    model: T,
  ): ModelAttribute[] {
    return Array.from(this.get(model).entries())
      .filter(([, attr]) => attr.fillable && !attr.optional)
      .map(([, attr]) => attr);
  }
}
