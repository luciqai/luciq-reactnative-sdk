import FakeRequest from '../mocks/fakeNetworkRequest';

import nock from 'nock';
import waitForExpect from 'wait-for-expect';

import LuciqConstants from '../../src/utils/LuciqConstants';
import Interceptor, { injectHeaders } from '../../src/utils/XhrNetworkInterceptor';

const url = 'http://api.luciq.ai';
const method = 'GET';

const request = nock(url).get('/');
const postRequest = nock(url).post('/');

describe('Network Interceptor', () => {
  beforeEach(() => {
    nock.cleanAll();
  });

  afterEach(() => {
    Interceptor.disableInterception();
  });

  it('should set network object on entering XMLHttpRequest.prototype.open', (done) => {
    Interceptor.enableInterception();
    Interceptor.setOnDoneCallback((network) => {
      expect(network.url).toEqual(url);
      expect(network.method).toEqual(method);
      done();
    });
    FakeRequest.mockResponse(request);
    FakeRequest.open(method, url);
    FakeRequest.send();
  });

  it('should keep patched XMLHttpRequest methods', () => {
    Interceptor.disableInterception();

    // Patch XMLHttpRequest.open
    const originalXHROpen = XMLHttpRequest.prototype.open;
    const patchedCode = jest.fn();
    XMLHttpRequest.prototype.open = function (...args: Parameters<XMLHttpRequest['open']>) {
      patchedCode();
      originalXHROpen.apply(this, args);
    };

    // Enable and disable network interception to see if disabling network interception
    // keeps the patched XMLHttpRequest methods
    Interceptor.enableInterception();
    Interceptor.disableInterception();

    FakeRequest.open(method, url);

    expect(patchedCode).toHaveBeenCalledTimes(1);

    XMLHttpRequest.prototype.open = originalXHROpen;
  });

  it('should set network object on calling setRequestHeader', (done) => {
    const requestHeaders = { 'content-type': 'application/json', token: '9u4hiudhi3bf' };

    Interceptor.enableInterception();
    Interceptor.setOnDoneCallback((network) => {
      expect(network.requestHeaders).toEqual(requestHeaders);
      done();
    });
    FakeRequest.open(method, url);
    FakeRequest.mockResponse(request);
    FakeRequest.setRequestHeaders(requestHeaders);
    FakeRequest.send();
  });

  it('should stringify header value if not string on calling setRequestHeader', async () => {
    const requestHeaders = { id: 10 };
    const callback = jest.fn();

    Interceptor.enableInterception();
    Interceptor.setOnDoneCallback(callback);
    FakeRequest.open(method, url);
    FakeRequest.mockResponse(request);
    // @ts-ignore
    FakeRequest.setRequestHeaders(requestHeaders);
    FakeRequest.send();

    await waitForExpect(() => {
      expect(callback).toBeCalledWith(
        expect.objectContaining({
          requestHeaders: { id: '10' },
        }),
      );
    });
  });

  it('should set requestBody in network object', (done) => {
    const requestBody = JSON.stringify({ data: [{ item: 'first' }, { item: 'second' }] });
    Interceptor.enableInterception();
    Interceptor.setOnDoneCallback((network) => {
      expect(network.requestBody).toBe(requestBody);
      done();
    });
    FakeRequest.mockResponse(postRequest);
    FakeRequest.open('POST', url);
    FakeRequest.send(requestBody);
  });

  it('should stringify requestBody in network object', (done) => {
    const requestBody = Buffer.from('Luciq');
    Interceptor.enableInterception();
    Interceptor.setOnDoneCallback((network) => {
      expect(network.requestBody).toBe(JSON.stringify(requestBody));
      done();
    });
    FakeRequest.mockResponse(postRequest);
    FakeRequest.open('POST', url);
    FakeRequest.send(requestBody);
  });

  it('should set contentType in network object on receiving response', (done) => {
    const headers = { 'Content-type': 'application/json' };
    Interceptor.enableInterception();
    Interceptor.setOnDoneCallback((network) => {
      expect(network.contentType).toEqual(headers['Content-type']);
      done();
    });
    FakeRequest.mockResponse(request, 200, 'ok', headers);
    FakeRequest.open(method, url);
    FakeRequest.send();
  });

  it('should set responseHeaders in network object on receiving response', (done) => {
    const headers = {
      'Content-type': 'application/json',
      Accept: 'text/html',
      'Content-Length': 144,
    };
    Interceptor.enableInterception();
    Interceptor.setOnDoneCallback((network) => {
      expect(network.responseHeaders['content-type'].trim()).toEqual(headers['Content-type']);
      expect(network.responseHeaders.accept.trim()).toEqual(headers.Accept);
      done();
    });
    // @ts-ignore
    FakeRequest.mockResponse(request, 200, 'ok', headers);
    FakeRequest.open(method, url);
    FakeRequest.send();
  });

  it('should set responseCode in network object on receiving response', (done) => {
    const status = 200;
    Interceptor.enableInterception();
    Interceptor.setOnDoneCallback((network) => {
      expect(network.responseCode).toEqual(status);
      done();
    });
    FakeRequest.mockResponse(request, status);
    FakeRequest.open(method, url);
    FakeRequest.send();
  });

  it("should set network object's responseCode to 0 if status is null on receiving response", async () => {
    const callback = jest.fn();

    Interceptor.enableInterception();
    Interceptor.setOnDoneCallback(callback);
    FakeRequest.mockResponse(request);
    FakeRequest.open(method, 'https://non-existing-website.com');
    FakeRequest.mockXHRStatus(null);
    FakeRequest.send();

    await waitForExpect(() => {
      expect(callback).toBeCalledWith(expect.objectContaining({ responseCode: 0 }));
    });
  });

  it('should set responseBody in network object on receiving response', (done) => {
    const responseBody = { data: [{ item: 'first' }, { item: 'second' }] };
    Interceptor.enableInterception();
    Interceptor.setOnDoneCallback((network) => {
      expect(network.responseBody).toEqual(JSON.stringify(responseBody));
      done();
    });
    FakeRequest.open(method, url);
    FakeRequest.mockResponse(request, 200, JSON.stringify(responseBody));
    FakeRequest.setResponseType('json');
    FakeRequest.send();
  });

  it('should set blob responseBody in network object on receiving response', async () => {
    const callback = jest.fn();
    const responseBody = Buffer.from('blob-content');

    Interceptor.enableInterception();
    Interceptor.setOnDoneCallback(callback);
    FakeRequest.open(method, url);
    FakeRequest.mockResponse(request, 200, responseBody);
    FakeRequest.setResponseType('blob');
    FakeRequest.send();

    await waitForExpect(() => {
      expect(callback).toBeCalledWith(expect.objectContaining({ responseBody: 'blob-content' }));
    });
  });

  it('should call onProgressCallback in network object on receiving response', (done) => {
    Interceptor.enableInterception();
    Interceptor.setOnProgressCallback((total, expectedToSend) => {
      expect(total).not.toBeNaN();
      expect(expectedToSend).not.toBeNaN();
      done();
    });

    // @ts-ignore
    FakeRequest.mockResponse(request, 200, 'ok', { 'Content-Length': 100 });
    FakeRequest.open(method, url);
    FakeRequest.send();
  });

  it('should call onDoneCallback in network object on receiving response', () => {
    Interceptor.disableInterception();
    const callback = jest.fn();
    Interceptor.setOnDoneCallback(callback);
    FakeRequest.mockResponse(request);
    FakeRequest.open(method, url);
    FakeRequest.send();
    expect(callback).not.toHaveBeenCalled();
  });

  it('should set error details in network object on client error', async () => {
    const callback = jest.fn();

    Interceptor.enableInterception();
    Interceptor.setOnDoneCallback(callback);
    FakeRequest.mockResponse(request);
    FakeRequest.open(method, url);
    FakeRequest.mockHasError();
    FakeRequest.send();

    await waitForExpect(() => {
      expect(callback).toBeCalledWith(
        expect.objectContaining({
          errorDomain: 'ClientError',
          errorCode: 9876,
          responseBody: 'ERROR: ClientError',
        }),
      );
    });
  });

  it('should set gqlQueryName in network object on receiving response', (done) => {
    const responseBody = { data: [{ item: 'first' }, { item: 'second' }] };
    const headers = {
      [LuciqConstants.GRAPHQL_HEADER]: LuciqConstants.GRAPHQL_HEADER,
    };

    Interceptor.enableInterception();
    Interceptor.setOnDoneCallback((network) => {
      expect(network.gqlQueryName).toEqual(headers[LuciqConstants.GRAPHQL_HEADER]);
      done();
    });
    FakeRequest.open(method, url);
    FakeRequest.mockResponse(request, 200, JSON.stringify(responseBody));
    FakeRequest.setRequestHeaders(headers);
    FakeRequest.send();
  });

  it('should set gqlQueryName in network object on receiving response with empty string', (done) => {
    const headers = {
      [LuciqConstants.GRAPHQL_HEADER]: 'null',
    };

    Interceptor.enableInterception();
    Interceptor.setOnDoneCallback((network) => {
      expect(network.gqlQueryName).toEqual('');
      done();
    });
    FakeRequest.open(method, url);
    FakeRequest.mockResponse(request);
    FakeRequest.setRequestHeaders(headers);
    FakeRequest.send();
  });

  it('should set serverErrorMessage in network object on receiving response', (done) => {
    const responseBody = { errors: [{ item: 'first' }, { item: 'second' }] };
    const headers = {
      [LuciqConstants.GRAPHQL_HEADER]: LuciqConstants.GRAPHQL_HEADER,
    };

    Interceptor.enableInterception();
    Interceptor.setOnDoneCallback((network) => {
      expect(network.serverErrorMessage).toEqual('GraphQLError');
      done();
    });
    FakeRequest.open(method, url);
    FakeRequest.setRequestHeaders(headers);
    FakeRequest.mockResponse(request, 200, JSON.stringify(responseBody));
    FakeRequest.setResponseType('json');
    FakeRequest.send();
  });
});

describe('Network Interceptor W3C Headers', () => {
  beforeEach(() => {
    nock.cleanAll();
  });

  it('should attach generated header if all flags are enabled on no header found', (done) => {
    const featureFlags = {
      isW3cExternalTraceIDEnabled: true,
      isW3cExternalGeneratedHeaderEnabled: true,
      isW3cCaughtHeaderEnabled: true,
    };
    Interceptor.enableInterception();
    Interceptor.setOnDoneCallback((network) => {
      injectHeaders(network, featureFlags);
      expect(network.isW3cHeaderFound).toBe(false);
      expect(network.partialId).not.toBe(null);
      expect(network.networkStartTimeInSeconds).toEqual(Math.floor(network.startTime / 1000));
      expect(network.w3cGeneratedHeader).toHaveLength(55);
      expect(network.w3cCaughtHeader).toBe(null);
    });
    done();
    FakeRequest.mockResponse(request);
    FakeRequest.open(method, url);
    FakeRequest.send();
  });
  it('should attach generated header if key flag & generated header flags are enabled on no header found', (done) => {
    const featureFlags = {
      isW3cExternalTraceIDEnabled: true,
      isW3cExternalGeneratedHeaderEnabled: true,
      isW3cCaughtHeaderEnabled: false,
    };
    Interceptor.enableInterception();
    Interceptor.setOnDoneCallback((network) => {
      injectHeaders(network, featureFlags);
      expect(network.isW3cHeaderFound).toBe(false);
      expect(network.partialId).not.toBe(null);
      expect(network.networkStartTimeInSeconds).toEqual(Math.floor(network.startTime / 1000));
      expect(network.w3cGeneratedHeader).toHaveLength(55);
      expect(network.w3cCaughtHeader).toBe(null);
    });
    done();
    FakeRequest.mockResponse(request);
    FakeRequest.open(method, url);
    FakeRequest.send();
  });

  it('should not attach headers when key flag is disabled & generated, caught header flags are enabled', (done) => {
    const featureFlags = {
      isW3cExternalTraceIDEnabled: false,
      isW3cExternalGeneratedHeaderEnabled: true,
      isW3cCaughtHeaderEnabled: true,
    };
    Interceptor.enableInterception();
    Interceptor.setOnDoneCallback((network) => {
      injectHeaders(network, featureFlags);
      expect(network.isW3cHeaderFound).toBe(null);
      expect(network.partialId).toBe(null);
      expect(network.networkStartTimeInSeconds).toBe(null);
      expect(network.w3cGeneratedHeader).toBe(null);
      expect(network.w3cCaughtHeader).toBe(null);
      expect(network.requestHeaders).not.toHaveProperty('traceparent');

      done();
    });
    FakeRequest.mockResponse(request);
    FakeRequest.open(method, url);
    FakeRequest.send();
  });
  it('should not attach headers when all feature flags are disabled', (done) => {
    const featureFlags = {
      isW3cExternalTraceIDEnabled: false,
      isW3cExternalGeneratedHeaderEnabled: false,
      isW3cCaughtHeaderEnabled: false,
    };
    Interceptor.enableInterception();
    Interceptor.setOnDoneCallback((network) => {
      injectHeaders(network, featureFlags);
      expect(network.isW3cHeaderFound).toBe(null);
      expect(network.partialId).toBe(null);
      expect(network.networkStartTimeInSeconds).toBe(null);
      expect(network.w3cGeneratedHeader).toBe(null);
      expect(network.w3cCaughtHeader).toBe(null);
      expect(network.requestHeaders).not.toHaveProperty('traceparent');

      done();
    });
    FakeRequest.mockResponse(request);
    FakeRequest.open(method, url);
    FakeRequest.send();
  });
  it('should not attach headers when key & caught header flags are disabled and generated header flag is enabled', (done) => {
    const featureFlags = {
      isW3cExternalTraceIDEnabled: false,
      isW3cExternalGeneratedHeaderEnabled: true,
      isW3cCaughtHeaderEnabled: false,
    };
    Interceptor.enableInterception();
    Interceptor.setOnDoneCallback((network) => {
      injectHeaders(network, featureFlags);
      expect(network.isW3cHeaderFound).toBe(null);
      expect(network.partialId).toBe(null);
      expect(network.networkStartTimeInSeconds).toBe(null);
      expect(network.w3cGeneratedHeader).toBe(null);
      expect(network.w3cCaughtHeader).toBe(null);
      expect(network.requestHeaders).not.toHaveProperty('traceparent');
      done();
    });
    FakeRequest.mockResponse(request);
    FakeRequest.open(method, url);
    FakeRequest.send();
  });
  it('should not attach headers when key & generated header flags are disabled and caught header flag is enabled', (done) => {
    const featureFlags = {
      isW3cExternalTraceIDEnabled: false,
      isW3cExternalGeneratedHeaderEnabled: false,
      isW3cCaughtHeaderEnabled: true,
    };
    Interceptor.enableInterception();
    Interceptor.setOnDoneCallback((network) => {
      injectHeaders(network, featureFlags);
      expect(network.isW3cHeaderFound).toBe(null);
      expect(network.partialId).toBe(null);
      expect(network.networkStartTimeInSeconds).toBe(null);
      expect(network.w3cGeneratedHeader).toBe(null);
      expect(network.w3cCaughtHeader).toBe(null);
      expect(network.requestHeaders).not.toHaveProperty('traceparent');
      done();
    });
    FakeRequest.mockResponse(request);
    FakeRequest.open(method, url);
    FakeRequest.send();
  });
  it('should not attach headers when key flag is enabled & generated, caught header flags are disabled on header found', (done) => {
    const featureFlags = {
      isW3cExternalTraceIDEnabled: true,
      isW3cExternalGeneratedHeaderEnabled: false,
      isW3cCaughtHeaderEnabled: false,
    };
    Interceptor.enableInterception();
    Interceptor.setOnDoneCallback((network) => {
      network.requestHeaders.traceparent = 'caught traceparent header';
      injectHeaders(network, featureFlags);
      expect(network.isW3cHeaderFound).toEqual(true);
      expect(network.partialId).toBe(null);
      expect(network.networkStartTimeInSeconds).toBe(null);
      expect(network.w3cGeneratedHeader).toBe(null);
      expect(network.w3cCaughtHeader).toBe(null);
      done();
    });
    FakeRequest.mockResponse(request);
    FakeRequest.open(method, url);
    FakeRequest.send();
  });

  it('should attach caught header if all flags are enabled ', (done) => {
    const featureFlags = {
      isW3cExternalTraceIDEnabled: true,
      isW3cExternalGeneratedHeaderEnabled: true,
      isW3cCaughtHeaderEnabled: true,
    };
    Interceptor.enableInterception();
    Interceptor.setOnDoneCallback((network) => {
      network.requestHeaders.traceparent = 'caught traceparent header';
      injectHeaders(network, featureFlags);
      expect(network.isW3cHeaderFound).toBe(true);
      expect(network.partialId).toBe(null);
      expect(network.networkStartTimeInSeconds).toBe(null);
      expect(network.w3cGeneratedHeader).toBe(null);
      expect(network.w3cCaughtHeader).toBe('caught traceparent header');
      expect(network.requestHeaders).toHaveProperty('traceparent');
      done();
    });
    FakeRequest.mockResponse(request);
    FakeRequest.open(method, url);
    FakeRequest.send();
  });
  it('should attach caught header if key & caught header flags are enabled and generated header flag is disabled', (done) => {
    const featureFlags = {
      isW3cExternalTraceIDEnabled: true,
      isW3cExternalGeneratedHeaderEnabled: false,
      isW3cCaughtHeaderEnabled: true,
    };
    Interceptor.enableInterception();
    Interceptor.setOnDoneCallback((network) => {
      network.requestHeaders.traceparent = 'caught traceparent header';
      injectHeaders(network, featureFlags);
      expect(network.isW3cHeaderFound).toBe(true);
      expect(network.partialId).toBe(null);
      expect(network.networkStartTimeInSeconds).toBe(null);
      expect(network.w3cGeneratedHeader).toBe(null);
      expect(network.w3cCaughtHeader).toBe('caught traceparent header');
      expect(network.requestHeaders).toHaveProperty('traceparent');
      done();
    });
    FakeRequest.mockResponse(request);
    FakeRequest.open(method, url);
    FakeRequest.send();
  });

  it('should populate partialId and networkStartTimeInSeconds even when generated header flag is disabled', () => {
    const featureFlags = {
      isW3cExternalTraceIDEnabled: true,
      isW3cExternalGeneratedHeaderEnabled: false,
      isW3cCaughtHeaderEnabled: false,
    };

    const networkData = {
      url: 'http://test.com',
      method: 'GET',
      requestBody: '',
      requestBodySize: 0,
      responseBody: '',
      responseBodySize: 0,
      responseCode: 200,
      requestHeaders: {} as Record<string, string>,
      responseHeaders: {},
      contentType: '',
      errorDomain: '',
      errorCode: 0,
      startTime: Date.now(),
      duration: 0,
      serverErrorMessage: '',
      requestContentType: '',
      isW3cHeaderFound: null as boolean | null,
      partialId: null as number | null,
      networkStartTimeInSeconds: null as number | null,
      w3cGeneratedHeader: null as string | null,
      w3cCaughtHeader: null as string | null,
      id: '1',
    };

    const result = injectHeaders(networkData, featureFlags);

    expect(networkData.isW3cHeaderFound).toBe(false);
    expect(networkData.partialId).not.toBeNull();
    expect(networkData.networkStartTimeInSeconds).not.toBeNull();
    expect(networkData.w3cGeneratedHeader).toBeNull();
    expect(result).toBeUndefined();
  });
});

describe('Network Interceptor Edge Cases', () => {
  beforeEach(() => {
    nock.cleanAll();
    Interceptor.disableInterception();
  });

  it('should handle timeout error', async () => {
    const callback = jest.fn();
    Interceptor.enableInterception();
    Interceptor.setOnDoneCallback(callback);

    const xhr = new global.XMLHttpRequest();
    xhr.open('GET', url);
    // @ts-ignore
    xhr._timedOut = true;
    request.once().reply(200, 'ok');
    xhr.send();

    await waitForExpect(() => {
      expect(callback).toBeCalledWith(
        expect.objectContaining({
          errorDomain: 'timeout',
          errorCode: 9876,
          responseCode: 0,
          responseBody: 'ERROR: timeout',
        }),
      );
    });
  });

  it('should set empty responseBody when response is null and no error', async () => {
    const callback = jest.fn();
    Interceptor.enableInterception();
    Interceptor.setOnDoneCallback(callback);

    FakeRequest.mockResponse(request, 200, '');
    FakeRequest.open(method, url);
    FakeRequest.send();

    await waitForExpect(() => {
      expect(callback).toBeCalledWith(
        expect.objectContaining({
          contentType: 'text/plain',
        }),
      );
    });
  });

  it('should not call onDoneCallback if interception was disabled mid-request', async () => {
    const callback = jest.fn();
    Interceptor.enableInterception();
    Interceptor.setOnDoneCallback(callback);

    FakeRequest.open(method, url);
    FakeRequest.mockResponse(request);

    // Disable interception before the response
    Interceptor.disableInterception();

    FakeRequest.send();

    // The callback should not be called since interception is disabled
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(callback).not.toHaveBeenCalled();
  });

  it('should handle empty requestBody as empty string', async () => {
    const callback = jest.fn();
    Interceptor.enableInterception();
    Interceptor.setOnDoneCallback(callback);
    FakeRequest.mockResponse(postRequest);
    FakeRequest.open('POST', url);
    FakeRequest.send(null);

    await waitForExpect(() => {
      expect(callback).toBeCalledWith(
        expect.objectContaining({
          requestBody: '',
        }),
      );
    });
  });

  it('should not enable interception twice', () => {
    Interceptor.enableInterception();
    const openAfterFirstEnable = XMLHttpRequest.prototype.open;

    Interceptor.enableInterception();
    // Should be the same reference (not re-patched)
    expect(XMLHttpRequest.prototype.open).toBe(openAfterFirstEnable);

    Interceptor.disableInterception();
  });

  it('should set serverErrorMessage to empty string on JSON parse error', (done) => {
    const headers = {
      [LuciqConstants.GRAPHQL_HEADER]: 'TestQuery',
    };

    Interceptor.enableInterception();
    Interceptor.setOnDoneCallback((network) => {
      expect(network.serverErrorMessage).toEqual('');
      done();
    });
    FakeRequest.open(method, url);
    FakeRequest.mockResponse(request, 200, 'not-valid-json');
    FakeRequest.setRequestHeaders(headers);
    FakeRequest.send();
  });
});
