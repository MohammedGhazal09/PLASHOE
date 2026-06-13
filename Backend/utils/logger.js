const REDACTED = "[REDACTED]";
const MAX_DEPTH = 6;

const sensitiveKeyPattern =
  /authorization|cookie|password|passwd|secret|token|jwt|stripe|webhook|mongo.*uri|mongodb.*uri|raw.*body|payload|request.*body|body/i;

const sensitiveValuePatterns = [
  /bearer\s+[a-z0-9._~+/-]+=*/gi,
  /mongodb(?:\+srv)?:\/\/[^\s"'<>]+/gi,
  /sk_(?:live|test)_[a-z0-9]+/gi,
  /whsec_[a-z0-9]+/gi,
  /eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g,
];

const redactString = (value) =>
  sensitiveValuePatterns.reduce((current, pattern) => current.replace(pattern, REDACTED), value);

export const redact = (value, depth = 0) => {
  if (value == null) return value;

  if (typeof value === "string") {
    return redactString(value);
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  if (depth >= MAX_DEPTH) {
    return "[Truncated]";
  }

  if (Array.isArray(value)) {
    return value.map((item) => redact(item, depth + 1));
  }

  if (value instanceof Error) {
    return serializeError(value);
  }

  if (typeof value === "object") {
    return Object.entries(value).reduce((acc, [key, item]) => {
      acc[key] = sensitiveKeyPattern.test(key) ? REDACTED : redact(item, depth + 1);
      return acc;
    }, {});
  }

  return value;
};

export const serializeError = (error) => {
  if (!error) return undefined;

  return redact({
    name: error.name,
    message: error.message,
    code: error.code,
    status: error.status || error.statusCode,
  });
};

const writeLog = (level, event, metadata = {}) => {
  const record = {
    timestamp: new Date().toISOString(),
    level,
    event,
    ...redact(metadata),
  };

  const line = JSON.stringify(record);

  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.log(line);
  }
};

export const logInfo = (event, metadata = {}) => writeLog("info", event, metadata);
export const logWarn = (event, metadata = {}) => writeLog("warn", event, metadata);
export const logError = (event, metadata = {}) => writeLog("error", event, metadata);
