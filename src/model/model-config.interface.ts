export interface ModelConfig {
  /**
   * Whether the model should be stored in memory only.
   *
   * Useful when running tests or when you don't want to persist the data between application restarts.
   */
  inMemory: boolean;
  /**
   * The base directory where the model data should be stored. This should be an absolute path.
   */
  baseDirectory: string;
  /**
   * When set to `true`, the `fill` function will throw an error if it is called with properties that are not defined as model attributes.
   *
   * `'warn'` will log a warning instead of throwing an error.
   *
   * `false` will not throw any errors or warnings, but will still prevent the model from being filled with extra attributes.
   */
  preventFillingWithExtraAttributes: boolean | 'warn';
  /**
   * Serialization and deserialization functions to use for persisting and reading model data.
   *
   * If not provided, the model will use JSON serialization.
   *
   * These functions are used by `save`, `first`, and `find` methods when reading and writing data to the file system.
   *
   * Can be useful if external tools are used to read or write data, and only support specific formats.
   *
   * The serialize and deserialize functions should be the opposite of each other, otherwise data may not be read correctly or could be corrupted.
   */
  serialization: {
    serialize: (data: Record<string, any>) => string;
    deserialize: (data: string) => Record<string, any>;
  };
}
