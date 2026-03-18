import type { Interceptor, ReplyHeaders } from 'nock';

let xhr: XMLHttpRequest;

export interface FakeRequestInstance {
  xhr: XMLHttpRequest;
  open(method: string, url: string): void;
  send(data?: any): void;
  setRequestHeaders(headers: Record<string, string>): void;
  setResponseType(type: XMLHttpRequestResponseType): void;
  mockHasError(): void;
  mockXHRStatus(status: number | null): void;
  mockResponse(
    request: Interceptor,
    status?: number,
    body?: string | Buffer,
    headers?: ReplyHeaders,
  ): void;
  abort(): void;
}

export function createRequest(): FakeRequestInstance {
  const instance: FakeRequestInstance = {
    xhr: null as unknown as XMLHttpRequest,
    open(method: string, url: string) {
      instance.xhr = new global.XMLHttpRequest();
      instance.xhr.open(method, url);
    },
    send(data?: any) {
      instance.xhr.send(data);
    },
    setRequestHeaders(headers: Record<string, string>) {
      for (let i = 0; i < Object.keys(headers).length; i++) {
        const key = Object.keys(headers)[i];
        instance.xhr.setRequestHeader(key, headers[key]);
      }
    },
    setResponseType(type: XMLHttpRequestResponseType) {
      instance.xhr.responseType = type;
    },
    mockHasError() {
      // @ts-ignore
      instance.xhr._hasError = true;
    },
    mockXHRStatus(status: number | null) {
      // @ts-ignore
      instance.xhr.status = status;
    },
    mockResponse(
      request: Interceptor,
      status: number = 200,
      body: string | Buffer = 'ok',
      headers: ReplyHeaders = {},
    ) {
      request.once().reply(status, body, headers);
    },
    abort() {
      instance.xhr.abort();
    },
  };
  return instance;
}

export default {
  open(method: string, url: string) {
    xhr = new global.XMLHttpRequest();
    xhr.open(method, url);
  },
  send(data?: any) {
    xhr.send(data);
  },
  setRequestHeaders(headers: Record<string, string>) {
    for (let i = 0; i < Object.keys(headers).length; i++) {
      const key = Object.keys(headers)[i];
      xhr.setRequestHeader(key, headers[key]);
    }
  },
  setResponseType(type: XMLHttpRequestResponseType) {
    xhr.responseType = type;
  },
  mockHasError() {
    // @ts-ignore
    xhr._hasError = true;
  },
  mockXHRStatus(status: number | null) {
    // @ts-ignore
    xhr.status = status;
  },
  mockResponse(
    request: Interceptor,
    status: number = 200,
    body: string | Buffer = 'ok',
    headers: ReplyHeaders = {},
  ) {
    request.once().reply(status, body, headers);
  },
  abort() {
    xhr.abort();
  },
};
