// Mock for express.Response type
export interface Response<Locals = Record<string, any>> {
  statusCode: number;
  statusMessage: string;
  setHeader(name: string, value: string | number | string[]): this;
  getHeader(name: string): string | string[] | number | undefined;
  removeHeader(name: string): this;
  send(body?: any): this;
  status(code: number): this;
  json(body?: any): this;
  end(): this;
  locals: Locals;
}
