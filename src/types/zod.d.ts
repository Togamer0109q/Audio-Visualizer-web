declare module 'zod' {
  interface Issue { message: string }
  interface ParseError { issues: Issue[] }
  interface ParseSuccess<T> { success: true; data: T }
  interface ParseFailure { success: false; error: ParseError }
  interface ZodString { trim(): ZodString; min(value: number): ZodString; url(): ZodString; max(value: number): ZodString; refine(check: (value: string) => boolean, message: string): ZodString; regex(regex: RegExp, message: string): ZodString; }
  interface ZodEnum<T extends string> { optional(): ZodEnum<T | undefined>; default(value: Exclude<T, undefined>): ZodEnum<Exclude<T, undefined>> }
  interface ZodSchema<T> { safeParse(value: unknown): ParseSuccess<T> | ParseFailure }
  type InferShape<T> = { [K in keyof T]: T[K] extends ZodString ? string : T[K] extends ZodEnum<infer U> ? U : never };
  export const z: {
    string(): ZodString;
    enum<T extends readonly [string, ...string[]]>(values: T): ZodEnum<T[number]>;
    object<T extends Record<string, ZodString | ZodEnum<string | undefined>>>(shape: T): ZodSchema<InferShape<T>>;
  };
}
