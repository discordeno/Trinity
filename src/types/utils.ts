export type NotAny<T> = 0 extends 1 & T ? never : T;

export type Optionalize<T extends any> = Id<
    {
        [K in KeysWithUndefined<T>]?: T[K];
    } & {
        [K in Exclude<keyof T, KeysWithUndefined<T>>]: T[K];
    }
>;

type Id<T> = T extends infer U
    ? {
          [K in keyof U]: U[K];
      }
    : never;

type KeysWithUndefined<T> = {
    [K in keyof T]-?: undefined extends T[K] ? K : null extends T[K] ? K : never;
}[keyof T];

export type MergeArrays<T, U extends any[]> = T extends any[] ? [...T, ...U] : U;
