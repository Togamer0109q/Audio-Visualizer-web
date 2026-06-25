export interface VercelRequest {
  method?: string;
  body?: unknown;
  headers: { [key: string]: string | string[] | undefined };
  socket: { remoteAddress?: string };
}

export interface VercelResponse {
  status(statusCode: number): VercelResponse;
  json(body: unknown): void;
}
