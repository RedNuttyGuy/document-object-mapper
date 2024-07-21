import type { Typeof } from '../types/typeof.type';

/**
 * Options for a model attribute.
 */
export interface AttributeOptions {
  /**
   * The type of the attribute. Can be a class or a primitive type.
   *
   * @example `'string'`, `'number'`, `'boolean'`, `'object'`, `'array'`, `CustomClass`
   */
  type?: Typeof | Function;
  /**
   * Whether the attribute is optional.
   *
   * If `true`, the attribute will not be required when creating a new model instance.
   */
  optional?: boolean;
  /**
   * Whether the attribute is fillable.
   *
   * If `true`, the attribute can be filled using the `fill` method, otherwise it will be ignored while filling the model.
   */
  fillable?: boolean;
}
