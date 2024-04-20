export type ThisConstructor<
  T extends { prototype: unknown } = { prototype: unknown },
> = T;
