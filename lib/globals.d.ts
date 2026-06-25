declare const process: {
  env: Record<string, string | undefined>;
};

declare const Buffer: {
  from(input: string): { toString(encoding: 'base64'): string };
};
