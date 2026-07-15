const runDetectors = (requestData) => {
  const input = JSON.stringify({
    query: requestData.query,
    body: requestData.body,
    params: requestData.params,
    endpoint: requestData.endpoint,
  }).toLowerCase();

  const attackTypes = [];
  const reasons = [];
  let riskScore = 0;

  const sqlInjectionPatterns = [
    "' or 1=1",
    '" or 1=1',
    "union select",
    "drop table",
    "--",
    "information_schema",
  ];

  const xssPatterns = ["<script", "javascript:", "onerror=", "onload="];

  const pathTraversalPatterns = ["../", "..\\", "/etc/passwd"];

  const sqlInjectionDetected = sqlInjectionPatterns.some((pattern) =>
    input.includes(pattern),
  );

  if (sqlInjectionDetected) {
    attackTypes.push("SQL_INJECTION");
    reasons.push("SQL injection pattern detected.");
    riskScore += 70;
  }

  const xssDetected = xssPatterns.some((pattern) => input.includes(pattern));

  if (xssDetected) {
    attackTypes.push("XSS");
    reasons.push("Cross-site scripting pattern detected.");
    riskScore += 65;
  }

  const pathTraversalDetected = pathTraversalPatterns.some((pattern) =>
    input.includes(pattern),
  );

  if (pathTraversalDetected) {
    attackTypes.push("PATH_TRAVERSAL");
    reasons.push("Path traversal pattern detected.");
    riskScore += 65;
  }

  riskScore = Math.min(Math.max(riskScore, 0), 100);

  let action = "ALLOW";

  if (riskScore >= 60) {
    action = "BLOCK";
  } else if (riskScore >= 30) {
    action = "MONITOR";
  }

  return {
    detected: attackTypes.length > 0,
    riskScore,
    attackTypes,
    reasons,
    action,
  };
};

module.exports = runDetectors;
