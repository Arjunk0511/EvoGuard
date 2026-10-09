const clampRisk = (value) => {
  return Math.min(Math.max(value, 0), 100);
};

const calculateProgressiveRisk = ({
  existingRisk = 0,
  ruleRisk = 0,
  behavioralRisk = 0,
  mlRisk = 0,
  decay = 0,
}) => {
  const newRisk =
    Number(existingRisk) +
    Number(ruleRisk) +
    Number(behavioralRisk) +
    Number(mlRisk) -
    Number(decay);

  return {
    existingRisk: clampRisk(Number(existingRisk)),
    ruleRisk: clampRisk(Number(ruleRisk)),
    behavioralRisk: clampRisk(Number(behavioralRisk)),
    mlRisk: clampRisk(Number(mlRisk)),
    decay: Math.max(Number(decay), 0),
    totalRisk: clampRisk(newRisk),
  };
};

module.exports = calculateProgressiveRisk;