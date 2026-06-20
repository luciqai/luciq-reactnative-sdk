import LuciqConstants from './LuciqConstants';
import { stringifyIfNotString, generateW3CHeader, redactUrlForLog } from './LuciqUtils';

import { getCachedW3cFlags } from './FeatureFlags';
import { Logger } from './logger';
import { LuciqDebugTags } from '../constants/DebugTags';

const TAG = LuciqDebugTags.NETWORK;

export type ProgressCallback = (totalBytesSent: number, totalBytesExpectedToSend: number) => void;
export type NetworkDataCallback = (data: NetworkData) => void;

export interface NetworkData {
  readonly id: string;
  url: string;
  method: string;
  requestBody: string;
  requestBodySize: number;
  responseBody: string | null;
  responseBodySize: number;
  responseCode: number;
  requestHeaders: Record<string, string>;
  responseHeaders: Record<string, string>;
  contentType: string;
  errorDomain: string;
  errorCode: number;
  startTime: number;
  duration: number;
  gqlQueryName?: string;
  serverErrorMessage: string;
  requestContentType: string;
  isW3cHeaderFound: boolean | null;
  partialId: number | null;
  networkStartTimeInSeconds: number | null;
  w3cGeneratedHeader: string | null;
  w3cCaughtHeader: string | null;
}

const XMLHttpRequest = global.XMLHttpRequest;
let originalXHROpen = XMLHttpRequest.prototype.open;
let originalXHRSend = XMLHttpRequest.prototype.send;
let originalXHRSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;

let onProgressCallback: ProgressCallback | null;
let onDoneCallback: NetworkDataCallback | null;
let isInterceptorEnabled = false;

const networkMap = new WeakMap<XMLHttpRequest, NetworkData>();

const createNetworkData = (): NetworkData => ({
  id: '',
  url: '',
  method: '',
  requestBody: '',
  requestBodySize: 0,
  responseBody: '',
  responseBodySize: 0,
  responseCode: 0,
  requestHeaders: {},
  responseHeaders: {},
  contentType: '',
  errorDomain: '',
  errorCode: 0,
  startTime: 0,
  duration: 0,
  gqlQueryName: '',
  serverErrorMessage: '',
  requestContentType: '',
  isW3cHeaderFound: null,
  partialId: null,
  networkStartTimeInSeconds: null,
  w3cGeneratedHeader: null,
  w3cCaughtHeader: null,
});

const getTraceparentHeader = (networkData: NetworkData) => {
  const {
    isW3cExternalTraceIDEnabled,
    isW3cExternalGeneratedHeaderEnabled,
    isW3cCaughtHeaderEnabled,
  } = getCachedW3cFlags();

  return injectHeaders(networkData, {
    isW3cExternalTraceIDEnabled,
    isW3cExternalGeneratedHeaderEnabled,
    isW3cCaughtHeaderEnabled,
  });
};

export const injectHeaders = (
  networkData: NetworkData,
  featureFlags: {
    isW3cExternalTraceIDEnabled: boolean;
    isW3cExternalGeneratedHeaderEnabled: boolean;
    isW3cCaughtHeaderEnabled: boolean;
  },
) => {
  const {
    isW3cExternalTraceIDEnabled,
    isW3cExternalGeneratedHeaderEnabled,
    isW3cCaughtHeaderEnabled,
  } = featureFlags;

  if (!isW3cExternalTraceIDEnabled) {
    return;
  }

  const isHeaderFound = networkData.requestHeaders.traceparent != null;

  networkData.isW3cHeaderFound = isHeaderFound;

  const injectionMethodology = isHeaderFound
    ? identifyCaughtHeader(networkData, isW3cCaughtHeaderEnabled)
    : injectGeneratedData(networkData, isW3cExternalGeneratedHeaderEnabled);
  return injectionMethodology;
};

const identifyCaughtHeader = (networkData: NetworkData, isW3cCaughtHeaderEnabled: boolean) => {
  if (isW3cCaughtHeaderEnabled) {
    networkData.w3cCaughtHeader = networkData.requestHeaders.traceparent;
    return networkData.requestHeaders.traceparent;
  }
  return;
};

const injectGeneratedData = (
  networkData: NetworkData,
  isW3cExternalGeneratedHeaderEnabled: boolean,
) => {
  const { timestampInSeconds, partialId, w3cHeader } = generateW3CHeader(networkData.startTime);
  networkData.partialId = partialId;
  networkData.networkStartTimeInSeconds = timestampInSeconds;

  if (isW3cExternalGeneratedHeaderEnabled) {
    networkData.w3cGeneratedHeader = w3cHeader;
    return w3cHeader;
  }

  return;
};

export default {
  setOnDoneCallback(callback: NetworkDataCallback) {
    onDoneCallback = callback;
  },
  setOnProgressCallback(callback: ProgressCallback) {
    onProgressCallback = callback;
  },
  enableInterception() {
    if (isInterceptorEnabled) {
      Logger.debug(TAG, 'enableInterception called but already enabled, skipping');
      return;
    }

    Logger.debug(TAG, 'enabling XHR network interception');

    originalXHROpen = XMLHttpRequest.prototype.open;
    originalXHRSend = XMLHttpRequest.prototype.send;
    originalXHRSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;
    // An error code that signifies an issue with the RN client.
    const clientErrorCode = 9876;
    XMLHttpRequest.prototype.open = function (method, url, ...args) {
      const networkData = createNetworkData();
      networkData.url = url;
      networkData.method = method;
      networkMap.set(this, networkData);
      if (Logger.isDebugEnabled()) {
        Logger.debug(TAG, 'xhr open', { method, url: redactUrlForLog(url) });
      }
      originalXHROpen.apply(this, [method, url, ...args]);
    };

    XMLHttpRequest.prototype.setRequestHeader = function (header, value) {
      const key = header.toLowerCase();
      const networkData = networkMap.get(this);
      if (networkData) {
        networkData.requestHeaders[key] = stringifyIfNotString(value);
      } else {
        Logger.debug(TAG, 'setRequestHeader: no networkData in WeakMap', {
          header: key,
          reason: 'open() was not intercepted',
        });
      }
      originalXHRSetRequestHeader.apply(this, [header, value]);
    };

    XMLHttpRequest.prototype.send = function (data) {
      const networkData = networkMap.get(this);
      if (!networkData) {
        Logger.debug(TAG, 'send: no networkData in WeakMap, falling back to original send', {
          reason: 'open() was not intercepted',
        });
        originalXHRSend.apply(this, [data]);
        return;
      }

      if (Logger.isDebugEnabled()) {
        Logger.debug(TAG, 'xhr send', {
          method: networkData.method,
          url: redactUrlForLog(networkData.url),
        });
      }

      const cloneNetwork = JSON.parse(JSON.stringify(networkData));
      cloneNetwork.requestBody = data ? data : '';

      if (typeof cloneNetwork.requestBody !== 'string') {
        cloneNetwork.requestBody = JSON.stringify(cloneNetwork.requestBody);
      }

      let isReported = false;

      if (this.addEventListener) {
        this.addEventListener('readystatechange', async () => {
          if (!isInterceptorEnabled) {
            Logger.debug(TAG, 'readystatechange ignored: interceptor disabled', {
              readyState: this.readyState,
              url: redactUrlForLog(cloneNetwork.url),
            });
            return;
          }
          if (isReported) {
            Logger.debug(TAG, 'readystatechange ignored: already reported', {
              readyState: this.readyState,
              url: redactUrlForLog(cloneNetwork.url),
            });
            return;
          }
          if (this.readyState === this.HEADERS_RECEIVED) {
            const contentTypeString = this.getResponseHeader('Content-Type');
            if (contentTypeString) {
              cloneNetwork.contentType = contentTypeString.split(';')[0];
            }
            const responseBodySizeString = this.getResponseHeader('Content-Length');
            if (responseBodySizeString) {
              const responseBodySizeNumber = Number(responseBodySizeString);

              if (!isNaN(responseBodySizeNumber)) {
                cloneNetwork.responseBodySize = responseBodySizeNumber;
              }
            }

            if (this.getAllResponseHeaders()) {
              const responseHeaders = this.getAllResponseHeaders().split('\r\n');
              const responseHeadersDictionary: Record<string, string> = {};
              responseHeaders.forEach((element) => {
                const key = element.split(/:(.+)/)[0];
                const value = element.split(/:(.+)/)[1];
                responseHeadersDictionary[key] = value;
              });

              cloneNetwork.responseHeaders = responseHeadersDictionary;
            }

            if (cloneNetwork.requestHeaders['content-type']) {
              cloneNetwork.requestContentType =
                cloneNetwork.requestHeaders['content-type'].split(';')[0];
            }

            Logger.debug(TAG, 'readystatechange: HEADERS_RECEIVED', {
              url: redactUrlForLog(cloneNetwork.url),
              contentType: cloneNetwork.contentType,
            });
          }

          if (this.readyState === this.DONE) {
            cloneNetwork.duration = Date.now() - cloneNetwork.startTime;
            if (this.status == null) {
              cloneNetwork.responseCode = 0;
            } else {
              cloneNetwork.responseCode = this.status;
            }

            // @ts-ignore
            if (this._hasError) {
              cloneNetwork.errorCode = clientErrorCode;
              cloneNetwork.errorDomain = 'ClientError';
              cloneNetwork.responseCode = 0;
              cloneNetwork.contentType = 'text/plain';
              // @ts-ignore
              const _response = this._response;
              cloneNetwork.requestBody =
                typeof _response === 'string' ? _response : JSON.stringify(_response);
              cloneNetwork.responseBody = '';

              if (typeof _response === 'string' && _response.length > 0) {
                cloneNetwork.errorDomain = _response;
              }

              cloneNetwork.responseBody = `ERROR: ${cloneNetwork.errorDomain}`;
              Logger.debug(TAG, 'readystatechange: DONE with client error', {
                url: redactUrlForLog(cloneNetwork.url),
                errorDomain: cloneNetwork.errorDomain,
              });

              // @ts-ignore
            } else if (this._timedOut) {
              cloneNetwork.errorCode = clientErrorCode;
              cloneNetwork.errorDomain = 'timeout';
              cloneNetwork.responseCode = 0;
              cloneNetwork.contentType = 'text/plain';
              cloneNetwork.responseBody = `ERROR: ${cloneNetwork.errorDomain}`;
              Logger.debug(TAG, 'readystatechange: DONE with timeout', {
                url: redactUrlForLog(cloneNetwork.url),
              });
            }

            // Only set response body if not already set by error handlers
            if (!cloneNetwork.errorDomain) {
              if (this.response) {
                if (this.responseType === 'blob') {
                  const responseText = await new Response(this.response).text();
                  cloneNetwork.responseBody = responseText;
                } else if (['text', '', 'json'].includes(this.responseType)) {
                  cloneNetwork.responseBody = JSON.stringify(this.response);
                }
              } else {
                cloneNetwork.responseBody = '';
                cloneNetwork.contentType = 'text/plain';
              }
            }

            cloneNetwork.requestBodySize = cloneNetwork.requestBody.length;

            if (cloneNetwork.responseBodySize === 0 && cloneNetwork.responseBody) {
              cloneNetwork.responseBodySize = cloneNetwork.responseBody.length;
            }

            if (cloneNetwork.requestHeaders[LuciqConstants.GRAPHQL_HEADER]) {
              cloneNetwork.gqlQueryName =
                cloneNetwork.requestHeaders[LuciqConstants.GRAPHQL_HEADER];
              delete cloneNetwork.requestHeaders[LuciqConstants.GRAPHQL_HEADER];
              if (cloneNetwork.gqlQueryName === 'null') {
                cloneNetwork.gqlQueryName = '';
              }
              if (cloneNetwork.responseBody) {
                try {
                  const responseObj = JSON.parse(cloneNetwork.responseBody);

                  if (responseObj.errors) {
                    cloneNetwork.serverErrorMessage = 'GraphQLError';
                  } else {
                    cloneNetwork.serverErrorMessage = '';
                  }
                } catch (_error) {
                  cloneNetwork.serverErrorMessage = '';
                }
              }
            } else {
              delete cloneNetwork.gqlQueryName;
            }

            isReported = true;
            Logger.debug(TAG, 'readystatechange: DONE', {
              method: cloneNetwork.method,
              url: redactUrlForLog(cloneNetwork.url),
              status: cloneNetwork.responseCode,
              durationMs: cloneNetwork.duration,
              hasCallback: !!onDoneCallback,
            });
            if (onDoneCallback) {
              onDoneCallback(cloneNetwork);
            } else {
              Logger.warn(TAG, 'onDoneCallback is null, network log will be lost', {
                url: redactUrlForLog(cloneNetwork.url),
              });
            }
          }
        });

        const downloadUploadProgressCallback = (event: ProgressEvent) => {
          if (!isInterceptorEnabled) {
            return;
          }
          if (event.lengthComputable && onProgressCallback) {
            const totalBytesSent = event.loaded;
            const totalBytesExpectedToSend = event.total - event.loaded;
            onProgressCallback(totalBytesSent, totalBytesExpectedToSend);
          }
        };
        this.addEventListener('progress', downloadUploadProgressCallback);
        this.upload.addEventListener('progress', downloadUploadProgressCallback);

        this.addEventListener('abort', () => {
          if (!isInterceptorEnabled) {
            Logger.debug(TAG, 'abort ignored: interceptor disabled', {
              url: redactUrlForLog(cloneNetwork.url),
            });
            return;
          }
          if (isReported) {
            Logger.debug(TAG, 'abort ignored: already reported via DONE', {
              url: redactUrlForLog(cloneNetwork.url),
            });
            return;
          }
          isReported = true;
          cloneNetwork.duration = Date.now() - cloneNetwork.startTime;
          cloneNetwork.responseCode = 0;
          cloneNetwork.errorCode = clientErrorCode;
          cloneNetwork.errorDomain = 'cancelled';
          cloneNetwork.responseBody = `ERROR: ${cloneNetwork.errorDomain}`;
          Logger.debug(TAG, 'request cancelled (abort)', {
            method: cloneNetwork.method,
            url: redactUrlForLog(cloneNetwork.url),
            durationMs: cloneNetwork.duration,
            hasCallback: !!onDoneCallback,
          });
          if (onDoneCallback) {
            onDoneCallback(cloneNetwork);
          } else {
            Logger.warn(TAG, 'onDoneCallback is null, cancelled log will be lost', {
              url: redactUrlForLog(cloneNetwork.url),
            });
          }
        });
      }

      cloneNetwork.startTime = Date.now();
      const traceparent = getTraceparentHeader(cloneNetwork);
      if (traceparent) {
        this.setRequestHeader('Traceparent', traceparent);
        Logger.debug(TAG, 'injected traceparent header', {
          url: redactUrlForLog(cloneNetwork.url),
        });
      }

      originalXHRSend.apply(this, [data]);
    };
    isInterceptorEnabled = true;
    Logger.debug(TAG, 'XHR network interception enabled');
  },

  disableInterception() {
    Logger.debug(TAG, 'disabling XHR network interception');
    isInterceptorEnabled = false;
    XMLHttpRequest.prototype.send = originalXHRSend;
    XMLHttpRequest.prototype.open = originalXHROpen;
    XMLHttpRequest.prototype.setRequestHeader = originalXHRSetRequestHeader;
    onDoneCallback = null;
    onProgressCallback = null;
  },
};
