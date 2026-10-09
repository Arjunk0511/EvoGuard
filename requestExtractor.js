const sensitiveFields = [
  "password",
  "confirmPassword",
  "token",
  "accessToken",
  "refreshToken",
  "authorization",
  "cardNumber",
  "cvv",
];

const redactSensitiveData = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => redactSensitiveData(item));
  }

  if (value !== null && typeof value === "object") {
    const cleanObject = {};

    for (const [key, fieldValue] of Object.entries(value)) {
      const isSensitive = sensitiveFields.some(
        (field) => field.toLowerCase() === key.toLowerCase(),
      );

      cleanObject[key] = isSensitive
        ? "[REDACTED]"
        : redactSensitiveData(fieldValue);
    }

    return cleanObject;
  }

  return value;
};

const getIpAddress = (req) => {
  const forwardedFor = req.headers["x-forwarded-for"];

  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  return req.ip || req.socket?.remoteAddress || "UNKNOWN";
};

const extractRequestData = (req) => {
  return {
    ipAddress: getIpAddress(req),
    method: req.method,
    endpoint: req.originalUrl || req.url,
    userAgent: req.headers["user-agent"] || "UNKNOWN",
    query: redactSensitiveData(req.query || {}),
    body: redactSensitiveData(req.body || {}),
    params: redactSensitiveData(req.params || {}),
  };
};

module.exports = extractRequestData;
