declare module 'zod' {
  interface Issue { message: string }
  interface ParseError { issues: Issue[] }
  interface ParseSuccess<T> { success: true; data: T }
  interface ParseFailure { success: false; error: ParseError }
  interface ZodString { url(): ZodString; max(value: number): ZodString; refine(check: (value: string) => boolean, message: string): ZodString; regex(regex: RegExp, message: string): ZodString; }
  interface ZodSchema<T> { safeParse(value: unknown): ParseSuccess<T> | ParseFailure }
  export const z: { string(): ZodString; object<T extends Record<string, ZodString>>(shape: T): ZodSchema<{ [K in keyof T]: string }> };
}
