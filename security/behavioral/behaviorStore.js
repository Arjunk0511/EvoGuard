const behaviorProfiles = new Map();

const createProfile = () => ({
  totalRequests: 0,
  requestTimestamps: [],
  endpoints: [],
  payloadCounts: {},
  failedLoginAttempts: 0,
  lastSeen: null,
});

const getBehaviorProfile = (identifier) => {
  if (!behaviorProfiles.has(identifier)) {
    behaviorProfiles.set(identifier, createProfile());
  }

  return behaviorProfiles.get(identifier);
};

const updateBehaviorProfile = (identifier, requestData) => {
  const profile = getBehaviorProfile(identifier);
  const now = Date.now();

  profile.totalRequests += 1;
  profile.lastSeen = now;
  profile.requestTimestamps.push(now);
  profile.endpoints.push(requestData.endpoint);

  const payload = JSON.stringify({
    method: requestData.method,
    endpoint: requestData.endpoint,
    query: requestData.query || {},
    body: requestData.body || {},
    params: requestData.params || {},
  });

  profile.payloadCounts[payload] = (profile.payloadCounts[payload] || 0) + 1;

  return profile;
};

const removeOldTimestamps = (profile, windowMilliseconds) => {
  const cutoffTime = Date.now() - windowMilliseconds;

  profile.requestTimestamps = profile.requestTimestamps.filter(
    (timestamp) => timestamp >= cutoffTime,
  );

  return profile.requestTimestamps;
};

const clearBehaviorProfile = (identifier) => {
  behaviorProfiles.delete(identifier);
};

const incrementFailedLoginAttempts = (identifier) => {
  const profile = getBehaviorProfile(identifier);

  profile.failedLoginAttempts += 1;

  return profile.failedLoginAttempts;
};

const resetFailedLoginAttempts = (identifier) => {
  const profile = getBehaviorProfile(identifier);

  profile.failedLoginAttempts = 0;

  return profile.failedLoginAttempts;
};

module.exports = {
  getBehaviorProfile,
  updateBehaviorProfile,
  removeOldTimestamps,
  clearBehaviorProfile,
  incrementFailedLoginAttempts,
  resetFailedLoginAttempts,
};
