import type { Model } from 'src/model/model.class';
import type { AttributeOptions } from './attribute-options.interface';
import { ModelAttribute } from './model-attribute.class';

export const attributesMetadataKey = Symbol('model.attributes');

/**
 * Defines a property as a serializable or deserializable attribute
 *
 * @param options - Options for the attribute.
 */
export function Attribute(options?: AttributeOptions) {
  return function (target: Model, propertyKey: string | symbol): void {
    if (typeof propertyKey === 'symbol') {
      throw new Error(
        `Property '${propertyKey.description}' cannot be used as an attribute. Defining symbol properties as attributes is not supported`,
      );
    }

    ModelAttribute.set(
      target.constructor,
      propertyKey,
      new ModelAttribute(propertyKey, {
        type:
          options?.type ??
          typeof (
            Reflect.getMetadata('design:type', target, propertyKey) as () => any
          )(),
        optional: options?.optional,
        fillable: options?.fillable ?? true,
      }),
    );
  };
}
