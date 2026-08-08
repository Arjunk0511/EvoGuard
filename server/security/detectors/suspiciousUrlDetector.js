/**
 * Suspicious URL Detector
 *
 * Detects requests attempting to access
 * sensitive or commonly targeted paths.
 */

const { RISK_SCORES } = require("../constants");

const SUSPICIOUS_PATHS = [
  ".env",
  ".git",
  "wp-admin",
  "wp-login",
  "phpmyadmin",
  "config",
  "admin",
  "server-status",
  "backup",
];

function suspiciousUrlDetector(req) {
  const url = (
    req.originalUrl ||
    req.url ||
    req.path ||
    ""
  ).toLowerCase();

  for (const suspiciousPath of SUSPICIOUS_PATHS) {
    if (url.includes(suspiciousPath)) {
      return {
        detector: "SuspiciousUrlDetector",
        detected: true,
        attackType: "SUSPICIOUS_URL",
        severity: "MEDIUM",
        score: RISK_SCORES.SUSPICIOUS_URL,
        reason: `Suspicious URL access detected: ${suspiciousPath}`,
      };
    }
  }

  return {
    detector: "SuspiciousUrlDetector",
    detected: false,
    attackType: null,
    severity: null,
    score: 0,
    reason: null,
  };
}

module.exports = suspiciousUrlDetector;