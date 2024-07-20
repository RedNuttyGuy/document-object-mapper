import type { Model } from 'src/model/model.class';
import type { ModelAttributeOptions } from './model-attribute-options.interface';
import { ModelAttribute } from './model-attribute.class';

export const attributesMetadataKey = Symbol('model.attributes');

/**
 * Defines a property as a Serializable attribute
 */
export function Attribute(options?: ModelAttributeOptions) {
  return function (target: Model, propertyKey: string | symbol) {
    if (typeof propertyKey === 'symbol') {
      throw new Error(
        `Property '${propertyKey.description}' cannot be used as an attribute. Defining symbol properties as attributes is not supported`,
      );
    }

    const attributes: Map<string, ModelAttribute> =
      Reflect.getMetadata(attributesMetadataKey, target.constructor) ??
      new Map();

    const attribute: ModelAttribute = new ModelAttribute(propertyKey, {
      type:
        options?.type ??
        typeof Reflect.getMetadata('design:type', target, propertyKey)(),
      optional: options?.optional,
      fillable: options?.fillable ?? true,
    });

    attributes.set(propertyKey, attribute);

    Reflect.defineMetadata(
      attributesMetadataKey,
      attributes,
      target.constructor,
    );
  };
}
