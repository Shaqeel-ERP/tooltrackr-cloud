var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// ../../node_modules/hono/dist/compose.js
var compose = /* @__PURE__ */ __name((middleware, onError, onNotFound) => {
  return (context, next) => {
    let index = -1;
    return dispatch(0);
    async function dispatch(i) {
      if (i <= index) {
        throw new Error("next() called multiple times");
      }
      index = i;
      let res;
      let isError = false;
      let handler;
      if (middleware[i]) {
        handler = middleware[i][0][0];
        context.req.routeIndex = i;
      } else {
        handler = i === middleware.length && next || void 0;
      }
      if (handler) {
        try {
          res = await handler(context, () => dispatch(i + 1));
        } catch (err) {
          if (err instanceof Error && onError) {
            context.error = err;
            res = await onError(err, context);
            isError = true;
          } else {
            throw err;
          }
        }
      } else {
        if (context.finalized === false && onNotFound) {
          res = await onNotFound(context);
        }
      }
      if (res && (context.finalized === false || isError)) {
        context.res = res;
      }
      return context;
    }
    __name(dispatch, "dispatch");
  };
}, "compose");

// ../../node_modules/hono/dist/http-exception.js
var HTTPException = class extends Error {
  static {
    __name(this, "HTTPException");
  }
  res;
  status;
  /**
   * Creates an instance of `HTTPException`.
   * @param status - HTTP status code for the exception. Defaults to 500.
   * @param options - Additional options for the exception.
   */
  constructor(status = 500, options) {
    super(options?.message, { cause: options?.cause });
    this.res = options?.res;
    this.status = status;
  }
  /**
   * Returns the response object associated with the exception.
   * If a response object is not provided, a new response is created with the error message and status code.
   * @returns The response object.
   */
  getResponse() {
    if (this.res) {
      const newResponse = new Response(this.res.body, {
        status: this.status,
        headers: this.res.headers
      });
      return newResponse;
    }
    return new Response(this.message, {
      status: this.status
    });
  }
};

// ../../node_modules/hono/dist/request/constants.js
var GET_MATCH_RESULT = /* @__PURE__ */ Symbol();

// ../../node_modules/hono/dist/utils/body.js
var parseBody = /* @__PURE__ */ __name(async (request, options = /* @__PURE__ */ Object.create(null)) => {
  const { all = false, dot = false } = options;
  const headers = request instanceof HonoRequest ? request.raw.headers : request.headers;
  const contentType = headers.get("Content-Type");
  if (contentType?.startsWith("multipart/form-data") || contentType?.startsWith("application/x-www-form-urlencoded")) {
    return parseFormData(request, { all, dot });
  }
  return {};
}, "parseBody");
async function parseFormData(request, options) {
  const formData = await request.formData();
  if (formData) {
    return convertFormDataToBodyData(formData, options);
  }
  return {};
}
__name(parseFormData, "parseFormData");
function convertFormDataToBodyData(formData, options) {
  const form = /* @__PURE__ */ Object.create(null);
  formData.forEach((value, key) => {
    const shouldParseAllValues = options.all || key.endsWith("[]");
    if (!shouldParseAllValues) {
      form[key] = value;
    } else {
      handleParsingAllValues(form, key, value);
    }
  });
  if (options.dot) {
    Object.entries(form).forEach(([key, value]) => {
      const shouldParseDotValues = key.includes(".");
      if (shouldParseDotValues) {
        handleParsingNestedValues(form, key, value);
        delete form[key];
      }
    });
  }
  return form;
}
__name(convertFormDataToBodyData, "convertFormDataToBodyData");
var handleParsingAllValues = /* @__PURE__ */ __name((form, key, value) => {
  if (form[key] !== void 0) {
    if (Array.isArray(form[key])) {
      ;
      form[key].push(value);
    } else {
      form[key] = [form[key], value];
    }
  } else {
    if (!key.endsWith("[]")) {
      form[key] = value;
    } else {
      form[key] = [value];
    }
  }
}, "handleParsingAllValues");
var handleParsingNestedValues = /* @__PURE__ */ __name((form, key, value) => {
  let nestedForm = form;
  const keys = key.split(".");
  keys.forEach((key2, index) => {
    if (index === keys.length - 1) {
      nestedForm[key2] = value;
    } else {
      if (!nestedForm[key2] || typeof nestedForm[key2] !== "object" || Array.isArray(nestedForm[key2]) || nestedForm[key2] instanceof File) {
        nestedForm[key2] = /* @__PURE__ */ Object.create(null);
      }
      nestedForm = nestedForm[key2];
    }
  });
}, "handleParsingNestedValues");

// ../../node_modules/hono/dist/utils/url.js
var splitPath = /* @__PURE__ */ __name((path) => {
  const paths = path.split("/");
  if (paths[0] === "") {
    paths.shift();
  }
  return paths;
}, "splitPath");
var splitRoutingPath = /* @__PURE__ */ __name((routePath) => {
  const { groups, path } = extractGroupsFromPath(routePath);
  const paths = splitPath(path);
  return replaceGroupMarks(paths, groups);
}, "splitRoutingPath");
var extractGroupsFromPath = /* @__PURE__ */ __name((path) => {
  const groups = [];
  path = path.replace(/\{[^}]+\}/g, (match2, index) => {
    const mark = `@${index}`;
    groups.push([mark, match2]);
    return mark;
  });
  return { groups, path };
}, "extractGroupsFromPath");
var replaceGroupMarks = /* @__PURE__ */ __name((paths, groups) => {
  for (let i = groups.length - 1; i >= 0; i--) {
    const [mark] = groups[i];
    for (let j = paths.length - 1; j >= 0; j--) {
      if (paths[j].includes(mark)) {
        paths[j] = paths[j].replace(mark, groups[i][1]);
        break;
      }
    }
  }
  return paths;
}, "replaceGroupMarks");
var patternCache = {};
var getPattern = /* @__PURE__ */ __name((label, next) => {
  if (label === "*") {
    return "*";
  }
  const match2 = label.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
  if (match2) {
    const cacheKey = `${label}#${next}`;
    if (!patternCache[cacheKey]) {
      if (match2[2]) {
        patternCache[cacheKey] = next && next[0] !== ":" && next[0] !== "*" ? [cacheKey, match2[1], new RegExp(`^${match2[2]}(?=/${next})`)] : [label, match2[1], new RegExp(`^${match2[2]}$`)];
      } else {
        patternCache[cacheKey] = [label, match2[1], true];
      }
    }
    return patternCache[cacheKey];
  }
  return null;
}, "getPattern");
var tryDecode = /* @__PURE__ */ __name((str, decoder) => {
  try {
    return decoder(str);
  } catch {
    return str.replace(/(?:%[0-9A-Fa-f]{2})+/g, (match2) => {
      try {
        return decoder(match2);
      } catch {
        return match2;
      }
    });
  }
}, "tryDecode");
var tryDecodeURI = /* @__PURE__ */ __name((str) => tryDecode(str, decodeURI), "tryDecodeURI");
var getPath = /* @__PURE__ */ __name((request) => {
  const url = request.url;
  const start = url.indexOf("/", url.indexOf(":") + 4);
  let i = start;
  for (; i < url.length; i++) {
    const charCode = url.charCodeAt(i);
    if (charCode === 37) {
      const queryIndex = url.indexOf("?", i);
      const hashIndex = url.indexOf("#", i);
      const end = queryIndex === -1 ? hashIndex === -1 ? void 0 : hashIndex : hashIndex === -1 ? queryIndex : Math.min(queryIndex, hashIndex);
      const path = url.slice(start, end);
      return tryDecodeURI(path.includes("%25") ? path.replace(/%25/g, "%2525") : path);
    } else if (charCode === 63 || charCode === 35) {
      break;
    }
  }
  return url.slice(start, i);
}, "getPath");
var getPathNoStrict = /* @__PURE__ */ __name((request) => {
  const result = getPath(request);
  return result.length > 1 && result.at(-1) === "/" ? result.slice(0, -1) : result;
}, "getPathNoStrict");
var mergePath = /* @__PURE__ */ __name((base, sub, ...rest) => {
  if (rest.length) {
    sub = mergePath(sub, ...rest);
  }
  return `${base?.[0] === "/" ? "" : "/"}${base}${sub === "/" ? "" : `${base?.at(-1) === "/" ? "" : "/"}${sub?.[0] === "/" ? sub.slice(1) : sub}`}`;
}, "mergePath");
var checkOptionalParameter = /* @__PURE__ */ __name((path) => {
  if (path.charCodeAt(path.length - 1) !== 63 || !path.includes(":")) {
    return null;
  }
  const segments = path.split("/");
  const results = [];
  let basePath = "";
  segments.forEach((segment) => {
    if (segment !== "" && !/\:/.test(segment)) {
      basePath += "/" + segment;
    } else if (/\:/.test(segment)) {
      if (/\?/.test(segment)) {
        if (results.length === 0 && basePath === "") {
          results.push("/");
        } else {
          results.push(basePath);
        }
        const optionalSegment = segment.replace("?", "");
        basePath += "/" + optionalSegment;
        results.push(basePath);
      } else {
        basePath += "/" + segment;
      }
    }
  });
  return results.filter((v, i, a) => a.indexOf(v) === i);
}, "checkOptionalParameter");
var _decodeURI = /* @__PURE__ */ __name((value) => {
  if (!/[%+]/.test(value)) {
    return value;
  }
  if (value.indexOf("+") !== -1) {
    value = value.replace(/\+/g, " ");
  }
  return value.indexOf("%") !== -1 ? tryDecode(value, decodeURIComponent_) : value;
}, "_decodeURI");
var _getQueryParam = /* @__PURE__ */ __name((url, key, multiple) => {
  let encoded;
  if (!multiple && key && !/[%+]/.test(key)) {
    let keyIndex2 = url.indexOf("?", 8);
    if (keyIndex2 === -1) {
      return void 0;
    }
    if (!url.startsWith(key, keyIndex2 + 1)) {
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    while (keyIndex2 !== -1) {
      const trailingKeyCode = url.charCodeAt(keyIndex2 + key.length + 1);
      if (trailingKeyCode === 61) {
        const valueIndex = keyIndex2 + key.length + 2;
        const endIndex = url.indexOf("&", valueIndex);
        return _decodeURI(url.slice(valueIndex, endIndex === -1 ? void 0 : endIndex));
      } else if (trailingKeyCode == 38 || isNaN(trailingKeyCode)) {
        return "";
      }
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    encoded = /[%+]/.test(url);
    if (!encoded) {
      return void 0;
    }
  }
  const results = {};
  encoded ??= /[%+]/.test(url);
  let keyIndex = url.indexOf("?", 8);
  while (keyIndex !== -1) {
    const nextKeyIndex = url.indexOf("&", keyIndex + 1);
    let valueIndex = url.indexOf("=", keyIndex);
    if (valueIndex > nextKeyIndex && nextKeyIndex !== -1) {
      valueIndex = -1;
    }
    let name = url.slice(
      keyIndex + 1,
      valueIndex === -1 ? nextKeyIndex === -1 ? void 0 : nextKeyIndex : valueIndex
    );
    if (encoded) {
      name = _decodeURI(name);
    }
    keyIndex = nextKeyIndex;
    if (name === "") {
      continue;
    }
    let value;
    if (valueIndex === -1) {
      value = "";
    } else {
      value = url.slice(valueIndex + 1, nextKeyIndex === -1 ? void 0 : nextKeyIndex);
      if (encoded) {
        value = _decodeURI(value);
      }
    }
    if (multiple) {
      if (!(results[name] && Array.isArray(results[name]))) {
        results[name] = [];
      }
      ;
      results[name].push(value);
    } else {
      results[name] ??= value;
    }
  }
  return key ? results[key] : results;
}, "_getQueryParam");
var getQueryParam = _getQueryParam;
var getQueryParams = /* @__PURE__ */ __name((url, key) => {
  return _getQueryParam(url, key, true);
}, "getQueryParams");
var decodeURIComponent_ = decodeURIComponent;

// ../../node_modules/hono/dist/request.js
var tryDecodeURIComponent = /* @__PURE__ */ __name((str) => tryDecode(str, decodeURIComponent_), "tryDecodeURIComponent");
var HonoRequest = class {
  static {
    __name(this, "HonoRequest");
  }
  /**
   * `.raw` can get the raw Request object.
   *
   * @see {@link https://hono.dev/docs/api/request#raw}
   *
   * @example
   * ```ts
   * // For Cloudflare Workers
   * app.post('/', async (c) => {
   *   const metadata = c.req.raw.cf?.hostMetadata?
   *   ...
   * })
   * ```
   */
  raw;
  #validatedData;
  // Short name of validatedData
  #matchResult;
  routeIndex = 0;
  /**
   * `.path` can get the pathname of the request.
   *
   * @see {@link https://hono.dev/docs/api/request#path}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const pathname = c.req.path // `/about/me`
   * })
   * ```
   */
  path;
  bodyCache = {};
  constructor(request, path = "/", matchResult = [[]]) {
    this.raw = request;
    this.path = path;
    this.#matchResult = matchResult;
    this.#validatedData = {};
  }
  param(key) {
    return key ? this.#getDecodedParam(key) : this.#getAllDecodedParams();
  }
  #getDecodedParam(key) {
    const paramKey = this.#matchResult[0][this.routeIndex][1][key];
    const param = this.#getParamValue(paramKey);
    return param && /\%/.test(param) ? tryDecodeURIComponent(param) : param;
  }
  #getAllDecodedParams() {
    const decoded = {};
    const keys = Object.keys(this.#matchResult[0][this.routeIndex][1]);
    for (const key of keys) {
      const value = this.#getParamValue(this.#matchResult[0][this.routeIndex][1][key]);
      if (value !== void 0) {
        decoded[key] = /\%/.test(value) ? tryDecodeURIComponent(value) : value;
      }
    }
    return decoded;
  }
  #getParamValue(paramKey) {
    return this.#matchResult[1] ? this.#matchResult[1][paramKey] : paramKey;
  }
  query(key) {
    return getQueryParam(this.url, key);
  }
  queries(key) {
    return getQueryParams(this.url, key);
  }
  header(name) {
    if (name) {
      return this.raw.headers.get(name) ?? void 0;
    }
    const headerData = {};
    this.raw.headers.forEach((value, key) => {
      headerData[key] = value;
    });
    return headerData;
  }
  async parseBody(options) {
    return this.bodyCache.parsedBody ??= await parseBody(this, options);
  }
  #cachedBody = /* @__PURE__ */ __name((key) => {
    const { bodyCache, raw: raw2 } = this;
    const cachedBody = bodyCache[key];
    if (cachedBody) {
      return cachedBody;
    }
    const anyCachedKey = Object.keys(bodyCache)[0];
    if (anyCachedKey) {
      return bodyCache[anyCachedKey].then((body) => {
        if (anyCachedKey === "json") {
          body = JSON.stringify(body);
        }
        return new Response(body)[key]();
      });
    }
    return bodyCache[key] = raw2[key]();
  }, "#cachedBody");
  /**
   * `.json()` can parse Request body of type `application/json`
   *
   * @see {@link https://hono.dev/docs/api/request#json}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.json()
   * })
   * ```
   */
  json() {
    return this.#cachedBody("text").then((text) => JSON.parse(text));
  }
  /**
   * `.text()` can parse Request body of type `text/plain`
   *
   * @see {@link https://hono.dev/docs/api/request#text}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.text()
   * })
   * ```
   */
  text() {
    return this.#cachedBody("text");
  }
  /**
   * `.arrayBuffer()` parse Request body as an `ArrayBuffer`
   *
   * @see {@link https://hono.dev/docs/api/request#arraybuffer}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.arrayBuffer()
   * })
   * ```
   */
  arrayBuffer() {
    return this.#cachedBody("arrayBuffer");
  }
  /**
   * Parses the request body as a `Blob`.
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.blob();
   * });
   * ```
   * @see https://hono.dev/docs/api/request#blob
   */
  blob() {
    return this.#cachedBody("blob");
  }
  /**
   * Parses the request body as `FormData`.
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.formData();
   * });
   * ```
   * @see https://hono.dev/docs/api/request#formdata
   */
  formData() {
    return this.#cachedBody("formData");
  }
  /**
   * Adds validated data to the request.
   *
   * @param target - The target of the validation.
   * @param data - The validated data to add.
   */
  addValidatedData(target, data) {
    this.#validatedData[target] = data;
  }
  valid(target) {
    return this.#validatedData[target];
  }
  /**
   * `.url()` can get the request url strings.
   *
   * @see {@link https://hono.dev/docs/api/request#url}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const url = c.req.url // `http://localhost:8787/about/me`
   *   ...
   * })
   * ```
   */
  get url() {
    return this.raw.url;
  }
  /**
   * `.method()` can get the method name of the request.
   *
   * @see {@link https://hono.dev/docs/api/request#method}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const method = c.req.method // `GET`
   * })
   * ```
   */
  get method() {
    return this.raw.method;
  }
  get [GET_MATCH_RESULT]() {
    return this.#matchResult;
  }
  /**
   * `.matchedRoutes()` can return a matched route in the handler
   *
   * @deprecated
   *
   * Use matchedRoutes helper defined in "hono/route" instead.
   *
   * @see {@link https://hono.dev/docs/api/request#matchedroutes}
   *
   * @example
   * ```ts
   * app.use('*', async function logger(c, next) {
   *   await next()
   *   c.req.matchedRoutes.forEach(({ handler, method, path }, i) => {
   *     const name = handler.name || (handler.length < 2 ? '[handler]' : '[middleware]')
   *     console.log(
   *       method,
   *       ' ',
   *       path,
   *       ' '.repeat(Math.max(10 - path.length, 0)),
   *       name,
   *       i === c.req.routeIndex ? '<- respond from here' : ''
   *     )
   *   })
   * })
   * ```
   */
  get matchedRoutes() {
    return this.#matchResult[0].map(([[, route]]) => route);
  }
  /**
   * `routePath()` can retrieve the path registered within the handler
   *
   * @deprecated
   *
   * Use routePath helper defined in "hono/route" instead.
   *
   * @see {@link https://hono.dev/docs/api/request#routepath}
   *
   * @example
   * ```ts
   * app.get('/posts/:id', (c) => {
   *   return c.json({ path: c.req.routePath })
   * })
   * ```
   */
  get routePath() {
    return this.#matchResult[0].map(([[, route]]) => route)[this.routeIndex].path;
  }
};

// ../../node_modules/hono/dist/utils/html.js
var HtmlEscapedCallbackPhase = {
  Stringify: 1,
  BeforeStream: 2,
  Stream: 3
};
var raw = /* @__PURE__ */ __name((value, callbacks) => {
  const escapedString = new String(value);
  escapedString.isEscaped = true;
  escapedString.callbacks = callbacks;
  return escapedString;
}, "raw");
var resolveCallback = /* @__PURE__ */ __name(async (str, phase, preserveCallbacks, context, buffer) => {
  if (typeof str === "object" && !(str instanceof String)) {
    if (!(str instanceof Promise)) {
      str = str.toString();
    }
    if (str instanceof Promise) {
      str = await str;
    }
  }
  const callbacks = str.callbacks;
  if (!callbacks?.length) {
    return Promise.resolve(str);
  }
  if (buffer) {
    buffer[0] += str;
  } else {
    buffer = [str];
  }
  const resStr = Promise.all(callbacks.map((c) => c({ phase, buffer, context }))).then(
    (res) => Promise.all(
      res.filter(Boolean).map((str2) => resolveCallback(str2, phase, false, context, buffer))
    ).then(() => buffer[0])
  );
  if (preserveCallbacks) {
    return raw(await resStr, callbacks);
  } else {
    return resStr;
  }
}, "resolveCallback");

// ../../node_modules/hono/dist/context.js
var TEXT_PLAIN = "text/plain; charset=UTF-8";
var setDefaultContentType = /* @__PURE__ */ __name((contentType, headers) => {
  return {
    "Content-Type": contentType,
    ...headers
  };
}, "setDefaultContentType");
var createResponseInstance = /* @__PURE__ */ __name((body, init) => new Response(body, init), "createResponseInstance");
var Context = class {
  static {
    __name(this, "Context");
  }
  #rawRequest;
  #req;
  /**
   * `.env` can get bindings (environment variables, secrets, KV namespaces, D1 database, R2 bucket etc.) in Cloudflare Workers.
   *
   * @see {@link https://hono.dev/docs/api/context#env}
   *
   * @example
   * ```ts
   * // Environment object for Cloudflare Workers
   * app.get('*', async c => {
   *   const counter = c.env.COUNTER
   * })
   * ```
   */
  env = {};
  #var;
  finalized = false;
  /**
   * `.error` can get the error object from the middleware if the Handler throws an error.
   *
   * @see {@link https://hono.dev/docs/api/context#error}
   *
   * @example
   * ```ts
   * app.use('*', async (c, next) => {
   *   await next()
   *   if (c.error) {
   *     // do something...
   *   }
   * })
   * ```
   */
  error;
  #status;
  #executionCtx;
  #res;
  #layout;
  #renderer;
  #notFoundHandler;
  #preparedHeaders;
  #matchResult;
  #path;
  /**
   * Creates an instance of the Context class.
   *
   * @param req - The Request object.
   * @param options - Optional configuration options for the context.
   */
  constructor(req, options) {
    this.#rawRequest = req;
    if (options) {
      this.#executionCtx = options.executionCtx;
      this.env = options.env;
      this.#notFoundHandler = options.notFoundHandler;
      this.#path = options.path;
      this.#matchResult = options.matchResult;
    }
  }
  /**
   * `.req` is the instance of {@link HonoRequest}.
   */
  get req() {
    this.#req ??= new HonoRequest(this.#rawRequest, this.#path, this.#matchResult);
    return this.#req;
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#event}
   * The FetchEvent associated with the current request.
   *
   * @throws Will throw an error if the context does not have a FetchEvent.
   */
  get event() {
    if (this.#executionCtx && "respondWith" in this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no FetchEvent");
    }
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#executionctx}
   * The ExecutionContext associated with the current request.
   *
   * @throws Will throw an error if the context does not have an ExecutionContext.
   */
  get executionCtx() {
    if (this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no ExecutionContext");
    }
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#res}
   * The Response object for the current request.
   */
  get res() {
    return this.#res ||= createResponseInstance(null, {
      headers: this.#preparedHeaders ??= new Headers()
    });
  }
  /**
   * Sets the Response object for the current request.
   *
   * @param _res - The Response object to set.
   */
  set res(_res) {
    if (this.#res && _res) {
      _res = createResponseInstance(_res.body, _res);
      for (const [k, v] of this.#res.headers.entries()) {
        if (k === "content-type") {
          continue;
        }
        if (k === "set-cookie") {
          const cookies = this.#res.headers.getSetCookie();
          _res.headers.delete("set-cookie");
          for (const cookie of cookies) {
            _res.headers.append("set-cookie", cookie);
          }
        } else {
          _res.headers.set(k, v);
        }
      }
    }
    this.#res = _res;
    this.finalized = true;
  }
  /**
   * `.render()` can create a response within a layout.
   *
   * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
   *
   * @example
   * ```ts
   * app.get('/', (c) => {
   *   return c.render('Hello!')
   * })
   * ```
   */
  render = /* @__PURE__ */ __name((...args) => {
    this.#renderer ??= (content) => this.html(content);
    return this.#renderer(...args);
  }, "render");
  /**
   * Sets the layout for the response.
   *
   * @param layout - The layout to set.
   * @returns The layout function.
   */
  setLayout = /* @__PURE__ */ __name((layout) => this.#layout = layout, "setLayout");
  /**
   * Gets the current layout for the response.
   *
   * @returns The current layout function.
   */
  getLayout = /* @__PURE__ */ __name(() => this.#layout, "getLayout");
  /**
   * `.setRenderer()` can set the layout in the custom middleware.
   *
   * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
   *
   * @example
   * ```tsx
   * app.use('*', async (c, next) => {
   *   c.setRenderer((content) => {
   *     return c.html(
   *       <html>
   *         <body>
   *           <p>{content}</p>
   *         </body>
   *       </html>
   *     )
   *   })
   *   await next()
   * })
   * ```
   */
  setRenderer = /* @__PURE__ */ __name((renderer) => {
    this.#renderer = renderer;
  }, "setRenderer");
  /**
   * `.header()` can set headers.
   *
   * @see {@link https://hono.dev/docs/api/context#header}
   *
   * @example
   * ```ts
   * app.get('/welcome', (c) => {
   *   // Set headers
   *   c.header('X-Message', 'Hello!')
   *   c.header('Content-Type', 'text/plain')
   *
   *   return c.body('Thank you for coming')
   * })
   * ```
   */
  header = /* @__PURE__ */ __name((name, value, options) => {
    if (this.finalized) {
      this.#res = createResponseInstance(this.#res.body, this.#res);
    }
    const headers = this.#res ? this.#res.headers : this.#preparedHeaders ??= new Headers();
    if (value === void 0) {
      headers.delete(name);
    } else if (options?.append) {
      headers.append(name, value);
    } else {
      headers.set(name, value);
    }
  }, "header");
  status = /* @__PURE__ */ __name((status) => {
    this.#status = status;
  }, "status");
  /**
   * `.set()` can set the value specified by the key.
   *
   * @see {@link https://hono.dev/docs/api/context#set-get}
   *
   * @example
   * ```ts
   * app.use('*', async (c, next) => {
   *   c.set('message', 'Hono is hot!!')
   *   await next()
   * })
   * ```
   */
  set = /* @__PURE__ */ __name((key, value) => {
    this.#var ??= /* @__PURE__ */ new Map();
    this.#var.set(key, value);
  }, "set");
  /**
   * `.get()` can use the value specified by the key.
   *
   * @see {@link https://hono.dev/docs/api/context#set-get}
   *
   * @example
   * ```ts
   * app.get('/', (c) => {
   *   const message = c.get('message')
   *   return c.text(`The message is "${message}"`)
   * })
   * ```
   */
  get = /* @__PURE__ */ __name((key) => {
    return this.#var ? this.#var.get(key) : void 0;
  }, "get");
  /**
   * `.var` can access the value of a variable.
   *
   * @see {@link https://hono.dev/docs/api/context#var}
   *
   * @example
   * ```ts
   * const result = c.var.client.oneMethod()
   * ```
   */
  // c.var.propName is a read-only
  get var() {
    if (!this.#var) {
      return {};
    }
    return Object.fromEntries(this.#var);
  }
  #newResponse(data, arg, headers) {
    const responseHeaders = this.#res ? new Headers(this.#res.headers) : this.#preparedHeaders ?? new Headers();
    if (typeof arg === "object" && "headers" in arg) {
      const argHeaders = arg.headers instanceof Headers ? arg.headers : new Headers(arg.headers);
      for (const [key, value] of argHeaders) {
        if (key.toLowerCase() === "set-cookie") {
          responseHeaders.append(key, value);
        } else {
          responseHeaders.set(key, value);
        }
      }
    }
    if (headers) {
      for (const [k, v] of Object.entries(headers)) {
        if (typeof v === "string") {
          responseHeaders.set(k, v);
        } else {
          responseHeaders.delete(k);
          for (const v2 of v) {
            responseHeaders.append(k, v2);
          }
        }
      }
    }
    const status = typeof arg === "number" ? arg : arg?.status ?? this.#status;
    return createResponseInstance(data, { status, headers: responseHeaders });
  }
  newResponse = /* @__PURE__ */ __name((...args) => this.#newResponse(...args), "newResponse");
  /**
   * `.body()` can return the HTTP response.
   * You can set headers with `.header()` and set HTTP status code with `.status`.
   * This can also be set in `.text()`, `.json()` and so on.
   *
   * @see {@link https://hono.dev/docs/api/context#body}
   *
   * @example
   * ```ts
   * app.get('/welcome', (c) => {
   *   // Set headers
   *   c.header('X-Message', 'Hello!')
   *   c.header('Content-Type', 'text/plain')
   *   // Set HTTP status code
   *   c.status(201)
   *
   *   // Return the response body
   *   return c.body('Thank you for coming')
   * })
   * ```
   */
  body = /* @__PURE__ */ __name((data, arg, headers) => this.#newResponse(data, arg, headers), "body");
  /**
   * `.text()` can render text as `Content-Type:text/plain`.
   *
   * @see {@link https://hono.dev/docs/api/context#text}
   *
   * @example
   * ```ts
   * app.get('/say', (c) => {
   *   return c.text('Hello!')
   * })
   * ```
   */
  text = /* @__PURE__ */ __name((text, arg, headers) => {
    return !this.#preparedHeaders && !this.#status && !arg && !headers && !this.finalized ? new Response(text) : this.#newResponse(
      text,
      arg,
      setDefaultContentType(TEXT_PLAIN, headers)
    );
  }, "text");
  /**
   * `.json()` can render JSON as `Content-Type:application/json`.
   *
   * @see {@link https://hono.dev/docs/api/context#json}
   *
   * @example
   * ```ts
   * app.get('/api', (c) => {
   *   return c.json({ message: 'Hello!' })
   * })
   * ```
   */
  json = /* @__PURE__ */ __name((object, arg, headers) => {
    return this.#newResponse(
      JSON.stringify(object),
      arg,
      setDefaultContentType("application/json", headers)
    );
  }, "json");
  html = /* @__PURE__ */ __name((html, arg, headers) => {
    const res = /* @__PURE__ */ __name((html2) => this.#newResponse(html2, arg, setDefaultContentType("text/html; charset=UTF-8", headers)), "res");
    return typeof html === "object" ? resolveCallback(html, HtmlEscapedCallbackPhase.Stringify, false, {}).then(res) : res(html);
  }, "html");
  /**
   * `.redirect()` can Redirect, default status code is 302.
   *
   * @see {@link https://hono.dev/docs/api/context#redirect}
   *
   * @example
   * ```ts
   * app.get('/redirect', (c) => {
   *   return c.redirect('/')
   * })
   * app.get('/redirect-permanently', (c) => {
   *   return c.redirect('/', 301)
   * })
   * ```
   */
  redirect = /* @__PURE__ */ __name((location, status) => {
    const locationString = String(location);
    this.header(
      "Location",
      // Multibyes should be encoded
      // eslint-disable-next-line no-control-regex
      !/[^\x00-\xFF]/.test(locationString) ? locationString : encodeURI(locationString)
    );
    return this.newResponse(null, status ?? 302);
  }, "redirect");
  /**
   * `.notFound()` can return the Not Found Response.
   *
   * @see {@link https://hono.dev/docs/api/context#notfound}
   *
   * @example
   * ```ts
   * app.get('/notfound', (c) => {
   *   return c.notFound()
   * })
   * ```
   */
  notFound = /* @__PURE__ */ __name(() => {
    this.#notFoundHandler ??= () => createResponseInstance();
    return this.#notFoundHandler(this);
  }, "notFound");
};

// ../../node_modules/hono/dist/router.js
var METHOD_NAME_ALL = "ALL";
var METHOD_NAME_ALL_LOWERCASE = "all";
var METHODS = ["get", "post", "put", "delete", "options", "patch"];
var MESSAGE_MATCHER_IS_ALREADY_BUILT = "Can not add a route since the matcher is already built.";
var UnsupportedPathError = class extends Error {
  static {
    __name(this, "UnsupportedPathError");
  }
};

// ../../node_modules/hono/dist/utils/constants.js
var COMPOSED_HANDLER = "__COMPOSED_HANDLER";

// ../../node_modules/hono/dist/hono-base.js
var notFoundHandler = /* @__PURE__ */ __name((c) => {
  return c.text("404 Not Found", 404);
}, "notFoundHandler");
var errorHandler = /* @__PURE__ */ __name((err, c) => {
  if ("getResponse" in err) {
    const res = err.getResponse();
    return c.newResponse(res.body, res);
  }
  console.error(err);
  return c.text("Internal Server Error", 500);
}, "errorHandler");
var Hono = class _Hono {
  static {
    __name(this, "_Hono");
  }
  get;
  post;
  put;
  delete;
  options;
  patch;
  all;
  on;
  use;
  /*
    This class is like an abstract class and does not have a router.
    To use it, inherit the class and implement router in the constructor.
  */
  router;
  getPath;
  // Cannot use `#` because it requires visibility at JavaScript runtime.
  _basePath = "/";
  #path = "/";
  routes = [];
  constructor(options = {}) {
    const allMethods = [...METHODS, METHOD_NAME_ALL_LOWERCASE];
    allMethods.forEach((method) => {
      this[method] = (args1, ...args) => {
        if (typeof args1 === "string") {
          this.#path = args1;
        } else {
          this.#addRoute(method, this.#path, args1);
        }
        args.forEach((handler) => {
          this.#addRoute(method, this.#path, handler);
        });
        return this;
      };
    });
    this.on = (method, path, ...handlers) => {
      for (const p of [path].flat()) {
        this.#path = p;
        for (const m of [method].flat()) {
          handlers.map((handler) => {
            this.#addRoute(m.toUpperCase(), this.#path, handler);
          });
        }
      }
      return this;
    };
    this.use = (arg1, ...handlers) => {
      if (typeof arg1 === "string") {
        this.#path = arg1;
      } else {
        this.#path = "*";
        handlers.unshift(arg1);
      }
      handlers.forEach((handler) => {
        this.#addRoute(METHOD_NAME_ALL, this.#path, handler);
      });
      return this;
    };
    const { strict, ...optionsWithoutStrict } = options;
    Object.assign(this, optionsWithoutStrict);
    this.getPath = strict ?? true ? options.getPath ?? getPath : getPathNoStrict;
  }
  #clone() {
    const clone = new _Hono({
      router: this.router,
      getPath: this.getPath
    });
    clone.errorHandler = this.errorHandler;
    clone.#notFoundHandler = this.#notFoundHandler;
    clone.routes = this.routes;
    return clone;
  }
  #notFoundHandler = notFoundHandler;
  // Cannot use `#` because it requires visibility at JavaScript runtime.
  errorHandler = errorHandler;
  /**
   * `.route()` allows grouping other Hono instance in routes.
   *
   * @see {@link https://hono.dev/docs/api/routing#grouping}
   *
   * @param {string} path - base Path
   * @param {Hono} app - other Hono instance
   * @returns {Hono} routed Hono instance
   *
   * @example
   * ```ts
   * const app = new Hono()
   * const app2 = new Hono()
   *
   * app2.get("/user", (c) => c.text("user"))
   * app.route("/api", app2) // GET /api/user
   * ```
   */
  route(path, app2) {
    const subApp = this.basePath(path);
    app2.routes.map((r) => {
      let handler;
      if (app2.errorHandler === errorHandler) {
        handler = r.handler;
      } else {
        handler = /* @__PURE__ */ __name(async (c, next) => (await compose([], app2.errorHandler)(c, () => r.handler(c, next))).res, "handler");
        handler[COMPOSED_HANDLER] = r.handler;
      }
      subApp.#addRoute(r.method, r.path, handler);
    });
    return this;
  }
  /**
   * `.basePath()` allows base paths to be specified.
   *
   * @see {@link https://hono.dev/docs/api/routing#base-path}
   *
   * @param {string} path - base Path
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * const api = new Hono().basePath('/api')
   * ```
   */
  basePath(path) {
    const subApp = this.#clone();
    subApp._basePath = mergePath(this._basePath, path);
    return subApp;
  }
  /**
   * `.onError()` handles an error and returns a customized Response.
   *
   * @see {@link https://hono.dev/docs/api/hono#error-handling}
   *
   * @param {ErrorHandler} handler - request Handler for error
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * app.onError((err, c) => {
   *   console.error(`${err}`)
   *   return c.text('Custom Error Message', 500)
   * })
   * ```
   */
  onError = /* @__PURE__ */ __name((handler) => {
    this.errorHandler = handler;
    return this;
  }, "onError");
  /**
   * `.notFound()` allows you to customize a Not Found Response.
   *
   * @see {@link https://hono.dev/docs/api/hono#not-found}
   *
   * @param {NotFoundHandler} handler - request handler for not-found
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * app.notFound((c) => {
   *   return c.text('Custom 404 Message', 404)
   * })
   * ```
   */
  notFound = /* @__PURE__ */ __name((handler) => {
    this.#notFoundHandler = handler;
    return this;
  }, "notFound");
  /**
   * `.mount()` allows you to mount applications built with other frameworks into your Hono application.
   *
   * @see {@link https://hono.dev/docs/api/hono#mount}
   *
   * @param {string} path - base Path
   * @param {Function} applicationHandler - other Request Handler
   * @param {MountOptions} [options] - options of `.mount()`
   * @returns {Hono} mounted Hono instance
   *
   * @example
   * ```ts
   * import { Router as IttyRouter } from 'itty-router'
   * import { Hono } from 'hono'
   * // Create itty-router application
   * const ittyRouter = IttyRouter()
   * // GET /itty-router/hello
   * ittyRouter.get('/hello', () => new Response('Hello from itty-router'))
   *
   * const app = new Hono()
   * app.mount('/itty-router', ittyRouter.handle)
   * ```
   *
   * @example
   * ```ts
   * const app = new Hono()
   * // Send the request to another application without modification.
   * app.mount('/app', anotherApp, {
   *   replaceRequest: (req) => req,
   * })
   * ```
   */
  mount(path, applicationHandler, options) {
    let replaceRequest;
    let optionHandler;
    if (options) {
      if (typeof options === "function") {
        optionHandler = options;
      } else {
        optionHandler = options.optionHandler;
        if (options.replaceRequest === false) {
          replaceRequest = /* @__PURE__ */ __name((request) => request, "replaceRequest");
        } else {
          replaceRequest = options.replaceRequest;
        }
      }
    }
    const getOptions = optionHandler ? (c) => {
      const options2 = optionHandler(c);
      return Array.isArray(options2) ? options2 : [options2];
    } : (c) => {
      let executionContext = void 0;
      try {
        executionContext = c.executionCtx;
      } catch {
      }
      return [c.env, executionContext];
    };
    replaceRequest ||= (() => {
      const mergedPath = mergePath(this._basePath, path);
      const pathPrefixLength = mergedPath === "/" ? 0 : mergedPath.length;
      return (request) => {
        const url = new URL(request.url);
        url.pathname = url.pathname.slice(pathPrefixLength) || "/";
        return new Request(url, request);
      };
    })();
    const handler = /* @__PURE__ */ __name(async (c, next) => {
      const res = await applicationHandler(replaceRequest(c.req.raw), ...getOptions(c));
      if (res) {
        return res;
      }
      await next();
    }, "handler");
    this.#addRoute(METHOD_NAME_ALL, mergePath(path, "*"), handler);
    return this;
  }
  #addRoute(method, path, handler) {
    method = method.toUpperCase();
    path = mergePath(this._basePath, path);
    const r = { basePath: this._basePath, path, method, handler };
    this.router.add(method, path, [handler, r]);
    this.routes.push(r);
  }
  #handleError(err, c) {
    if (err instanceof Error) {
      return this.errorHandler(err, c);
    }
    throw err;
  }
  #dispatch(request, executionCtx, env, method) {
    if (method === "HEAD") {
      return (async () => new Response(null, await this.#dispatch(request, executionCtx, env, "GET")))();
    }
    const path = this.getPath(request, { env });
    const matchResult = this.router.match(method, path);
    const c = new Context(request, {
      path,
      matchResult,
      env,
      executionCtx,
      notFoundHandler: this.#notFoundHandler
    });
    if (matchResult[0].length === 1) {
      let res;
      try {
        res = matchResult[0][0][0][0](c, async () => {
          c.res = await this.#notFoundHandler(c);
        });
      } catch (err) {
        return this.#handleError(err, c);
      }
      return res instanceof Promise ? res.then(
        (resolved) => resolved || (c.finalized ? c.res : this.#notFoundHandler(c))
      ).catch((err) => this.#handleError(err, c)) : res ?? this.#notFoundHandler(c);
    }
    const composed = compose(matchResult[0], this.errorHandler, this.#notFoundHandler);
    return (async () => {
      try {
        const context = await composed(c);
        if (!context.finalized) {
          throw new Error(
            "Context is not finalized. Did you forget to return a Response object or `await next()`?"
          );
        }
        return context.res;
      } catch (err) {
        return this.#handleError(err, c);
      }
    })();
  }
  /**
   * `.fetch()` will be entry point of your app.
   *
   * @see {@link https://hono.dev/docs/api/hono#fetch}
   *
   * @param {Request} request - request Object of request
   * @param {Env} Env - env Object
   * @param {ExecutionContext} - context of execution
   * @returns {Response | Promise<Response>} response of request
   *
   */
  fetch = /* @__PURE__ */ __name((request, ...rest) => {
    return this.#dispatch(request, rest[1], rest[0], request.method);
  }, "fetch");
  /**
   * `.request()` is a useful method for testing.
   * You can pass a URL or pathname to send a GET request.
   * app will return a Response object.
   * ```ts
   * test('GET /hello is ok', async () => {
   *   const res = await app.request('/hello')
   *   expect(res.status).toBe(200)
   * })
   * ```
   * @see https://hono.dev/docs/api/hono#request
   */
  request = /* @__PURE__ */ __name((input, requestInit, Env, executionCtx) => {
    if (input instanceof Request) {
      return this.fetch(requestInit ? new Request(input, requestInit) : input, Env, executionCtx);
    }
    input = input.toString();
    return this.fetch(
      new Request(
        /^https?:\/\//.test(input) ? input : `http://localhost${mergePath("/", input)}`,
        requestInit
      ),
      Env,
      executionCtx
    );
  }, "request");
  /**
   * `.fire()` automatically adds a global fetch event listener.
   * This can be useful for environments that adhere to the Service Worker API, such as non-ES module Cloudflare Workers.
   * @deprecated
   * Use `fire` from `hono/service-worker` instead.
   * ```ts
   * import { Hono } from 'hono'
   * import { fire } from 'hono/service-worker'
   *
   * const app = new Hono()
   * // ...
   * fire(app)
   * ```
   * @see https://hono.dev/docs/api/hono#fire
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
   * @see https://developers.cloudflare.com/workers/reference/migrate-to-module-workers/
   */
  fire = /* @__PURE__ */ __name(() => {
    addEventListener("fetch", (event) => {
      event.respondWith(this.#dispatch(event.request, event, void 0, event.request.method));
    });
  }, "fire");
};

// ../../node_modules/hono/dist/router/reg-exp-router/matcher.js
var emptyParam = [];
function match(method, path) {
  const matchers = this.buildAllMatchers();
  const match2 = /* @__PURE__ */ __name(((method2, path2) => {
    const matcher = matchers[method2] || matchers[METHOD_NAME_ALL];
    const staticMatch = matcher[2][path2];
    if (staticMatch) {
      return staticMatch;
    }
    const match3 = path2.match(matcher[0]);
    if (!match3) {
      return [[], emptyParam];
    }
    const index = match3.indexOf("", 1);
    return [matcher[1][index], match3];
  }), "match2");
  this.match = match2;
  return match2(method, path);
}
__name(match, "match");

// ../../node_modules/hono/dist/router/reg-exp-router/node.js
var LABEL_REG_EXP_STR = "[^/]+";
var ONLY_WILDCARD_REG_EXP_STR = ".*";
var TAIL_WILDCARD_REG_EXP_STR = "(?:|/.*)";
var PATH_ERROR = /* @__PURE__ */ Symbol();
var regExpMetaChars = new Set(".\\+*[^]$()");
function compareKey(a, b) {
  if (a.length === 1) {
    return b.length === 1 ? a < b ? -1 : 1 : -1;
  }
  if (b.length === 1) {
    return 1;
  }
  if (a === ONLY_WILDCARD_REG_EXP_STR || a === TAIL_WILDCARD_REG_EXP_STR) {
    return 1;
  } else if (b === ONLY_WILDCARD_REG_EXP_STR || b === TAIL_WILDCARD_REG_EXP_STR) {
    return -1;
  }
  if (a === LABEL_REG_EXP_STR) {
    return 1;
  } else if (b === LABEL_REG_EXP_STR) {
    return -1;
  }
  return a.length === b.length ? a < b ? -1 : 1 : b.length - a.length;
}
__name(compareKey, "compareKey");
var Node = class _Node {
  static {
    __name(this, "_Node");
  }
  #index;
  #varIndex;
  #children = /* @__PURE__ */ Object.create(null);
  insert(tokens, index, paramMap, context, pathErrorCheckOnly) {
    if (tokens.length === 0) {
      if (this.#index !== void 0) {
        throw PATH_ERROR;
      }
      if (pathErrorCheckOnly) {
        return;
      }
      this.#index = index;
      return;
    }
    const [token, ...restTokens] = tokens;
    const pattern = token === "*" ? restTokens.length === 0 ? ["", "", ONLY_WILDCARD_REG_EXP_STR] : ["", "", LABEL_REG_EXP_STR] : token === "/*" ? ["", "", TAIL_WILDCARD_REG_EXP_STR] : token.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
    let node;
    if (pattern) {
      const name = pattern[1];
      let regexpStr = pattern[2] || LABEL_REG_EXP_STR;
      if (name && pattern[2]) {
        if (regexpStr === ".*") {
          throw PATH_ERROR;
        }
        regexpStr = regexpStr.replace(/^\((?!\?:)(?=[^)]+\)$)/, "(?:");
        if (/\((?!\?:)/.test(regexpStr)) {
          throw PATH_ERROR;
        }
      }
      node = this.#children[regexpStr];
      if (!node) {
        if (Object.keys(this.#children).some(
          (k) => k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
        )) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = this.#children[regexpStr] = new _Node();
        if (name !== "") {
          node.#varIndex = context.varIndex++;
        }
      }
      if (!pathErrorCheckOnly && name !== "") {
        paramMap.push([name, node.#varIndex]);
      }
    } else {
      node = this.#children[token];
      if (!node) {
        if (Object.keys(this.#children).some(
          (k) => k.length > 1 && k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
        )) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = this.#children[token] = new _Node();
      }
    }
    node.insert(restTokens, index, paramMap, context, pathErrorCheckOnly);
  }
  buildRegExpStr() {
    const childKeys = Object.keys(this.#children).sort(compareKey);
    const strList = childKeys.map((k) => {
      const c = this.#children[k];
      return (typeof c.#varIndex === "number" ? `(${k})@${c.#varIndex}` : regExpMetaChars.has(k) ? `\\${k}` : k) + c.buildRegExpStr();
    });
    if (typeof this.#index === "number") {
      strList.unshift(`#${this.#index}`);
    }
    if (strList.length === 0) {
      return "";
    }
    if (strList.length === 1) {
      return strList[0];
    }
    return "(?:" + strList.join("|") + ")";
  }
};

// ../../node_modules/hono/dist/router/reg-exp-router/trie.js
var Trie = class {
  static {
    __name(this, "Trie");
  }
  #context = { varIndex: 0 };
  #root = new Node();
  insert(path, index, pathErrorCheckOnly) {
    const paramAssoc = [];
    const groups = [];
    for (let i = 0; ; ) {
      let replaced = false;
      path = path.replace(/\{[^}]+\}/g, (m) => {
        const mark = `@\\${i}`;
        groups[i] = [mark, m];
        i++;
        replaced = true;
        return mark;
      });
      if (!replaced) {
        break;
      }
    }
    const tokens = path.match(/(?::[^\/]+)|(?:\/\*$)|./g) || [];
    for (let i = groups.length - 1; i >= 0; i--) {
      const [mark] = groups[i];
      for (let j = tokens.length - 1; j >= 0; j--) {
        if (tokens[j].indexOf(mark) !== -1) {
          tokens[j] = tokens[j].replace(mark, groups[i][1]);
          break;
        }
      }
    }
    this.#root.insert(tokens, index, paramAssoc, this.#context, pathErrorCheckOnly);
    return paramAssoc;
  }
  buildRegExp() {
    let regexp = this.#root.buildRegExpStr();
    if (regexp === "") {
      return [/^$/, [], []];
    }
    let captureIndex = 0;
    const indexReplacementMap = [];
    const paramReplacementMap = [];
    regexp = regexp.replace(/#(\d+)|@(\d+)|\.\*\$/g, (_, handlerIndex, paramIndex) => {
      if (handlerIndex !== void 0) {
        indexReplacementMap[++captureIndex] = Number(handlerIndex);
        return "$()";
      }
      if (paramIndex !== void 0) {
        paramReplacementMap[Number(paramIndex)] = ++captureIndex;
        return "";
      }
      return "";
    });
    return [new RegExp(`^${regexp}`), indexReplacementMap, paramReplacementMap];
  }
};

// ../../node_modules/hono/dist/router/reg-exp-router/router.js
var nullMatcher = [/^$/, [], /* @__PURE__ */ Object.create(null)];
var wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
function buildWildcardRegExp(path) {
  return wildcardRegExpCache[path] ??= new RegExp(
    path === "*" ? "" : `^${path.replace(
      /\/\*$|([.\\+*[^\]$()])/g,
      (_, metaChar) => metaChar ? `\\${metaChar}` : "(?:|/.*)"
    )}$`
  );
}
__name(buildWildcardRegExp, "buildWildcardRegExp");
function clearWildcardRegExpCache() {
  wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
}
__name(clearWildcardRegExpCache, "clearWildcardRegExpCache");
function buildMatcherFromPreprocessedRoutes(routes) {
  const trie = new Trie();
  const handlerData = [];
  if (routes.length === 0) {
    return nullMatcher;
  }
  const routesWithStaticPathFlag = routes.map(
    (route) => [!/\*|\/:/.test(route[0]), ...route]
  ).sort(
    ([isStaticA, pathA], [isStaticB, pathB]) => isStaticA ? 1 : isStaticB ? -1 : pathA.length - pathB.length
  );
  const staticMap = /* @__PURE__ */ Object.create(null);
  for (let i = 0, j = -1, len = routesWithStaticPathFlag.length; i < len; i++) {
    const [pathErrorCheckOnly, path, handlers] = routesWithStaticPathFlag[i];
    if (pathErrorCheckOnly) {
      staticMap[path] = [handlers.map(([h]) => [h, /* @__PURE__ */ Object.create(null)]), emptyParam];
    } else {
      j++;
    }
    let paramAssoc;
    try {
      paramAssoc = trie.insert(path, j, pathErrorCheckOnly);
    } catch (e) {
      throw e === PATH_ERROR ? new UnsupportedPathError(path) : e;
    }
    if (pathErrorCheckOnly) {
      continue;
    }
    handlerData[j] = handlers.map(([h, paramCount]) => {
      const paramIndexMap = /* @__PURE__ */ Object.create(null);
      paramCount -= 1;
      for (; paramCount >= 0; paramCount--) {
        const [key, value] = paramAssoc[paramCount];
        paramIndexMap[key] = value;
      }
      return [h, paramIndexMap];
    });
  }
  const [regexp, indexReplacementMap, paramReplacementMap] = trie.buildRegExp();
  for (let i = 0, len = handlerData.length; i < len; i++) {
    for (let j = 0, len2 = handlerData[i].length; j < len2; j++) {
      const map = handlerData[i][j]?.[1];
      if (!map) {
        continue;
      }
      const keys = Object.keys(map);
      for (let k = 0, len3 = keys.length; k < len3; k++) {
        map[keys[k]] = paramReplacementMap[map[keys[k]]];
      }
    }
  }
  const handlerMap = [];
  for (const i in indexReplacementMap) {
    handlerMap[i] = handlerData[indexReplacementMap[i]];
  }
  return [regexp, handlerMap, staticMap];
}
__name(buildMatcherFromPreprocessedRoutes, "buildMatcherFromPreprocessedRoutes");
function findMiddleware(middleware, path) {
  if (!middleware) {
    return void 0;
  }
  for (const k of Object.keys(middleware).sort((a, b) => b.length - a.length)) {
    if (buildWildcardRegExp(k).test(path)) {
      return [...middleware[k]];
    }
  }
  return void 0;
}
__name(findMiddleware, "findMiddleware");
var RegExpRouter = class {
  static {
    __name(this, "RegExpRouter");
  }
  name = "RegExpRouter";
  #middleware;
  #routes;
  constructor() {
    this.#middleware = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
    this.#routes = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
  }
  add(method, path, handler) {
    const middleware = this.#middleware;
    const routes = this.#routes;
    if (!middleware || !routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    if (!middleware[method]) {
      ;
      [middleware, routes].forEach((handlerMap) => {
        handlerMap[method] = /* @__PURE__ */ Object.create(null);
        Object.keys(handlerMap[METHOD_NAME_ALL]).forEach((p) => {
          handlerMap[method][p] = [...handlerMap[METHOD_NAME_ALL][p]];
        });
      });
    }
    if (path === "/*") {
      path = "*";
    }
    const paramCount = (path.match(/\/:/g) || []).length;
    if (/\*$/.test(path)) {
      const re = buildWildcardRegExp(path);
      if (method === METHOD_NAME_ALL) {
        Object.keys(middleware).forEach((m) => {
          middleware[m][path] ||= findMiddleware(middleware[m], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || [];
        });
      } else {
        middleware[method][path] ||= findMiddleware(middleware[method], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || [];
      }
      Object.keys(middleware).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(middleware[m]).forEach((p) => {
            re.test(p) && middleware[m][p].push([handler, paramCount]);
          });
        }
      });
      Object.keys(routes).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(routes[m]).forEach(
            (p) => re.test(p) && routes[m][p].push([handler, paramCount])
          );
        }
      });
      return;
    }
    const paths = checkOptionalParameter(path) || [path];
    for (let i = 0, len = paths.length; i < len; i++) {
      const path2 = paths[i];
      Object.keys(routes).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          routes[m][path2] ||= [
            ...findMiddleware(middleware[m], path2) || findMiddleware(middleware[METHOD_NAME_ALL], path2) || []
          ];
          routes[m][path2].push([handler, paramCount - len + i + 1]);
        }
      });
    }
  }
  match = match;
  buildAllMatchers() {
    const matchers = /* @__PURE__ */ Object.create(null);
    Object.keys(this.#routes).concat(Object.keys(this.#middleware)).forEach((method) => {
      matchers[method] ||= this.#buildMatcher(method);
    });
    this.#middleware = this.#routes = void 0;
    clearWildcardRegExpCache();
    return matchers;
  }
  #buildMatcher(method) {
    const routes = [];
    let hasOwnRoute = method === METHOD_NAME_ALL;
    [this.#middleware, this.#routes].forEach((r) => {
      const ownRoute = r[method] ? Object.keys(r[method]).map((path) => [path, r[method][path]]) : [];
      if (ownRoute.length !== 0) {
        hasOwnRoute ||= true;
        routes.push(...ownRoute);
      } else if (method !== METHOD_NAME_ALL) {
        routes.push(
          ...Object.keys(r[METHOD_NAME_ALL]).map((path) => [path, r[METHOD_NAME_ALL][path]])
        );
      }
    });
    if (!hasOwnRoute) {
      return null;
    } else {
      return buildMatcherFromPreprocessedRoutes(routes);
    }
  }
};

// ../../node_modules/hono/dist/router/smart-router/router.js
var SmartRouter = class {
  static {
    __name(this, "SmartRouter");
  }
  name = "SmartRouter";
  #routers = [];
  #routes = [];
  constructor(init) {
    this.#routers = init.routers;
  }
  add(method, path, handler) {
    if (!this.#routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    this.#routes.push([method, path, handler]);
  }
  match(method, path) {
    if (!this.#routes) {
      throw new Error("Fatal error");
    }
    const routers = this.#routers;
    const routes = this.#routes;
    const len = routers.length;
    let i = 0;
    let res;
    for (; i < len; i++) {
      const router = routers[i];
      try {
        for (let i2 = 0, len2 = routes.length; i2 < len2; i2++) {
          router.add(...routes[i2]);
        }
        res = router.match(method, path);
      } catch (e) {
        if (e instanceof UnsupportedPathError) {
          continue;
        }
        throw e;
      }
      this.match = router.match.bind(router);
      this.#routers = [router];
      this.#routes = void 0;
      break;
    }
    if (i === len) {
      throw new Error("Fatal error");
    }
    this.name = `SmartRouter + ${this.activeRouter.name}`;
    return res;
  }
  get activeRouter() {
    if (this.#routes || this.#routers.length !== 1) {
      throw new Error("No active router has been determined yet.");
    }
    return this.#routers[0];
  }
};

// ../../node_modules/hono/dist/router/trie-router/node.js
var emptyParams = /* @__PURE__ */ Object.create(null);
var hasChildren = /* @__PURE__ */ __name((children) => {
  for (const _ in children) {
    return true;
  }
  return false;
}, "hasChildren");
var Node2 = class _Node2 {
  static {
    __name(this, "_Node");
  }
  #methods;
  #children;
  #patterns;
  #order = 0;
  #params = emptyParams;
  constructor(method, handler, children) {
    this.#children = children || /* @__PURE__ */ Object.create(null);
    this.#methods = [];
    if (method && handler) {
      const m = /* @__PURE__ */ Object.create(null);
      m[method] = { handler, possibleKeys: [], score: 0 };
      this.#methods = [m];
    }
    this.#patterns = [];
  }
  insert(method, path, handler) {
    this.#order = ++this.#order;
    let curNode = this;
    const parts = splitRoutingPath(path);
    const possibleKeys = [];
    for (let i = 0, len = parts.length; i < len; i++) {
      const p = parts[i];
      const nextP = parts[i + 1];
      const pattern = getPattern(p, nextP);
      const key = Array.isArray(pattern) ? pattern[0] : p;
      if (key in curNode.#children) {
        curNode = curNode.#children[key];
        if (pattern) {
          possibleKeys.push(pattern[1]);
        }
        continue;
      }
      curNode.#children[key] = new _Node2();
      if (pattern) {
        curNode.#patterns.push(pattern);
        possibleKeys.push(pattern[1]);
      }
      curNode = curNode.#children[key];
    }
    curNode.#methods.push({
      [method]: {
        handler,
        possibleKeys: possibleKeys.filter((v, i, a) => a.indexOf(v) === i),
        score: this.#order
      }
    });
    return curNode;
  }
  #pushHandlerSets(handlerSets, node, method, nodeParams, params) {
    for (let i = 0, len = node.#methods.length; i < len; i++) {
      const m = node.#methods[i];
      const handlerSet = m[method] || m[METHOD_NAME_ALL];
      const processedSet = {};
      if (handlerSet !== void 0) {
        handlerSet.params = /* @__PURE__ */ Object.create(null);
        handlerSets.push(handlerSet);
        if (nodeParams !== emptyParams || params && params !== emptyParams) {
          for (let i2 = 0, len2 = handlerSet.possibleKeys.length; i2 < len2; i2++) {
            const key = handlerSet.possibleKeys[i2];
            const processed = processedSet[handlerSet.score];
            handlerSet.params[key] = params?.[key] && !processed ? params[key] : nodeParams[key] ?? params?.[key];
            processedSet[handlerSet.score] = true;
          }
        }
      }
    }
  }
  search(method, path) {
    const handlerSets = [];
    this.#params = emptyParams;
    const curNode = this;
    let curNodes = [curNode];
    const parts = splitPath(path);
    const curNodesQueue = [];
    const len = parts.length;
    let partOffsets = null;
    for (let i = 0; i < len; i++) {
      const part = parts[i];
      const isLast = i === len - 1;
      const tempNodes = [];
      for (let j = 0, len2 = curNodes.length; j < len2; j++) {
        const node = curNodes[j];
        const nextNode = node.#children[part];
        if (nextNode) {
          nextNode.#params = node.#params;
          if (isLast) {
            if (nextNode.#children["*"]) {
              this.#pushHandlerSets(handlerSets, nextNode.#children["*"], method, node.#params);
            }
            this.#pushHandlerSets(handlerSets, nextNode, method, node.#params);
          } else {
            tempNodes.push(nextNode);
          }
        }
        for (let k = 0, len3 = node.#patterns.length; k < len3; k++) {
          const pattern = node.#patterns[k];
          const params = node.#params === emptyParams ? {} : { ...node.#params };
          if (pattern === "*") {
            const astNode = node.#children["*"];
            if (astNode) {
              this.#pushHandlerSets(handlerSets, astNode, method, node.#params);
              astNode.#params = params;
              tempNodes.push(astNode);
            }
            continue;
          }
          const [key, name, matcher] = pattern;
          if (!part && !(matcher instanceof RegExp)) {
            continue;
          }
          const child = node.#children[key];
          if (matcher instanceof RegExp) {
            if (partOffsets === null) {
              partOffsets = new Array(len);
              let offset = path[0] === "/" ? 1 : 0;
              for (let p = 0; p < len; p++) {
                partOffsets[p] = offset;
                offset += parts[p].length + 1;
              }
            }
            const restPathString = path.substring(partOffsets[i]);
            const m = matcher.exec(restPathString);
            if (m) {
              params[name] = m[0];
              this.#pushHandlerSets(handlerSets, child, method, node.#params, params);
              if (hasChildren(child.#children)) {
                child.#params = params;
                const componentCount = m[0].match(/\//)?.length ?? 0;
                const targetCurNodes = curNodesQueue[componentCount] ||= [];
                targetCurNodes.push(child);
              }
              continue;
            }
          }
          if (matcher === true || matcher.test(part)) {
            params[name] = part;
            if (isLast) {
              this.#pushHandlerSets(handlerSets, child, method, params, node.#params);
              if (child.#children["*"]) {
                this.#pushHandlerSets(
                  handlerSets,
                  child.#children["*"],
                  method,
                  params,
                  node.#params
                );
              }
            } else {
              child.#params = params;
              tempNodes.push(child);
            }
          }
        }
      }
      const shifted = curNodesQueue.shift();
      curNodes = shifted ? tempNodes.concat(shifted) : tempNodes;
    }
    if (handlerSets.length > 1) {
      handlerSets.sort((a, b) => {
        return a.score - b.score;
      });
    }
    return [handlerSets.map(({ handler, params }) => [handler, params])];
  }
};

// ../../node_modules/hono/dist/router/trie-router/router.js
var TrieRouter = class {
  static {
    __name(this, "TrieRouter");
  }
  name = "TrieRouter";
  #node;
  constructor() {
    this.#node = new Node2();
  }
  add(method, path, handler) {
    const results = checkOptionalParameter(path);
    if (results) {
      for (let i = 0, len = results.length; i < len; i++) {
        this.#node.insert(method, results[i], handler);
      }
      return;
    }
    this.#node.insert(method, path, handler);
  }
  match(method, path) {
    return this.#node.search(method, path);
  }
};

// ../../node_modules/hono/dist/hono.js
var Hono2 = class extends Hono {
  static {
    __name(this, "Hono");
  }
  /**
   * Creates an instance of the Hono class.
   *
   * @param options - Optional configuration options for the Hono instance.
   */
  constructor(options = {}) {
    super(options);
    this.router = options.router ?? new SmartRouter({
      routers: [new RegExpRouter(), new TrieRouter()]
    });
  }
};

// ../../node_modules/hono/dist/middleware/cors/index.js
var cors = /* @__PURE__ */ __name((options) => {
  const defaults = {
    origin: "*",
    allowMethods: ["GET", "HEAD", "PUT", "POST", "DELETE", "PATCH"],
    allowHeaders: [],
    exposeHeaders: []
  };
  const opts = {
    ...defaults,
    ...options
  };
  const findAllowOrigin = ((optsOrigin) => {
    if (typeof optsOrigin === "string") {
      if (optsOrigin === "*") {
        return () => optsOrigin;
      } else {
        return (origin) => optsOrigin === origin ? origin : null;
      }
    } else if (typeof optsOrigin === "function") {
      return optsOrigin;
    } else {
      return (origin) => optsOrigin.includes(origin) ? origin : null;
    }
  })(opts.origin);
  const findAllowMethods = ((optsAllowMethods) => {
    if (typeof optsAllowMethods === "function") {
      return optsAllowMethods;
    } else if (Array.isArray(optsAllowMethods)) {
      return () => optsAllowMethods;
    } else {
      return () => [];
    }
  })(opts.allowMethods);
  return /* @__PURE__ */ __name(async function cors2(c, next) {
    function set(key, value) {
      c.res.headers.set(key, value);
    }
    __name(set, "set");
    const allowOrigin = await findAllowOrigin(c.req.header("origin") || "", c);
    if (allowOrigin) {
      set("Access-Control-Allow-Origin", allowOrigin);
    }
    if (opts.credentials) {
      set("Access-Control-Allow-Credentials", "true");
    }
    if (opts.exposeHeaders?.length) {
      set("Access-Control-Expose-Headers", opts.exposeHeaders.join(","));
    }
    if (c.req.method === "OPTIONS") {
      if (opts.origin !== "*") {
        set("Vary", "Origin");
      }
      if (opts.maxAge != null) {
        set("Access-Control-Max-Age", opts.maxAge.toString());
      }
      const allowMethods = await findAllowMethods(c.req.header("origin") || "", c);
      if (allowMethods.length) {
        set("Access-Control-Allow-Methods", allowMethods.join(","));
      }
      let headers = opts.allowHeaders;
      if (!headers?.length) {
        const requestHeaders = c.req.header("Access-Control-Request-Headers");
        if (requestHeaders) {
          headers = requestHeaders.split(/\s*,\s*/);
        }
      }
      if (headers?.length) {
        set("Access-Control-Allow-Headers", headers.join(","));
        c.res.headers.append("Vary", "Access-Control-Request-Headers");
      }
      c.res.headers.delete("Content-Length");
      c.res.headers.delete("Content-Type");
      return new Response(null, {
        headers: c.res.headers,
        status: 204,
        statusText: "No Content"
      });
    }
    await next();
    if (opts.origin !== "*") {
      c.header("Vary", "Origin", { append: true });
    }
  }, "cors2");
}, "cors");

// ../../node_modules/hono/dist/utils/cookie.js
var algorithm = { name: "HMAC", hash: "SHA-256" };
var getCryptoKey = /* @__PURE__ */ __name(async (secret) => {
  const secretBuf = typeof secret === "string" ? new TextEncoder().encode(secret) : secret;
  return await crypto.subtle.importKey("raw", secretBuf, algorithm, false, ["sign", "verify"]);
}, "getCryptoKey");
var verifySignature = /* @__PURE__ */ __name(async (base64Signature, value, secret) => {
  try {
    const signatureBinStr = atob(base64Signature);
    const signature = new Uint8Array(signatureBinStr.length);
    for (let i = 0, len = signatureBinStr.length; i < len; i++) {
      signature[i] = signatureBinStr.charCodeAt(i);
    }
    return await crypto.subtle.verify(algorithm, secret, signature, new TextEncoder().encode(value));
  } catch {
    return false;
  }
}, "verifySignature");
var validCookieNameRegEx = /^[\w!#$%&'*.^`|~+-]+$/;
var validCookieValueRegEx = /^[ !#-:<-[\]-~]*$/;
var parse = /* @__PURE__ */ __name((cookie, name) => {
  if (name && cookie.indexOf(name) === -1) {
    return {};
  }
  const pairs = cookie.trim().split(";");
  const parsedCookie = {};
  for (let pairStr of pairs) {
    pairStr = pairStr.trim();
    const valueStartPos = pairStr.indexOf("=");
    if (valueStartPos === -1) {
      continue;
    }
    const cookieName = pairStr.substring(0, valueStartPos).trim();
    if (name && name !== cookieName || !validCookieNameRegEx.test(cookieName)) {
      continue;
    }
    let cookieValue = pairStr.substring(valueStartPos + 1).trim();
    if (cookieValue.startsWith('"') && cookieValue.endsWith('"')) {
      cookieValue = cookieValue.slice(1, -1);
    }
    if (validCookieValueRegEx.test(cookieValue)) {
      parsedCookie[cookieName] = cookieValue.indexOf("%") !== -1 ? tryDecode(cookieValue, decodeURIComponent_) : cookieValue;
      if (name) {
        break;
      }
    }
  }
  return parsedCookie;
}, "parse");
var parseSigned = /* @__PURE__ */ __name(async (cookie, secret, name) => {
  const parsedCookie = {};
  const secretKey = await getCryptoKey(secret);
  for (const [key, value] of Object.entries(parse(cookie, name))) {
    const signatureStartPos = value.lastIndexOf(".");
    if (signatureStartPos < 1) {
      continue;
    }
    const signedValue = value.substring(0, signatureStartPos);
    const signature = value.substring(signatureStartPos + 1);
    if (signature.length !== 44 || !signature.endsWith("=")) {
      continue;
    }
    const isVerified = await verifySignature(signature, signedValue, secretKey);
    parsedCookie[key] = isVerified ? signedValue : false;
  }
  return parsedCookie;
}, "parseSigned");

// ../../node_modules/hono/dist/helper/cookie/index.js
var getCookie = /* @__PURE__ */ __name((c, key, prefix) => {
  const cookie = c.req.raw.headers.get("Cookie");
  if (typeof key === "string") {
    if (!cookie) {
      return void 0;
    }
    let finalKey = key;
    if (prefix === "secure") {
      finalKey = "__Secure-" + key;
    } else if (prefix === "host") {
      finalKey = "__Host-" + key;
    }
    const obj2 = parse(cookie, finalKey);
    return obj2[finalKey];
  }
  if (!cookie) {
    return {};
  }
  const obj = parse(cookie);
  return obj;
}, "getCookie");
var getSignedCookie = /* @__PURE__ */ __name(async (c, secret, key, prefix) => {
  const cookie = c.req.raw.headers.get("Cookie");
  if (typeof key === "string") {
    if (!cookie) {
      return void 0;
    }
    let finalKey = key;
    if (prefix === "secure") {
      finalKey = "__Secure-" + key;
    } else if (prefix === "host") {
      finalKey = "__Host-" + key;
    }
    const obj2 = await parseSigned(cookie, secret, finalKey);
    return obj2[finalKey];
  }
  if (!cookie) {
    return {};
  }
  const obj = await parseSigned(cookie, secret);
  return obj;
}, "getSignedCookie");

// ../../node_modules/hono/dist/utils/encode.js
var decodeBase64Url = /* @__PURE__ */ __name((str) => {
  return decodeBase64(str.replace(/_|-/g, (m) => ({ _: "/", "-": "+" })[m] ?? m));
}, "decodeBase64Url");
var encodeBase64Url = /* @__PURE__ */ __name((buf) => encodeBase64(buf).replace(/\/|\+/g, (m) => ({ "/": "_", "+": "-" })[m] ?? m), "encodeBase64Url");
var encodeBase64 = /* @__PURE__ */ __name((buf) => {
  let binary = "";
  const bytes = new Uint8Array(buf);
  for (let i = 0, len = bytes.length; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}, "encodeBase64");
var decodeBase64 = /* @__PURE__ */ __name((str) => {
  const binary = atob(str);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  const half = binary.length / 2;
  for (let i = 0, j = binary.length - 1; i <= half; i++, j--) {
    bytes[i] = binary.charCodeAt(i);
    bytes[j] = binary.charCodeAt(j);
  }
  return bytes;
}, "decodeBase64");

// ../../node_modules/hono/dist/utils/jwt/jwa.js
var AlgorithmTypes = /* @__PURE__ */ ((AlgorithmTypes2) => {
  AlgorithmTypes2["HS256"] = "HS256";
  AlgorithmTypes2["HS384"] = "HS384";
  AlgorithmTypes2["HS512"] = "HS512";
  AlgorithmTypes2["RS256"] = "RS256";
  AlgorithmTypes2["RS384"] = "RS384";
  AlgorithmTypes2["RS512"] = "RS512";
  AlgorithmTypes2["PS256"] = "PS256";
  AlgorithmTypes2["PS384"] = "PS384";
  AlgorithmTypes2["PS512"] = "PS512";
  AlgorithmTypes2["ES256"] = "ES256";
  AlgorithmTypes2["ES384"] = "ES384";
  AlgorithmTypes2["ES512"] = "ES512";
  AlgorithmTypes2["EdDSA"] = "EdDSA";
  return AlgorithmTypes2;
})(AlgorithmTypes || {});

// ../../node_modules/hono/dist/helper/adapter/index.js
var knownUserAgents = {
  deno: "Deno",
  bun: "Bun",
  workerd: "Cloudflare-Workers",
  node: "Node.js"
};
var getRuntimeKey = /* @__PURE__ */ __name(() => {
  const global = globalThis;
  const userAgentSupported = typeof navigator !== "undefined" && true;
  if (userAgentSupported) {
    for (const [runtimeKey, userAgent] of Object.entries(knownUserAgents)) {
      if (checkUserAgentEquals(userAgent)) {
        return runtimeKey;
      }
    }
  }
  if (typeof global?.EdgeRuntime === "string") {
    return "edge-light";
  }
  if (global?.fastly !== void 0) {
    return "fastly";
  }
  if (global?.process?.release?.name === "node") {
    return "node";
  }
  return "other";
}, "getRuntimeKey");
var checkUserAgentEquals = /* @__PURE__ */ __name((platform) => {
  const userAgent = "Cloudflare-Workers";
  return userAgent.startsWith(platform);
}, "checkUserAgentEquals");

// ../../node_modules/hono/dist/utils/jwt/types.js
var JwtAlgorithmNotImplemented = class extends Error {
  static {
    __name(this, "JwtAlgorithmNotImplemented");
  }
  constructor(alg) {
    super(`${alg} is not an implemented algorithm`);
    this.name = "JwtAlgorithmNotImplemented";
  }
};
var JwtAlgorithmRequired = class extends Error {
  static {
    __name(this, "JwtAlgorithmRequired");
  }
  constructor() {
    super('JWT verification requires "alg" option to be specified');
    this.name = "JwtAlgorithmRequired";
  }
};
var JwtAlgorithmMismatch = class extends Error {
  static {
    __name(this, "JwtAlgorithmMismatch");
  }
  constructor(expected, actual) {
    super(`JWT algorithm mismatch: expected "${expected}", got "${actual}"`);
    this.name = "JwtAlgorithmMismatch";
  }
};
var JwtTokenInvalid = class extends Error {
  static {
    __name(this, "JwtTokenInvalid");
  }
  constructor(token) {
    super(`invalid JWT token: ${token}`);
    this.name = "JwtTokenInvalid";
  }
};
var JwtTokenNotBefore = class extends Error {
  static {
    __name(this, "JwtTokenNotBefore");
  }
  constructor(token) {
    super(`token (${token}) is being used before it's valid`);
    this.name = "JwtTokenNotBefore";
  }
};
var JwtTokenExpired = class extends Error {
  static {
    __name(this, "JwtTokenExpired");
  }
  constructor(token) {
    super(`token (${token}) expired`);
    this.name = "JwtTokenExpired";
  }
};
var JwtTokenIssuedAt = class extends Error {
  static {
    __name(this, "JwtTokenIssuedAt");
  }
  constructor(currentTimestamp, iat) {
    super(
      `Invalid "iat" claim, must be a valid number lower than "${currentTimestamp}" (iat: "${iat}")`
    );
    this.name = "JwtTokenIssuedAt";
  }
};
var JwtTokenIssuer = class extends Error {
  static {
    __name(this, "JwtTokenIssuer");
  }
  constructor(expected, iss) {
    super(`expected issuer "${expected}", got ${iss ? `"${iss}"` : "none"} `);
    this.name = "JwtTokenIssuer";
  }
};
var JwtHeaderInvalid = class extends Error {
  static {
    __name(this, "JwtHeaderInvalid");
  }
  constructor(header) {
    super(`jwt header is invalid: ${JSON.stringify(header)}`);
    this.name = "JwtHeaderInvalid";
  }
};
var JwtHeaderRequiresKid = class extends Error {
  static {
    __name(this, "JwtHeaderRequiresKid");
  }
  constructor(header) {
    super(`required "kid" in jwt header: ${JSON.stringify(header)}`);
    this.name = "JwtHeaderRequiresKid";
  }
};
var JwtSymmetricAlgorithmNotAllowed = class extends Error {
  static {
    __name(this, "JwtSymmetricAlgorithmNotAllowed");
  }
  constructor(alg) {
    super(`symmetric algorithm "${alg}" is not allowed for JWK verification`);
    this.name = "JwtSymmetricAlgorithmNotAllowed";
  }
};
var JwtAlgorithmNotAllowed = class extends Error {
  static {
    __name(this, "JwtAlgorithmNotAllowed");
  }
  constructor(alg, allowedAlgorithms) {
    super(`algorithm "${alg}" is not in the allowed list: [${allowedAlgorithms.join(", ")}]`);
    this.name = "JwtAlgorithmNotAllowed";
  }
};
var JwtTokenSignatureMismatched = class extends Error {
  static {
    __name(this, "JwtTokenSignatureMismatched");
  }
  constructor(token) {
    super(`token(${token}) signature mismatched`);
    this.name = "JwtTokenSignatureMismatched";
  }
};
var JwtPayloadRequiresAud = class extends Error {
  static {
    __name(this, "JwtPayloadRequiresAud");
  }
  constructor(payload) {
    super(`required "aud" in jwt payload: ${JSON.stringify(payload)}`);
    this.name = "JwtPayloadRequiresAud";
  }
};
var JwtTokenAudience = class extends Error {
  static {
    __name(this, "JwtTokenAudience");
  }
  constructor(expected, aud) {
    super(
      `expected audience "${Array.isArray(expected) ? expected.join(", ") : expected}", got "${aud}"`
    );
    this.name = "JwtTokenAudience";
  }
};
var CryptoKeyUsage = /* @__PURE__ */ ((CryptoKeyUsage2) => {
  CryptoKeyUsage2["Encrypt"] = "encrypt";
  CryptoKeyUsage2["Decrypt"] = "decrypt";
  CryptoKeyUsage2["Sign"] = "sign";
  CryptoKeyUsage2["Verify"] = "verify";
  CryptoKeyUsage2["DeriveKey"] = "deriveKey";
  CryptoKeyUsage2["DeriveBits"] = "deriveBits";
  CryptoKeyUsage2["WrapKey"] = "wrapKey";
  CryptoKeyUsage2["UnwrapKey"] = "unwrapKey";
  return CryptoKeyUsage2;
})(CryptoKeyUsage || {});

// ../../node_modules/hono/dist/utils/jwt/utf8.js
var utf8Encoder = new TextEncoder();
var utf8Decoder = new TextDecoder();

// ../../node_modules/hono/dist/utils/jwt/jws.js
async function signing(privateKey, alg, data) {
  const algorithm2 = getKeyAlgorithm(alg);
  const cryptoKey = await importPrivateKey(privateKey, algorithm2);
  return await crypto.subtle.sign(algorithm2, cryptoKey, data);
}
__name(signing, "signing");
async function verifying(publicKey, alg, signature, data) {
  const algorithm2 = getKeyAlgorithm(alg);
  const cryptoKey = await importPublicKey(publicKey, algorithm2);
  return await crypto.subtle.verify(algorithm2, cryptoKey, signature, data);
}
__name(verifying, "verifying");
function pemToBinary(pem) {
  return decodeBase64(pem.replace(/-+(BEGIN|END).*/g, "").replace(/\s/g, ""));
}
__name(pemToBinary, "pemToBinary");
async function importPrivateKey(key, alg) {
  if (!crypto.subtle || !crypto.subtle.importKey) {
    throw new Error("`crypto.subtle.importKey` is undefined. JWT auth middleware requires it.");
  }
  if (isCryptoKey(key)) {
    if (key.type !== "private" && key.type !== "secret") {
      throw new Error(
        `unexpected key type: CryptoKey.type is ${key.type}, expected private or secret`
      );
    }
    return key;
  }
  const usages = [CryptoKeyUsage.Sign];
  if (typeof key === "object") {
    return await crypto.subtle.importKey("jwk", key, alg, false, usages);
  }
  if (key.includes("PRIVATE")) {
    return await crypto.subtle.importKey("pkcs8", pemToBinary(key), alg, false, usages);
  }
  return await crypto.subtle.importKey("raw", utf8Encoder.encode(key), alg, false, usages);
}
__name(importPrivateKey, "importPrivateKey");
async function importPublicKey(key, alg) {
  if (!crypto.subtle || !crypto.subtle.importKey) {
    throw new Error("`crypto.subtle.importKey` is undefined. JWT auth middleware requires it.");
  }
  if (isCryptoKey(key)) {
    if (key.type === "public" || key.type === "secret") {
      return key;
    }
    key = await exportPublicJwkFrom(key);
  }
  if (typeof key === "string" && key.includes("PRIVATE")) {
    const privateKey = await crypto.subtle.importKey("pkcs8", pemToBinary(key), alg, true, [
      CryptoKeyUsage.Sign
    ]);
    key = await exportPublicJwkFrom(privateKey);
  }
  const usages = [CryptoKeyUsage.Verify];
  if (typeof key === "object") {
    return await crypto.subtle.importKey("jwk", key, alg, false, usages);
  }
  if (key.includes("PUBLIC")) {
    return await crypto.subtle.importKey("spki", pemToBinary(key), alg, false, usages);
  }
  return await crypto.subtle.importKey("raw", utf8Encoder.encode(key), alg, false, usages);
}
__name(importPublicKey, "importPublicKey");
async function exportPublicJwkFrom(privateKey) {
  if (privateKey.type !== "private") {
    throw new Error(`unexpected key type: ${privateKey.type}`);
  }
  if (!privateKey.extractable) {
    throw new Error("unexpected private key is unextractable");
  }
  const jwk = await crypto.subtle.exportKey("jwk", privateKey);
  const { kty } = jwk;
  const { alg, e, n } = jwk;
  const { crv, x, y } = jwk;
  return { kty, alg, e, n, crv, x, y, key_ops: [CryptoKeyUsage.Verify] };
}
__name(exportPublicJwkFrom, "exportPublicJwkFrom");
function getKeyAlgorithm(name) {
  switch (name) {
    case "HS256":
      return {
        name: "HMAC",
        hash: {
          name: "SHA-256"
        }
      };
    case "HS384":
      return {
        name: "HMAC",
        hash: {
          name: "SHA-384"
        }
      };
    case "HS512":
      return {
        name: "HMAC",
        hash: {
          name: "SHA-512"
        }
      };
    case "RS256":
      return {
        name: "RSASSA-PKCS1-v1_5",
        hash: {
          name: "SHA-256"
        }
      };
    case "RS384":
      return {
        name: "RSASSA-PKCS1-v1_5",
        hash: {
          name: "SHA-384"
        }
      };
    case "RS512":
      return {
        name: "RSASSA-PKCS1-v1_5",
        hash: {
          name: "SHA-512"
        }
      };
    case "PS256":
      return {
        name: "RSA-PSS",
        hash: {
          name: "SHA-256"
        },
        saltLength: 32
        // 256 >> 3
      };
    case "PS384":
      return {
        name: "RSA-PSS",
        hash: {
          name: "SHA-384"
        },
        saltLength: 48
        // 384 >> 3
      };
    case "PS512":
      return {
        name: "RSA-PSS",
        hash: {
          name: "SHA-512"
        },
        saltLength: 64
        // 512 >> 3,
      };
    case "ES256":
      return {
        name: "ECDSA",
        hash: {
          name: "SHA-256"
        },
        namedCurve: "P-256"
      };
    case "ES384":
      return {
        name: "ECDSA",
        hash: {
          name: "SHA-384"
        },
        namedCurve: "P-384"
      };
    case "ES512":
      return {
        name: "ECDSA",
        hash: {
          name: "SHA-512"
        },
        namedCurve: "P-521"
      };
    case "EdDSA":
      return {
        name: "Ed25519",
        namedCurve: "Ed25519"
      };
    default:
      throw new JwtAlgorithmNotImplemented(name);
  }
}
__name(getKeyAlgorithm, "getKeyAlgorithm");
function isCryptoKey(key) {
  const runtime = getRuntimeKey();
  if (runtime === "node" && !!crypto.webcrypto) {
    return key instanceof crypto.webcrypto.CryptoKey;
  }
  return key instanceof CryptoKey;
}
__name(isCryptoKey, "isCryptoKey");

// ../../node_modules/hono/dist/utils/jwt/jwt.js
var encodeJwtPart = /* @__PURE__ */ __name((part) => encodeBase64Url(utf8Encoder.encode(JSON.stringify(part)).buffer).replace(/=/g, ""), "encodeJwtPart");
var encodeSignaturePart = /* @__PURE__ */ __name((buf) => encodeBase64Url(buf).replace(/=/g, ""), "encodeSignaturePart");
var decodeJwtPart = /* @__PURE__ */ __name((part) => JSON.parse(utf8Decoder.decode(decodeBase64Url(part))), "decodeJwtPart");
function isTokenHeader(obj) {
  if (typeof obj === "object" && obj !== null) {
    const objWithAlg = obj;
    return "alg" in objWithAlg && Object.values(AlgorithmTypes).includes(objWithAlg.alg) && (!("typ" in objWithAlg) || objWithAlg.typ === "JWT");
  }
  return false;
}
__name(isTokenHeader, "isTokenHeader");
var sign = /* @__PURE__ */ __name(async (payload, privateKey, alg = "HS256") => {
  const encodedPayload = encodeJwtPart(payload);
  let encodedHeader;
  if (typeof privateKey === "object" && "alg" in privateKey) {
    alg = privateKey.alg;
    encodedHeader = encodeJwtPart({ alg, typ: "JWT", kid: privateKey.kid });
  } else {
    encodedHeader = encodeJwtPart({ alg, typ: "JWT" });
  }
  const partialToken = `${encodedHeader}.${encodedPayload}`;
  const signaturePart = await signing(privateKey, alg, utf8Encoder.encode(partialToken));
  const signature = encodeSignaturePart(signaturePart);
  return `${partialToken}.${signature}`;
}, "sign");
var verify = /* @__PURE__ */ __name(async (token, publicKey, algOrOptions) => {
  if (!algOrOptions) {
    throw new JwtAlgorithmRequired();
  }
  const {
    alg,
    iss,
    nbf = true,
    exp = true,
    iat = true,
    aud
  } = typeof algOrOptions === "string" ? { alg: algOrOptions } : algOrOptions;
  if (!alg) {
    throw new JwtAlgorithmRequired();
  }
  const tokenParts = token.split(".");
  if (tokenParts.length !== 3) {
    throw new JwtTokenInvalid(token);
  }
  const { header, payload } = decode(token);
  if (!isTokenHeader(header)) {
    throw new JwtHeaderInvalid(header);
  }
  if (header.alg !== alg) {
    throw new JwtAlgorithmMismatch(alg, header.alg);
  }
  const now3 = Math.floor(Date.now() / 1e3);
  if (nbf && payload.nbf && payload.nbf > now3) {
    throw new JwtTokenNotBefore(token);
  }
  if (exp && payload.exp && payload.exp <= now3) {
    throw new JwtTokenExpired(token);
  }
  if (iat && payload.iat && now3 < payload.iat) {
    throw new JwtTokenIssuedAt(now3, payload.iat);
  }
  if (iss) {
    if (!payload.iss) {
      throw new JwtTokenIssuer(iss, null);
    }
    if (typeof iss === "string" && payload.iss !== iss) {
      throw new JwtTokenIssuer(iss, payload.iss);
    }
    if (iss instanceof RegExp && !iss.test(payload.iss)) {
      throw new JwtTokenIssuer(iss, payload.iss);
    }
  }
  if (aud) {
    if (!payload.aud) {
      throw new JwtPayloadRequiresAud(payload);
    }
    const audiences = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
    const matched = audiences.some(
      (payloadAud) => aud instanceof RegExp ? aud.test(payloadAud) : typeof aud === "string" ? payloadAud === aud : Array.isArray(aud) && aud.includes(payloadAud)
    );
    if (!matched) {
      throw new JwtTokenAudience(aud, payload.aud);
    }
  }
  const headerPayload = token.substring(0, token.lastIndexOf("."));
  const verified = await verifying(
    publicKey,
    alg,
    decodeBase64Url(tokenParts[2]),
    utf8Encoder.encode(headerPayload)
  );
  if (!verified) {
    throw new JwtTokenSignatureMismatched(token);
  }
  return payload;
}, "verify");
var symmetricAlgorithms = [
  AlgorithmTypes.HS256,
  AlgorithmTypes.HS384,
  AlgorithmTypes.HS512
];
var verifyWithJwks = /* @__PURE__ */ __name(async (token, options, init) => {
  const verifyOpts = options.verification || {};
  const header = decodeHeader(token);
  if (!isTokenHeader(header)) {
    throw new JwtHeaderInvalid(header);
  }
  if (!header.kid) {
    throw new JwtHeaderRequiresKid(header);
  }
  if (symmetricAlgorithms.includes(header.alg)) {
    throw new JwtSymmetricAlgorithmNotAllowed(header.alg);
  }
  if (!options.allowedAlgorithms.includes(header.alg)) {
    throw new JwtAlgorithmNotAllowed(header.alg, options.allowedAlgorithms);
  }
  let verifyKeys = options.keys ? [...options.keys] : void 0;
  if (options.jwks_uri) {
    const response = await fetch(options.jwks_uri, init);
    if (!response.ok) {
      throw new Error(`failed to fetch JWKS from ${options.jwks_uri}`);
    }
    const data = await response.json();
    if (!data.keys) {
      throw new Error('invalid JWKS response. "keys" field is missing');
    }
    if (!Array.isArray(data.keys)) {
      throw new Error('invalid JWKS response. "keys" field is not an array');
    }
    verifyKeys ??= [];
    verifyKeys.push(...data.keys);
  } else if (!verifyKeys) {
    throw new Error('verifyWithJwks requires options for either "keys" or "jwks_uri" or both');
  }
  const matchingKey = verifyKeys.find((key) => key.kid === header.kid);
  if (!matchingKey) {
    throw new JwtTokenInvalid(token);
  }
  if (matchingKey.alg && matchingKey.alg !== header.alg) {
    throw new JwtAlgorithmMismatch(matchingKey.alg, header.alg);
  }
  return await verify(token, matchingKey, {
    alg: header.alg,
    ...verifyOpts
  });
}, "verifyWithJwks");
var decode = /* @__PURE__ */ __name((token) => {
  try {
    const [h, p] = token.split(".");
    const header = decodeJwtPart(h);
    const payload = decodeJwtPart(p);
    return {
      header,
      payload
    };
  } catch {
    throw new JwtTokenInvalid(token);
  }
}, "decode");
var decodeHeader = /* @__PURE__ */ __name((token) => {
  try {
    const [h] = token.split(".");
    return decodeJwtPart(h);
  } catch {
    throw new JwtTokenInvalid(token);
  }
}, "decodeHeader");

// ../../node_modules/hono/dist/utils/jwt/index.js
var Jwt = { sign, verify, decode, verifyWithJwks };

// ../../node_modules/hono/dist/middleware/jwt/jwt.js
var jwt = /* @__PURE__ */ __name((options) => {
  const verifyOpts = options.verification || {};
  if (!options || !options.secret) {
    throw new Error('JWT auth middleware requires options for "secret"');
  }
  if (!options.alg) {
    throw new Error('JWT auth middleware requires options for "alg"');
  }
  if (!crypto.subtle || !crypto.subtle.importKey) {
    throw new Error("`crypto.subtle.importKey` is undefined. JWT auth middleware requires it.");
  }
  return /* @__PURE__ */ __name(async function jwt2(ctx, next) {
    const headerName = options.headerName || "Authorization";
    const credentials = ctx.req.raw.headers.get(headerName);
    let token;
    if (credentials) {
      const parts = credentials.split(/\s+/);
      if (parts.length !== 2) {
        const errDescription = "invalid credentials structure";
        throw new HTTPException(401, {
          message: errDescription,
          res: unauthorizedResponse({
            ctx,
            error: "invalid_request",
            errDescription
          })
        });
      } else {
        token = parts[1];
      }
    } else if (options.cookie) {
      if (typeof options.cookie == "string") {
        token = getCookie(ctx, options.cookie);
      } else if (options.cookie.secret) {
        if (options.cookie.prefixOptions) {
          token = await getSignedCookie(
            ctx,
            options.cookie.secret,
            options.cookie.key,
            options.cookie.prefixOptions
          );
        } else {
          token = await getSignedCookie(ctx, options.cookie.secret, options.cookie.key);
        }
      } else {
        if (options.cookie.prefixOptions) {
          token = getCookie(ctx, options.cookie.key, options.cookie.prefixOptions);
        } else {
          token = getCookie(ctx, options.cookie.key);
        }
      }
    }
    if (!token) {
      const errDescription = "no authorization included in request";
      throw new HTTPException(401, {
        message: errDescription,
        res: unauthorizedResponse({
          ctx,
          error: "invalid_request",
          errDescription
        })
      });
    }
    let payload;
    let cause;
    try {
      payload = await Jwt.verify(token, options.secret, {
        alg: options.alg,
        ...verifyOpts
      });
    } catch (e) {
      cause = e;
    }
    if (!payload) {
      throw new HTTPException(401, {
        message: "Unauthorized",
        res: unauthorizedResponse({
          ctx,
          error: "invalid_token",
          statusText: "Unauthorized",
          errDescription: "token verification failure"
        }),
        cause
      });
    }
    ctx.set("jwtPayload", payload);
    await next();
  }, "jwt2");
}, "jwt");
function unauthorizedResponse(opts) {
  return new Response("Unauthorized", {
    status: 401,
    statusText: opts.statusText,
    headers: {
      "WWW-Authenticate": `Bearer realm="${opts.ctx.req.url}",error="${opts.error}",error_description="${opts.errDescription}"`
    }
  });
}
__name(unauthorizedResponse, "unauthorizedResponse");
var verifyWithJwks2 = Jwt.verifyWithJwks;
var verify2 = Jwt.verify;
var decode2 = Jwt.decode;
var sign2 = Jwt.sign;

// src/routes/auth.js
var auth = new Hono2();
auth.post("/login", async (c) => {
  const { username, email, password } = await c.req.json();
  const identifier = username || email;
  if (!identifier || !password) return c.json({ error: "Username and password required" }, 400);
  const user = await c.env.DB.prepare(
    `SELECT * FROM users WHERE (username=? OR email=?) AND status='active'`
  ).bind(identifier, identifier).first();
  if (!user) return c.json({ error: "Invalid credentials" }, 401);
  if (!user.password_hash || user.password_hash !== password)
    return c.json({ error: "Invalid credentials" }, 401);
  await c.env.DB.prepare(`UPDATE users SET last_login=? WHERE id=?`).bind(Date.now(), user.id).run();
  const token = await sign2({
    sub: user.id,
    username: user.username,
    name: user.full_name,
    email: user.email,
    role: user.role,
    permissions: user.permissions,
    default_location_id: user.default_location_id,
    exp: Math.floor(Date.now() / 1e3) + 86400
    // 24h
  }, c.env.JWT_SECRET, "HS256");
  return c.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      fullName: user.full_name,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
      defaultLocationId: user.default_location_id
    }
  });
});
auth.post("/logout", (c) => c.json({ ok: true }));
auth.get("/me", async (c) => {
  const p = c.get("jwtPayload");
  const user = await c.env.DB.prepare(
    `SELECT id, username, full_name, email, role, permissions, default_location_id, status FROM users WHERE id=?`
  ).bind(p.sub).first();
  return c.json(user);
});
var auth_default = auth;

// src/lib/audit.js
async function audit(db, action, entityType, entityId, userId, details, locationId = null) {
  await db.prepare(
    `INSERT INTO audit_log (action, entity_type, entity_id, location_id, user_id, timestamp, details)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).bind(action, entityType, entityId, locationId, userId, Date.now(), details).run();
}
__name(audit, "audit");
var now = /* @__PURE__ */ __name(() => Date.now(), "now");

// src/routes/tools.js
var tools = new Hono2();
tools.get("/", async (c) => {
  const { locationId, status, search } = c.req.query();
  let q = `SELECT t.*, s.name supplier_name,
    COALESCE((SELECT SUM(tl.quantity) FROM tool_locations tl WHERE tl.tool_id=t.id), 0) total_stock,
    COALESCE((SELECT SUM(tl.reserved_quantity) FROM tool_locations tl WHERE tl.tool_id=t.id), 0) total_reserved
    FROM tools t LEFT JOIN suppliers s ON s.id=t.supplier_id WHERE 1=1`;
  const p = [];
  if (status) {
    q += ` AND t.status=?`;
    p.push(status);
  } else {
    q += ` AND t.status != 'deleted'`;
  }
  if (locationId) {
    q += ` AND EXISTS (SELECT 1 FROM tool_locations tl WHERE tl.tool_id=t.id AND tl.location_id=?)`;
    p.push(locationId);
  }
  if (search) {
    q += ` AND (t.name LIKE ? OR t.sku LIKE ? OR t.brand LIKE ? OR t.category LIKE ?)`;
    p.push(...Array(4).fill(`%${search}%`));
  }
  q += ` ORDER BY t.name`;
  const { results } = await c.env.DB.prepare(q).bind(...p).all();
  return c.json(results);
});
tools.get("/:id", async (c) => {
  const id = parseInt(c.req.param("id"));
  const tool = await c.env.DB.prepare(
    `SELECT t.*, s.name supplier_name FROM tools t LEFT JOIN suppliers s ON s.id=t.supplier_id WHERE t.id=?`
  ).bind(id).first();
  if (!tool) return c.json({ error: "Not found" }, 404);
  const { results: stock2 } = await c.env.DB.prepare(
    `SELECT tl.*, l.name loc_name FROM tool_locations tl JOIN locations l ON l.id=tl.location_id WHERE tl.tool_id=?`
  ).bind(id).all();
  const { results: movements } = await c.env.DB.prepare(
    `SELECT sm.*, l.name loc_name FROM stock_movements sm JOIN locations l ON l.id=sm.location_id WHERE sm.tool_id=? ORDER BY sm.performed_at DESC LIMIT 50`
  ).bind(id).all();
  const { results: loans } = await c.env.DB.prepare(
    `SELECT ld.*, w.name worker_name, l.name loc_name FROM lending ld
     JOIN workers w ON w.id=ld.worker_id JOIN locations l ON l.id=ld.location_id
     WHERE ld.tool_id=? AND ld.actual_return_date IS NULL ORDER BY ld.date_out DESC`
  ).bind(id).all();
  const { results: maintenance } = await c.env.DB.prepare(
    `SELECT tm.*, l.name loc_name FROM tool_maintenance tm JOIN locations l ON l.id=tm.location_id WHERE tm.tool_id=? ORDER BY tm.created_at DESC`
  ).bind(id).all();
  return c.json({ ...tool, stock: stock2, movements, loans, maintenance });
});
tools.post("/", async (c) => {
  const b = await c.req.json();
  const user = c.get("jwtPayload");
  if (!b.sku || !b.name) return c.json({ error: "SKU and name required" }, 400);
  const r = await c.env.DB.prepare(
    `INSERT INTO tools (sku, name, description, category, brand, model, serial_number, supplier_id, min_stock_level, unit_of_measure, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)`
  ).bind(
    b.sku.toUpperCase(),
    b.name,
    b.description || "",
    b.category || "",
    b.brand || "",
    b.model || "",
    b.serialNumber || "",
    b.supplierId || null,
    b.minStockLevel || 0,
    b.unitOfMeasure || "piece",
    now(),
    now()
  ).run();
  const id = r.meta.last_row_id;
  const { results: locs } = await c.env.DB.prepare(`SELECT id FROM locations WHERE status='active'`).all();
  for (const loc of locs) {
    await c.env.DB.prepare(
      `INSERT OR IGNORE INTO tool_locations (tool_id, location_id, quantity, reserved_quantity, min_stock_level, max_stock_level, last_updated) VALUES (?,?,0,0,?,0,?)`
    ).bind(id, loc.id, b.minStockLevel || 0, now()).run();
  }
  await audit(c.env.DB, "tool_create", "tool", id, user.username, `Created tool ${b.sku} \u2014 ${b.name}`);
  return c.json({ ok: true, id }, 201);
});
tools.put("/:id", async (c) => {
  const id = parseInt(c.req.param("id"));
  const b = await c.req.json();
  const user = c.get("jwtPayload");
  await c.env.DB.prepare(
    `UPDATE tools SET name=?, description=?, category=?, brand=?, model=?, serial_number=?, supplier_id=?, min_stock_level=?, unit_of_measure=?, updated_at=? WHERE id=?`
  ).bind(
    b.name,
    b.description || "",
    b.category || "",
    b.brand || "",
    b.model || "",
    b.serialNumber || "",
    b.supplierId || null,
    b.minStockLevel || 0,
    b.unitOfMeasure || "piece",
    now(),
    id
  ).run();
  await audit(c.env.DB, "tool_update", "tool", id, user.username, `Updated tool #${id}`);
  return c.json({ ok: true });
});
tools.delete("/:id", async (c) => {
  const id = parseInt(c.req.param("id"));
  const user = c.get("jwtPayload");
  const active = await c.env.DB.prepare(
    `SELECT COUNT(*) c FROM lending WHERE tool_id=? AND actual_return_date IS NULL AND status='active'`
  ).bind(id).first("c");
  if (active > 0) return c.json({ error: "Cannot delete \u2014 tool has active loans" }, 400);
  await c.env.DB.prepare(`UPDATE tools SET status='deleted', updated_at=? WHERE id=?`).bind(now(), id).run();
  await audit(c.env.DB, "tool_delete", "tool", id, user.username, `Soft deleted tool #${id}`);
  return c.json({ ok: true });
});
tools.post("/:id/adjust-stock", async (c) => {
  const id = parseInt(c.req.param("id"));
  const { location_id, quantity, reason } = await c.req.json();
  const user = c.get("jwtPayload");
  const row = await c.env.DB.prepare(
    `SELECT quantity FROM tool_locations WHERE tool_id=? AND location_id=?`
  ).bind(id, location_id).first();
  const current = row?.quantity || 0;
  const diff = quantity - current;
  if (diff === 0) return c.json({ ok: true, message: "No change" });
  await c.env.DB.prepare(
    `UPDATE tool_locations SET quantity=?, last_updated=? WHERE tool_id=? AND location_id=?`
  ).bind(quantity, now(), id, location_id).run();
  await c.env.DB.prepare(
    `INSERT INTO stock_movements (tool_id, location_id, movement_type, quantity, notes, performed_by, performed_at, timestamp)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    id,
    location_id,
    diff > 0 ? "stock_in" : "stock_out",
    Math.abs(diff),
    reason || "Manual adjustment",
    user.username,
    now(),
    now()
  ).run();
  await audit(
    c.env.DB,
    "stock_adjust",
    "tool",
    id,
    user.username,
    `Stock adjusted ${diff > 0 ? "+" : ""}${diff} (now ${quantity}) \u2014 ${reason}`,
    location_id
  );
  return c.json({ ok: true, previous: current, new: quantity, diff });
});
tools.post("/:id/maintenance/send", async (c) => {
  const id = parseInt(c.req.param("id"));
  const { location_id, units, reason, expected_completion } = await c.req.json();
  const user = c.get("jwtPayload");
  const avail = await c.env.DB.prepare(
    `SELECT quantity FROM tool_locations WHERE tool_id=? AND location_id=?`
  ).bind(id, location_id).first("quantity");
  if ((avail || 0) < units) return c.json({ error: `Only ${avail || 0} available` }, 400);
  const r = await c.env.DB.prepare(
    `INSERT INTO tool_maintenance (tool_id, location_id, units_in_maintenance, maintenance_reason, started_at, expected_completion, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, 'in_progress', ?, ?)`
  ).bind(id, location_id, units, reason || "", now(), expected_completion || null, now(), now()).run();
  await c.env.DB.prepare(
    `UPDATE tool_locations SET quantity=quantity-?, last_updated=? WHERE tool_id=? AND location_id=?`
  ).bind(units, now(), id, location_id).run();
  await audit(
    c.env.DB,
    "maintenance_out",
    "tool",
    id,
    user.username,
    `Sent ${units} units to maintenance \u2014 ${reason}`,
    location_id
  );
  return c.json({ ok: true, id: r.meta.last_row_id });
});
tools.post("/:id/maintenance/return", async (c) => {
  const id = parseInt(c.req.param("id"));
  const { maintenance_id, units_returned, location_id } = await c.req.json();
  const user = c.get("jwtPayload");
  await c.env.DB.prepare(
    `UPDATE tool_maintenance SET status='completed', updated_at=? WHERE id=?`
  ).bind(now(), maintenance_id).run();
  await c.env.DB.prepare(
    `UPDATE tool_locations SET quantity=quantity+?, last_updated=? WHERE tool_id=? AND location_id=?`
  ).bind(units_returned, now(), id, location_id).run();
  await audit(
    c.env.DB,
    "maintenance_return",
    "tool",
    id,
    user.username,
    `Returned ${units_returned} units from maintenance #${maintenance_id}`,
    location_id
  );
  return c.json({ ok: true });
});
var tools_default = tools;

// src/routes/stock.js
var stock = new Hono2();
stock.get("/", async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT tl.*, t.name tool_name, t.sku, t.category, t.brand, l.name loc_name
     FROM tool_locations tl JOIN tools t ON t.id=tl.tool_id JOIN locations l ON l.id=tl.location_id
     WHERE t.status='active' ORDER BY t.name, l.name`
  ).all();
  return c.json(results);
});
stock.get("/movements", async (c) => {
  const { limit = "200", movement_type } = c.req.query();
  let q = `SELECT sm.*, t.name tool_name, t.sku, l.name loc_name FROM stock_movements sm
    JOIN tools t ON t.id=sm.tool_id JOIN locations l ON l.id=sm.location_id WHERE 1=1`;
  const p = [];
  if (movement_type) {
    q += ` AND sm.movement_type=?`;
    p.push(movement_type);
  }
  q += ` ORDER BY sm.performed_at DESC LIMIT ?`;
  p.push(parseInt(limit));
  const { results } = await c.env.DB.prepare(q).bind(...p).all();
  return c.json(results);
});
var stock_default = stock;

// src/routes/workers.js
var workers = new Hono2();
workers.get("/", async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT w.*,
      COUNT(CASE WHEN l.actual_return_date IS NULL AND l.status='active' THEN 1 END) active_loans,
      COUNT(CASE WHEN l.actual_return_date IS NOT NULL THEN 1 END) total_returns,
      ROUND(100.0 * SUM(CASE WHEN l.actual_return_date IS NOT NULL
        AND (l.expected_return_date IS NULL OR l.actual_return_date <= l.expected_return_date)
        THEN 1 ELSE 0 END)
        / NULLIF(COUNT(CASE WHEN l.actual_return_date IS NOT NULL THEN 1 END), 0), 0) reliability_score
     FROM workers w LEFT JOIN lending l ON l.worker_id=w.id
     WHERE w.status='active' GROUP BY w.id ORDER BY w.name`
  ).all();
  return c.json(results);
});
workers.get("/:id", async (c) => {
  const id = parseInt(c.req.param("id"));
  const worker = await c.env.DB.prepare(`SELECT * FROM workers WHERE id=?`).bind(id).first();
  if (!worker) return c.json({ error: "Not found" }, 404);
  const { results: loans } = await c.env.DB.prepare(
    `SELECT ld.*, t.name tool_name, t.sku, t.category, l.name loc_name
     FROM lending ld JOIN tools t ON t.id=ld.tool_id JOIN locations l ON l.id=ld.location_id
     WHERE ld.worker_id=? ORDER BY ld.date_out DESC`
  ).bind(id).all();
  return c.json({ ...worker, loans });
});
workers.post("/", async (c) => {
  const b = await c.req.json();
  const user = c.get("jwtPayload");
  if (!b.name) return c.json({ error: "Name required" }, 400);
  const r = await c.env.DB.prepare(
    `INSERT INTO workers (name, email, phone, address, company, worker_type, status, created_by)
     VALUES (?, ?, ?, ?, ?, ?, 'active', ?)`
  ).bind(
    b.name,
    b.email || "",
    b.phone || "",
    b.address || "",
    b.company || "employee",
    b.workerType || "",
    user.username
  ).run();
  await audit(c.env.DB, "worker_create", "worker", r.meta.last_row_id, user.username, `Added worker ${b.name}`);
  return c.json({ ok: true, id: r.meta.last_row_id }, 201);
});
workers.put("/:id", async (c) => {
  const id = parseInt(c.req.param("id"));
  const b = await c.req.json();
  const user = c.get("jwtPayload");
  await c.env.DB.prepare(
    `UPDATE workers SET name=?, email=?, phone=?, address=?, company=?, worker_type=?, updated_by=? WHERE id=?`
  ).bind(
    b.name,
    b.email || "",
    b.phone || "",
    b.address || "",
    b.company || "employee",
    b.workerType || "",
    user.username,
    id
  ).run();
  await audit(c.env.DB, "worker_update", "worker", id, user.username, `Updated worker #${id}`);
  return c.json({ ok: true });
});
workers.delete("/:id", async (c) => {
  const id = parseInt(c.req.param("id"));
  const user = c.get("jwtPayload");
  const active = await c.env.DB.prepare(
    `SELECT COUNT(*) c FROM lending WHERE worker_id=? AND actual_return_date IS NULL AND status='active'`
  ).bind(id).first("c");
  if (active > 0) return c.json({ error: "Cannot delete \u2014 worker has active loans" }, 400);
  await c.env.DB.prepare(`UPDATE workers SET status='inactive', updated_by=? WHERE id=?`).bind(user.username, id).run();
  await audit(c.env.DB, "worker_deactivate", "worker", id, user.username, `Deactivated worker #${id}`);
  return c.json({ ok: true });
});
var workers_default = workers;

// src/routes/lending.js
var lending = new Hono2();
lending.get("/", async (c) => {
  const { status, worker_id } = c.req.query();
  let where = `WHERE 1=1`;
  const p = [];
  if (status === "active") {
    where += ` AND ld.actual_return_date IS NULL AND ld.status='active'`;
  }
  if (status === "overdue") {
    where += ` AND ld.actual_return_date IS NULL AND ld.status='active' AND ld.expected_return_date < ?`;
    p.push(now());
  }
  if (status === "returned") {
    where += ` AND ld.actual_return_date IS NOT NULL`;
  }
  if (worker_id) {
    where += ` AND ld.worker_id=?`;
    p.push(parseInt(worker_id));
  }
  const { results } = await c.env.DB.prepare(
    `SELECT ld.*, t.name tool_name, t.sku, t.category, t.brand,
      w.name worker_name, w.phone worker_phone, w.worker_type, l.name loc_name
     FROM lending ld
     JOIN tools t ON t.id=ld.tool_id
     JOIN workers w ON w.id=ld.worker_id
     JOIN locations l ON l.id=ld.location_id
     ${where} ORDER BY ld.date_out DESC LIMIT 500`
  ).bind(...p).all();
  return c.json(results);
});
lending.post("/", async (c) => {
  const b = await c.req.json();
  const user = c.get("jwtPayload");
  const row = await c.env.DB.prepare(
    `SELECT quantity, reserved_quantity FROM tool_locations WHERE tool_id=? AND location_id=?`
  ).bind(b.toolId, b.locationId).first();
  const avail = (row?.quantity || 0) - (row?.reserved_quantity || 0);
  if (avail < b.quantity) return c.json({ error: `Only ${avail} available` }, 400);
  const r = await c.env.DB.prepare(
    `INSERT INTO lending (tool_id, worker_id, location_id, quantity, date_out, expected_return_date, project_code, job_site, issued_by, notes, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)`
  ).bind(
    b.toolId,
    b.workerId,
    b.locationId,
    b.quantity,
    b.dateOut || now(),
    b.expectedReturnDate || null,
    b.projectCode || "",
    b.jobSite || "",
    user.username,
    b.notes || "",
    now(),
    now()
  ).run();
  const lid = r.meta.last_row_id;
  await c.env.DB.prepare(
    `UPDATE tool_locations SET quantity=quantity-?, last_updated=? WHERE tool_id=? AND location_id=?`
  ).bind(b.quantity, now(), b.toolId, b.locationId).run();
  await c.env.DB.prepare(
    `INSERT INTO stock_movements (tool_id, location_id, movement_type, quantity, reference_type, reference_id, performed_by, performed_at, timestamp, notes)
     VALUES (?, ?, 'stock_out', ?, 'lending', ?, ?, ?, ?, ?)`
  ).bind(b.toolId, b.locationId, b.quantity, lid, user.username, now(), now(), b.notes || "").run();
  const t = await c.env.DB.prepare("SELECT name, sku FROM tools WHERE id=?").bind(b.toolId).first();
  const w = await c.env.DB.prepare("SELECT name FROM workers WHERE id=?").bind(b.workerId).first();
  await audit(
    c.env.DB,
    "lending_create",
    "lending",
    lid,
    user.username,
    `Issued ${b.quantity}x ${t?.sku} (${t?.name}) to ${w?.name}`,
    b.locationId
  );
  return c.json({ ok: true, id: lid }, 201);
});
lending.post("/:id/return", async (c) => {
  const lid = parseInt(c.req.param("id"));
  const b = await c.req.json();
  const user = c.get("jwtPayload");
  const loan = await c.env.DB.prepare(`SELECT * FROM lending WHERE id=?`).bind(lid).first();
  if (!loan) return c.json({ error: "Loan not found" }, 404);
  if (loan.actual_return_date) return c.json({ error: "Already returned" }, 400);
  const retLoc = b.returnLocationId || loan.location_id;
  await c.env.DB.prepare(
    `UPDATE lending SET actual_return_date=?, return_condition=?, returned_to=?, return_location_id=?, status='returned', updated_at=?,
     notes=CASE WHEN notes IS NULL OR notes='' THEN ? ELSE notes||char(10)||? END WHERE id=?`
  ).bind(
    now(),
    b.condition || "good",
    user.username,
    retLoc,
    now(),
    `Return: ${b.returnNote || ""}`,
    `Return: ${b.returnNote || ""}`,
    lid
  ).run();
  if (b.condition !== "lost") {
    await c.env.DB.prepare(
      `UPDATE tool_locations SET quantity=quantity+?, last_updated=? WHERE tool_id=? AND location_id=?`
    ).bind(loan.quantity, now(), loan.tool_id, retLoc).run();
  }
  await c.env.DB.prepare(
    `INSERT INTO stock_movements (tool_id, location_id, movement_type, quantity, reference_type, reference_id, performed_by, performed_at, timestamp, notes)
     VALUES (?, ?, 'stock_in', ?, 'lending_return', ?, ?, ?, ?, ?)`
  ).bind(
    loan.tool_id,
    retLoc,
    loan.quantity,
    lid,
    user.username,
    now(),
    now(),
    `Condition: ${b.condition || "good"}`
  ).run();
  const t = await c.env.DB.prepare("SELECT name, sku FROM tools WHERE id=?").bind(loan.tool_id).first();
  const w = await c.env.DB.prepare("SELECT name FROM workers WHERE id=?").bind(loan.worker_id).first();
  await audit(
    c.env.DB,
    "lending_return",
    "lending",
    lid,
    user.username,
    `${w?.name} returned ${loan.quantity}x ${t?.sku} \u2014 ${b.condition || "good"}`,
    retLoc
  );
  return c.json({ ok: true });
});
var lending_default = lending;

// src/routes/transfers.js
var transfers = new Hono2();
transfers.get("/", async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT tr.*, fl.name from_loc, tl.name to_loc,
      t.name tool_name, t.sku, ti.tool_id, ti.requested_quantity as quantity
     FROM transfers tr
     JOIN locations fl ON fl.id=tr.from_location_id
     JOIN locations tl ON tl.id=tr.to_location_id
     LEFT JOIN transfer_items ti ON ti.transfer_id = tr.id
     LEFT JOIN tools t ON t.id=ti.tool_id
     ORDER BY tr.created_at DESC LIMIT 200`
  ).all();
  return c.json(results);
});
transfers.post("/", async (c) => {
  const b = await c.req.json();
  const user = c.get("jwtPayload");
  if (b.fromLocationId === b.toLocationId)
    return c.json({ error: "Source and destination must differ" }, 400);
  const row = await c.env.DB.prepare(
    `SELECT quantity - reserved_quantity avail FROM tool_locations WHERE tool_id=? AND location_id=?`
  ).bind(b.toolId, b.fromLocationId).first("avail");
  if ((row || 0) < b.quantity)
    return c.json({ error: `Only ${row || 0} available at source` }, 400);
  const r = await c.env.DB.prepare(
    `INSERT INTO transfers (from_location_id, to_location_id, status, requested_by, transfer_date, notes, created_at)
     VALUES (?, ?, 'draft', ?, ?, ?, ?)`
  ).bind(b.fromLocationId, b.toLocationId, user.username, now(), b.notes || "", now()).run();
  const tid = r.meta.last_row_id;
  await c.env.DB.prepare(
    `INSERT INTO transfer_items (transfer_id, tool_id, requested_quantity) VALUES (?, ?, ?)`
  ).bind(tid, b.toolId, b.quantity).run();
  const t = await c.env.DB.prepare("SELECT sku FROM tools WHERE id=?").bind(b.toolId).first("sku");
  await audit(
    c.env.DB,
    "transfer_create",
    "transfer",
    tid,
    user.username,
    `Transfer request: ${b.quantity}x ${t || b.toolId} from loc ${b.fromLocationId} \u2192 ${b.toLocationId}`
  );
  return c.json({ ok: true, id: tid }, 201);
});
transfers.post("/:id/approve", async (c) => {
  const id = parseInt(c.req.param("id"));
  const user = c.get("jwtPayload");
  const tr = await c.env.DB.prepare(`
    SELECT tr.*, ti.tool_id, ti.requested_quantity as quantity
    FROM transfers tr
    LEFT JOIN transfer_items ti ON ti.transfer_id = tr.id
    WHERE tr.id=?
  `).bind(id).first();
  if (!tr) return c.json({ error: "Transfer not found" }, 404);
  if (tr.status !== "draft")
    return c.json({ error: `Cannot approve \u2014 transfer is already ${tr.status}` }, 400);
  const row = await c.env.DB.prepare(
    `SELECT quantity - reserved_quantity avail FROM tool_locations WHERE tool_id=? AND location_id=?`
  ).bind(tr.tool_id, tr.from_location_id).first("avail");
  if ((row || 0) < tr.quantity)
    return c.json({ error: `Insufficient stock \u2014 only ${row || 0} available at source now` }, 400);
  await c.env.DB.prepare(
    `UPDATE tool_locations SET reserved_quantity=reserved_quantity+?, last_updated=? WHERE tool_id=? AND location_id=?`
  ).bind(tr.quantity, now(), tr.tool_id, tr.from_location_id).run();
  await c.env.DB.prepare(
    `UPDATE transfers SET status='approved', approved_by=? WHERE id=?`
  ).bind(user.username, id).run();
  await audit(
    c.env.DB,
    "transfer_approve",
    "transfer",
    id,
    user.username,
    "Transfer approved \u2014 stock reserved at source"
  );
  return c.json({ ok: true });
});
transfers.post("/:id/complete", async (c) => {
  const id = parseInt(c.req.param("id"));
  const user = c.get("jwtPayload");
  const tr = await c.env.DB.prepare(`
    SELECT tr.*, ti.tool_id, ti.requested_quantity as quantity, ti.id as ti_id
    FROM transfers tr
    LEFT JOIN transfer_items ti ON ti.transfer_id = tr.id
    WHERE tr.id=?
  `).bind(id).first();
  if (!tr) return c.json({ error: "Not found" }, 404);
  if (tr.status === "completed") return c.json({ error: "Already completed" }, 400);
  if (tr.status !== "approved")
    return c.json({ error: "Transfer must be approved before completing" }, 400);
  await c.env.DB.prepare(
    `UPDATE tool_locations SET quantity=quantity-?, reserved_quantity=reserved_quantity-?, last_updated=? WHERE tool_id=? AND location_id=?`
  ).bind(tr.quantity, tr.quantity, now(), tr.tool_id, tr.from_location_id).run();
  const dest = await c.env.DB.prepare(
    `SELECT id FROM tool_locations WHERE tool_id=? AND location_id=?`
  ).bind(tr.tool_id, tr.to_location_id).first();
  if (dest) {
    await c.env.DB.prepare(
      `UPDATE tool_locations SET quantity=quantity+?, last_updated=? WHERE tool_id=? AND location_id=?`
    ).bind(tr.quantity, now(), tr.tool_id, tr.to_location_id).run();
  } else {
    await c.env.DB.prepare(
      `INSERT INTO tool_locations (tool_id, location_id, quantity, reserved_quantity, min_stock_level, max_stock_level, last_updated)
       VALUES (?, ?, ?, 0, 0, 0, ?)`
    ).bind(tr.tool_id, tr.to_location_id, tr.quantity, now()).run();
  }
  if (tr.ti_id) {
    await c.env.DB.prepare(
      `UPDATE transfer_items SET transferred_quantity=? WHERE id=?`
    ).bind(tr.quantity, tr.ti_id).run();
  }
  for (const [loc, type] of [
    [tr.from_location_id, "transfer_out"],
    [tr.to_location_id, "transfer_in"]
  ]) {
    await c.env.DB.prepare(
      `INSERT INTO stock_movements (tool_id, location_id, movement_type, quantity, reference_type, reference_id, performed_by, performed_at)
       VALUES (?, ?, ?, ?, 'transfer', ?, ?, ?)`
    ).bind(tr.tool_id, loc, type, tr.quantity, id, user.username, now()).run();
  }
  await c.env.DB.prepare(
    `UPDATE transfers SET status='completed', completed_by=?, completed_at=? WHERE id=?`
  ).bind(user.username, now(), id).run();
  await audit(
    c.env.DB,
    "transfer_complete",
    "transfer",
    id,
    user.username,
    "Transfer completed \u2014 stock physically moved"
  );
  return c.json({ ok: true });
});
transfers.delete("/:id", async (c) => {
  const id = parseInt(c.req.param("id"));
  const user = c.get("jwtPayload");
  const tr = await c.env.DB.prepare(`
    SELECT tr.*, ti.tool_id, ti.requested_quantity as quantity 
    FROM transfers tr
    LEFT JOIN transfer_items ti ON ti.transfer_id = tr.id
    WHERE tr.id=?
  `).bind(id).first();
  if (!tr) return c.json({ error: "Not found" }, 404);
  if (tr.status === "completed")
    return c.json({ error: "Cannot cancel a completed transfer" }, 400);
  if (tr.status === "approved") {
    await c.env.DB.prepare(
      `UPDATE tool_locations SET reserved_quantity=MAX(0, reserved_quantity-?), last_updated=? WHERE tool_id=? AND location_id=?`
    ).bind(tr.quantity, now(), tr.tool_id, tr.from_location_id).run();
  }
  await c.env.DB.prepare(
    `UPDATE transfers SET status='cancelled', completed_at=? WHERE id=?`
  ).bind(now(), id).run();
  await audit(
    c.env.DB,
    "transfer_cancel",
    "transfer",
    id,
    user.username,
    tr.status === "approved" ? "Transfer cancelled \u2014 reserved stock released" : "Transfer cancelled (was still draft)"
  );
  return c.json({ ok: true });
});
var transfers_default = transfers;

// src/routes/purchases.js
var purchases = new Hono2();
purchases.get("/", async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT p.*, s.name supplier_name, COUNT(pi.id) item_count
     FROM purchases p
     LEFT JOIN suppliers s ON s.id=p.supplier_id
     LEFT JOIN purchase_items pi ON pi.purchase_id=p.id
     GROUP BY p.id ORDER BY p.created_at DESC`
  ).all();
  return c.json(results);
});
purchases.get("/:id", async (c) => {
  const id = parseInt(c.req.param("id"));
  const p = await c.env.DB.prepare(
    `SELECT p.*, s.name supplier_name FROM purchases p LEFT JOIN suppliers s ON s.id=p.supplier_id WHERE p.id=?`
  ).bind(id).first();
  if (!p) return c.json({ error: "Not found" }, 404);
  const { results: items } = await c.env.DB.prepare(
    `SELECT pi.*, t.name tool_name, t.sku, l.name loc_name
     FROM purchase_items pi JOIN tools t ON t.id=pi.tool_id JOIN locations l ON l.id=pi.location_id
     WHERE pi.purchase_id=?`
  ).bind(id).all();
  return c.json({ ...p, items });
});
purchases.post("/", async (c) => {
  const b = await c.req.json();
  const user = c.get("jwtPayload");
  const r = await c.env.DB.prepare(
    `INSERT INTO purchases (supplier_id, invoice_number, invoice_date, total_amount, tax_amount, discount_amount, payment_status, received_by, notes, status, created_by, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, 'pending', ?, ?, ?)`
  ).bind(
    b.supplierId || null,
    b.invoiceNumber,
    b.invoiceDate || now(),
    b.totalAmount || 0,
    b.taxAmount || 0,
    b.discountAmount || 0,
    user.username,
    b.notes || "",
    user.username,
    now(),
    now()
  ).run();
  const pid = r.meta.last_row_id;
  for (const item of b.items || []) {
    await c.env.DB.prepare(
      `INSERT INTO purchase_items (purchase_id, tool_id, location_id, quantity, unit_cost, total_cost, received_quantity)
       VALUES (?, ?, ?, ?, ?, ?, 0)`
    ).bind(pid, item.toolId, item.locationId, item.quantity, item.unitCost || 0, item.quantity * (item.unitCost || 0)).run();
  }
  await audit(
    c.env.DB,
    "purchase_create",
    "purchase",
    pid,
    user.username,
    `Created PO ${b.invoiceNumber} with ${(b.items || []).length} items`
  );
  return c.json({ ok: true, id: pid }, 201);
});
purchases.post("/:id/receive", async (c) => {
  const pid = parseInt(c.req.param("id"));
  const user = c.get("jwtPayload");
  const p = await c.env.DB.prepare(`SELECT * FROM purchases WHERE id=?`).bind(pid).first();
  if (!p) return c.json({ error: "Not found" }, 404);
  if (p.status === "completed") return c.json({ error: "Already received" }, 400);
  const { results: items } = await c.env.DB.prepare(`SELECT * FROM purchase_items WHERE purchase_id=?`).bind(pid).all();
  for (const item of items) {
    const exists = await c.env.DB.prepare(
      `SELECT id FROM tool_locations WHERE tool_id=? AND location_id=?`
    ).bind(item.tool_id, item.location_id).first();
    if (exists) {
      await c.env.DB.prepare(
        `UPDATE tool_locations SET quantity=quantity+?, last_updated=? WHERE tool_id=? AND location_id=?`
      ).bind(item.quantity, now(), item.tool_id, item.location_id).run();
    } else {
      await c.env.DB.prepare(
        `INSERT INTO tool_locations (tool_id, location_id, quantity, reserved_quantity, min_stock_level, max_stock_level, last_updated) VALUES (?,?,?,0,0,0,?)`
      ).bind(item.tool_id, item.location_id, item.quantity, now()).run();
    }
    await c.env.DB.prepare(
      `UPDATE purchase_items SET received_quantity=quantity WHERE id=?`
    ).bind(item.id).run();
    await c.env.DB.prepare(
      `INSERT INTO stock_movements (tool_id, location_id, movement_type, quantity, reference_type, reference_id, unit_cost, total_cost, invoice_number, performed_by, performed_at, timestamp)
       VALUES (?, ?, 'stock_in', ?, 'purchase', ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      item.tool_id,
      item.location_id,
      item.quantity,
      pid,
      item.unit_cost || 0,
      item.total_cost || 0,
      p.invoice_number,
      user.username,
      now(),
      now()
    ).run();
  }
  await c.env.DB.prepare(
    `UPDATE purchases SET status='completed', payment_status='paid', received_by=?, updated_at=? WHERE id=?`
  ).bind(user.username, now(), pid).run();
  await audit(
    c.env.DB,
    "stock_receive",
    "purchase",
    pid,
    user.username,
    `Received ${items.length} items from PO ${p.invoice_number}`
  );
  return c.json({ ok: true });
});
var purchases_default = purchases;

// src/routes/suppliers.js
var suppliers = new Hono2();
suppliers.get("/", async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT * FROM suppliers WHERE status='active' ORDER BY name`
  ).all();
  return c.json(results);
});
suppliers.post("/", async (c) => {
  const b = await c.req.json();
  const user = c.get("jwtPayload");
  if (!b.name) return c.json({ error: "Name required" }, 400);
  const r = await c.env.DB.prepare(
    `INSERT INTO suppliers (name, contact_info, address, notes, status, created_by, created_at, updated_at)
     VALUES (?, ?, ?, ?, 'active', ?, ?, ?)`
  ).bind(b.name, b.contactInfo || "", b.address || "", b.notes || "", user.username, now(), now()).run();
  await audit(c.env.DB, "supplier_create", "supplier", r.meta.last_row_id, user.username, `Added supplier ${b.name}`);
  return c.json({ ok: true, id: r.meta.last_row_id }, 201);
});
suppliers.put("/:id", async (c) => {
  const id = parseInt(c.req.param("id"));
  const b = await c.req.json();
  const user = c.get("jwtPayload");
  await c.env.DB.prepare(
    `UPDATE suppliers SET name=?, contact_info=?, address=?, notes=?, updated_at=? WHERE id=?`
  ).bind(b.name, b.contactInfo || "", b.address || "", b.notes || "", now(), id).run();
  await audit(c.env.DB, "supplier_update", "supplier", id, user.username, `Updated supplier #${id}`);
  return c.json({ ok: true });
});
var suppliers_default = suppliers;

// src/routes/locations.js
var locations = new Hono2();
locations.get("/", async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT l.*,
      COUNT(DISTINCT tl.tool_id) as total_tools,
      SUM(tl.quantity) as total_quantity,
      (SELECT COUNT(*) FROM transfers tr WHERE (tr.from_location_id=l.id OR tr.to_location_id=l.id) AND tr.status NOT IN ('completed','cancelled')) as active_transfers
     FROM locations l
     LEFT JOIN tool_locations tl ON tl.location_id=l.id
     WHERE l.status='active'
     GROUP BY l.id
     ORDER BY l.name`
  ).all();
  return c.json(results);
});
locations.get("/:id", async (c) => {
  const id = parseInt(c.req.param("id"));
  const loc = await c.env.DB.prepare(`SELECT * FROM locations WHERE id=?`).bind(id).first();
  if (!loc) return c.json({ error: "Not found" }, 404);
  const { results: stock2 } = await c.env.DB.prepare(
    `SELECT tl.*, t.name tool_name, t.sku, t.category, t.brand, t.min_stock_level
     FROM tool_locations tl JOIN tools t ON t.id=tl.tool_id
     WHERE tl.location_id=? AND t.status='active' ORDER BY t.name`
  ).bind(id).all();
  const { results: active_transfers } = await c.env.DB.prepare(
    `SELECT tr.*, t.name tool_name, t.sku, fl.name from_loc, tl.name to_loc
     FROM transfers tr
     LEFT JOIN transfer_items ti ON ti.transfer_id = tr.id
     JOIN tools t ON t.id=ti.tool_id
     JOIN locations fl ON fl.id=tr.from_location_id JOIN locations tl ON tl.id=tr.to_location_id
     WHERE (tr.from_location_id=? OR tr.to_location_id=?) AND tr.status NOT IN ('completed','cancelled')
     ORDER BY tr.created_at DESC`
  ).bind(id, id).all();
  return c.json({ ...loc, stock: stock2, active_transfers });
});
locations.post("/", async (c) => {
  const b = await c.req.json();
  const user = c.get("jwtPayload");
  if (!b.name) return c.json({ error: "Name required" }, 400);
  const r = await c.env.DB.prepare(
    `INSERT INTO locations (name, address, manager, contact_info, location_type, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 'active', ?, ?)`
  ).bind(
    b.name,
    b.address || "",
    b.manager || "",
    b.contactInfo || "",
    b.locationType || "warehouse",
    now(),
    now()
  ).run();
  await audit(c.env.DB, "location_create", "location", r.meta.last_row_id, user.username, `Added location ${b.name}`);
  return c.json({ ok: true, id: r.meta.last_row_id }, 201);
});
locations.put("/:id", async (c) => {
  const id = parseInt(c.req.param("id"));
  const b = await c.req.json();
  const user = c.get("jwtPayload");
  await c.env.DB.prepare(
    `UPDATE locations SET name=?, address=?, manager=?, contact_info=?, location_type=?, updated_at=? WHERE id=?`
  ).bind(
    b.name,
    b.address || "",
    b.manager || "",
    b.contactInfo || "",
    b.locationType || "warehouse",
    now(),
    id
  ).run();
  await audit(c.env.DB, "location_update", "location", id, user.username, `Updated location #${id}`);
  return c.json({ ok: true });
});
var locations_default = locations;

// src/routes/analytics.js
var analytics = new Hono2();
analytics.get("/dashboard", async (c) => {
  const n = now2();
  const todayStart = /* @__PURE__ */ new Date();
  todayStart.setHours(0, 0, 0, 0);
  const [tools2, workers2, loans, overdue, low, todayMvs, lowItems, overdueItems, recentMvs] = await Promise.all([
    c.env.DB.prepare(`SELECT COUNT(*) c FROM tools WHERE status='active'`).first("c"),
    c.env.DB.prepare(`SELECT COUNT(*) c FROM workers WHERE status='active'`).first("c"),
    c.env.DB.prepare(`SELECT COUNT(*) c FROM lending WHERE actual_return_date IS NULL AND status='active'`).first("c"),
    c.env.DB.prepare(`SELECT COUNT(*) c FROM lending WHERE actual_return_date IS NULL AND status='active' AND expected_return_date < ?`).bind(n).first("c"),
    c.env.DB.prepare(`SELECT COUNT(*) c FROM tool_locations tl JOIN tools t ON t.id=tl.tool_id WHERE tl.quantity <= tl.min_stock_level AND tl.quantity >= 0 AND t.status='active'`).first("c"),
    c.env.DB.prepare(`SELECT COUNT(*) c FROM stock_movements WHERE performed_at >= ?`).bind(todayStart.getTime()).first("c"),
    c.env.DB.prepare(`SELECT t.sku, t.name, l.name loc_name, tl.quantity, tl.min_stock_level
      FROM tool_locations tl JOIN tools t ON t.id=tl.tool_id JOIN locations l ON l.id=tl.location_id
      WHERE tl.quantity <= tl.min_stock_level AND t.status='active' ORDER BY tl.quantity ASC LIMIT 10`).all(),
    c.env.DB.prepare(`SELECT ld.*, t.name tool_name, t.sku, w.name worker_name, w.phone
      FROM lending ld JOIN tools t ON t.id=ld.tool_id JOIN workers w ON w.id=ld.worker_id
      WHERE ld.actual_return_date IS NULL AND ld.status='active' AND ld.expected_return_date < ?
      ORDER BY ld.expected_return_date ASC LIMIT 10`).bind(n).all(),
    c.env.DB.prepare(`SELECT sm.*, t.name tool_name, t.sku, l.name loc_name
      FROM stock_movements sm JOIN tools t ON t.id=sm.tool_id JOIN locations l ON l.id=sm.location_id
      ORDER BY sm.performed_at DESC LIMIT 10`).all()
  ]);
  return c.json({
    tools_total: tools2,
    workers_total: workers2,
    active_loans: loans,
    overdue,
    low_stock: low,
    movements_today: todayMvs,
    low_items: lowItems.results,
    overdue_items: overdueItems.results,
    recent_movements: recentMvs.results
  });
});
analytics.get("/stock-report", async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT t.id, t.sku, t.name, t.category, t.brand, l.name loc_name,
      tl.quantity, tl.min_stock_level, tl.reserved_quantity, tl.max_stock_level,
      CASE WHEN tl.quantity <= 0 THEN 'out' WHEN tl.quantity <= tl.min_stock_level THEN 'low' ELSE 'ok' END stock_status
     FROM tool_locations tl JOIN tools t ON t.id=tl.tool_id JOIN locations l ON l.id=tl.location_id
     WHERE t.status='active' ORDER BY t.name, l.name`
  ).all();
  return c.json(results);
});
analytics.get("/worker-holdings", async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT w.id worker_id, w.name worker_name, w.phone, w.company, w.worker_type,
      (SELECT COUNT(*) FROM lending WHERE worker_id=w.id AND status='completed') returned_loans,
      (SELECT COUNT(*) FROM lending WHERE worker_id=w.id) total_loans,
      t.sku, t.name tool_name, t.category, l.name loc_name,
      ld.quantity, ld.date_out, ld.expected_return_date, ld.id loan_id,
      CASE WHEN ld.expected_return_date < ? AND ld.actual_return_date IS NULL THEN 1 ELSE 0 END overdue
     FROM lending ld
     JOIN workers w ON w.id=ld.worker_id JOIN tools t ON t.id=ld.tool_id JOIN locations l ON l.id=ld.location_id
     WHERE ld.actual_return_date IS NULL AND ld.status='active' ORDER BY w.name, t.name`
  ).bind(Date.now()).all();
  const workersMap = {};
  results.forEach((r) => {
    if (!workersMap[r.worker_id]) {
      const total = r.total_loans || 0;
      const rel = total > 0 ? r.returned_loans / total * 100 : null;
      workersMap[r.worker_id] = {
        worker_id: r.worker_id,
        worker_name: r.worker_name,
        phone: r.phone,
        company: r.company || "",
        reliability_score: rel,
        loans: []
      };
    }
    workersMap[r.worker_id].loans.push({
      id: r.loan_id,
      sku: r.sku,
      tool_name: r.tool_name,
      category: r.category,
      loc_name: r.loc_name,
      quantity: r.quantity,
      date_out: r.date_out,
      expected_return_date: r.expected_return_date,
      overdue: r.overdue
    });
  });
  return c.json(Object.values(workersMap));
});
function now2() {
  return Date.now();
}
__name(now2, "now");
var analytics_default = analytics;

// src/routes/audit.js
var auditRoute = new Hono2();
auditRoute.get("/", async (c) => {
  const { search, entity_type, action } = c.req.query();
  let q = `SELECT al.*, u.username, u.full_name FROM audit_log al LEFT JOIN users u ON u.id=al.user_id WHERE 1=1`;
  const p = [];
  if (search) {
    q += ` AND (al.action LIKE ? OR al.entity_type LIKE ? OR al.details LIKE ?)`;
    p.push(...Array(3).fill(`%${search}%`));
  }
  if (entity_type) {
    q += ` AND al.entity_type=?`;
    p.push(entity_type);
  }
  if (action) {
    q += ` AND al.action=?`;
    p.push(action);
  }
  q += ` ORDER BY al.timestamp DESC LIMIT 300`;
  const { results } = await c.env.DB.prepare(q).bind(...p).all();
  return c.json(results);
});
var audit_default = auditRoute;

// src/routes/import.js
var imp = new Hono2();
imp.post("/", async (c) => {
  const user = c.get("jwtPayload");
  const type = c.req.query("type");
  const { csv } = await c.req.json();
  if (!csv) return c.json({ error: "No CSV provided" }, 400);
  const lines = csv.trim().split("\n").map((l) => l.split(",").map((v) => v.trim().replace(/^"|"$/g, "")));
  const headers = lines[0].map((h) => h.toLowerCase().replace(/\s+/g, "_"));
  const rows = lines.slice(1).filter((r) => r.some((v) => v));
  let imported = 0;
  const errors = [];
  if (type === "tools") {
    for (const row of rows) {
      const o = Object.fromEntries(headers.map((h, i) => [h, row[i] || ""]));
      if (!o.sku || !o.name) {
        errors.push(`Skipped row \u2014 missing sku or name`);
        continue;
      }
      try {
        const r = await c.env.DB.prepare(
          `INSERT OR IGNORE INTO tools (sku, name, category, brand, model, min_stock_level, unit_of_measure, status, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, 'piece', 'active', ?, ?)`
        ).bind(o.sku.toUpperCase(), o.name, o.category || "", o.brand || "", o.model || "", parseInt(o.min_stock_level) || 0, now(), now()).run();
        if (r.meta.changes > 0) imported++;
      } catch (e) {
        errors.push(`${o.sku}: ${e.message}`);
      }
    }
  }
  if (type === "workers") {
    for (const row of rows) {
      const o = Object.fromEntries(headers.map((h, i) => [h, row[i] || ""]));
      if (!o.name) {
        errors.push(`Skipped row \u2014 missing name`);
        continue;
      }
      try {
        const r = await c.env.DB.prepare(
          `INSERT OR IGNORE INTO workers (name, email, phone, address, company, worker_type, status, created_by) VALUES (?, ?, ?, ?, ?, ?, 'active', ?)`
        ).bind(o.name, o.email || "", o.phone || "", o.address || "", o.company || "employee", o.worker_type || "", user.username).run();
        if (r.meta.changes > 0) imported++;
      } catch (e) {
        errors.push(`${o.name}: ${e.message}`);
      }
    }
  }
  if (type === "locations") {
    for (const row of rows) {
      const o = Object.fromEntries(headers.map((h, i) => [h, row[i] || ""]));
      if (!o.name) {
        errors.push(`Skipped row \u2014 missing name`);
        continue;
      }
      try {
        const r = await c.env.DB.prepare(
          `INSERT OR IGNORE INTO locations (name, address, manager, contact_info, location_type, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 'active', ?, ?)`
        ).bind(o.name, o.address || "", o.manager || "", o.contact_info || "", o.location_type || "warehouse", now(), now()).run();
        if (r.meta.changes > 0) imported++;
      } catch (e) {
        errors.push(`${o.name}: ${e.message}`);
      }
    }
  }
  await audit(c.env.DB, "import", type, 0, user.username, `Imported ${imported} ${type} via CSV`);
  return c.json({ ok: true, imported, errors });
});
imp.get("/export", async (c) => {
  const type = c.req.query("type") || "tools";
  const queries = {
    tools: `SELECT sku, name, category, brand, model, min_stock_level, unit_of_measure FROM tools WHERE status!='deleted'`,
    workers: `SELECT name, email, phone, address, company, worker_type FROM workers WHERE status='active'`,
    stock: `SELECT t.sku, t.name, l.name location, tl.quantity, tl.reserved_quantity, tl.min_stock_level FROM tool_locations tl JOIN tools t ON t.id=tl.tool_id JOIN locations l ON l.id=tl.location_id WHERE t.status='active'`,
    movements: `SELECT sm.movement_type, t.sku, t.name, l.name location, sm.quantity, sm.performed_by, sm.performed_at FROM stock_movements sm JOIN tools t ON t.id=sm.tool_id JOIN locations l ON l.id=sm.location_id ORDER BY sm.performed_at DESC LIMIT 1000`,
    lending: `SELECT t.sku, t.name tool_name, w.name worker_name, l.name location, ld.quantity, ld.date_out, ld.expected_return_date, ld.actual_return_date, ld.return_condition, ld.status FROM lending ld JOIN tools t ON t.id=ld.tool_id JOIN workers w ON w.id=ld.worker_id JOIN locations l ON l.id=ld.location_id ORDER BY ld.date_out DESC`
  };
  const q = queries[type];
  if (!q) return c.json({ error: "Unknown export type" }, 400);
  const { results } = await c.env.DB.prepare(q).all();
  if (!results.length) return c.text("No data", 200);
  const headers = Object.keys(results[0]);
  const csv = [headers.join(","), ...results.map(
    (r) => headers.map((h) => `"${String(r[h] ?? "").replace(/"/g, '""')}"`).join(",")
  )].join("\n");
  return new Response(csv, { headers: {
    "Content-Type": "text/csv",
    "Content-Disposition": `attachment; filename="${type}_export.csv"`
  } });
});
var import_default = imp;

// src/routes/users.js
var users = new Hono2();
users.get("/", async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT id, username, full_name, email, role, permissions, default_location_id, status, last_login, created_at FROM users ORDER BY full_name`
  ).all();
  return c.json(results);
});
users.post("/", async (c) => {
  const b = await c.req.json();
  const actor = c.get("jwtPayload");
  if (!b.username || !b.password) return c.json({ error: "Username and password required" }, 400);
  const exists = await c.env.DB.prepare(`SELECT id FROM users WHERE username=?`).bind(b.username).first();
  if (exists) return c.json({ error: "Username already taken" }, 409);
  const r = await c.env.DB.prepare(
    `INSERT INTO users (username, full_name, email, role, password_hash, status, created_at, updated_at) VALUES (?,?,?,?,?,'active',?,?)`
  ).bind(b.username, b.fullName || b.username, b.email || "", b.role || "User", b.password, now(), now()).run();
  await audit(c.env.DB, "user_create", "user", r.meta.last_row_id, actor.sub, `Created user ${b.username}`);
  return c.json({ ok: true, id: r.meta.last_row_id }, 201);
});
users.put("/:id", async (c) => {
  const id = parseInt(c.req.param("id"));
  const b = await c.req.json();
  const actor = c.get("jwtPayload");
  await c.env.DB.prepare(
    `UPDATE users SET full_name=?, email=?, role=?, permissions=?, default_location_id=?, updated_at=? WHERE id=?`
  ).bind(b.fullName, b.email || "", b.role, b.permissions || null, b.defaultLocationId || null, now(), id).run();
  if (b.password) {
    await c.env.DB.prepare(`UPDATE users SET password_hash=? WHERE id=?`).bind(b.password, id).run();
  }
  await audit(c.env.DB, "user_update", "user", id, actor.sub, `Updated user #${id}`);
  return c.json({ ok: true });
});
users.delete("/:id", async (c) => {
  const id = parseInt(c.req.param("id"));
  const actor = c.get("jwtPayload");
  if (id === actor.sub) return c.json({ error: "Cannot deactivate yourself" }, 400);
  await c.env.DB.prepare(`UPDATE users SET status='inactive', updated_at=? WHERE id=?`).bind(now(), id).run();
  await audit(c.env.DB, "user_deactivate", "user", id, actor.sub, `Deactivated user #${id}`);
  return c.json({ ok: true });
});
var users_default = users;

// src/index.js
var app = new Hono2();
app.use("*", cors({
  origin: "*",
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"]
}));
app.route("/api/auth", auth_default);
app.use("/api/*", async (c, next) => {
  return jwt({ secret: c.env.JWT_SECRET, alg: "HS256" })(c, next);
});
app.route("/api/tools", tools_default);
app.route("/api/stock", stock_default);
app.route("/api/workers", workers_default);
app.route("/api/lending", lending_default);
app.route("/api/transfers", transfers_default);
app.route("/api/purchases", purchases_default);
app.route("/api/suppliers", suppliers_default);
app.route("/api/locations", locations_default);
app.route("/api/analytics", analytics_default);
app.route("/api/audit", audit_default);
app.route("/api/import", import_default);
app.route("/api/users", users_default);
app.notFound((c) => c.json({ error: "Not found" }, 404));
app.onError((err, c) => {
  console.error(err);
  return c.json({ error: err.message }, 500);
});
var index_default = app;
export {
  index_default as default
};
//# sourceMappingURL=index.js.map
