const makeDecision = (totalRisk) => {
  const risk = Math.min(
    Math.max(Number(totalRisk) || 0, 0),
    100
  );

  if (risk >= 85) {
    return "BLOCK";
  }

  if (risk >= 70) {
    return "REDIRECT";
  }

  if (risk >= 50) {
    return "RATE_LIMIT";
  }

  if (risk >= 25) {
    return "MONITOR";
  }

  return "ALLOW";
};

module.exports = makeDecision;