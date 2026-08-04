const suspiciousUserAgents = [
  "sqlmap",
  "nikto",
  "nmap",
  "curl",
  "python-requests",
  "wget",
  "burpsuite",
  "postmanruntime",
];

const detectSuspiciousUserAgent = (userAgent = "") => {
  const normalizedUserAgent = userAgent.toLowerCase();

  const matchedTool = suspiciousUserAgents.find((tool) =>
    normalizedUserAgent.includes(tool),
  );

  if (!matchedTool) {
    return {
      detected: false,
      behaviorType: null,
      riskScore: 0,
      reason: null,
    };
  }

  return {
    detected: true,
    behaviorType: "SUSPICIOUS_USER_AGENT",
    riskScore: 30,
    reason: `Suspicious automated client detected: ${matchedTool}.`,
  };
};

module.exports = detectSuspiciousUserAgent;
