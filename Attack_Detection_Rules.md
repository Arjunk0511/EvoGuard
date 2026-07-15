# Attack Detection Rules

## Overview

This document defines the attack detection rules implemented by the EvoGuard Intrusion Detection Middleware. These rules are used to inspect incoming HTTP requests, assign risk scores, and determine the appropriate security action.

The current implementation follows a rule-based detection approach. Future versions will extend these rules using behavioral biometrics, machine learning models, and adaptive self-healing mechanisms.

---

# Risk Score Levels

| Risk Score | Risk Level | Action |
|------------|-----------|--------|
| 0 – 19 | Low | Allow Request |
| 20 – 39 | Medium | Monitor Request |
| 40 – 59 | High | Apply Rate Limiting |
| 60 – 79 | Very High | Redirect to Honeypot *(Future)* |
| 80 – 100 | Critical | Block Request |

---

# 1. SQL Injection Detection

### Description

Detects malicious SQL statements injected through query parameters, request bodies, or form inputs.

### Detection Patterns

```text
'
--
#
;
OR 1=1
UNION
SELECT
INSERT
UPDATE
DELETE
DROP
EXEC
xp_cmdshell
information_schema
```

### Risk Score

+40

### Security Action

- Block Request
- Create Security Log
- Store Attack Details
- Generate Alert (Optional)

---

# 2. Cross-Site Scripting (XSS)

### Description

Detects malicious JavaScript code embedded within user input that may execute in another user's browser.

### Detection Patterns

```text
<script
</script>
javascript:
onload=
onerror=
alert(
document.cookie
window.location
```

### Risk Score

+35

### Security Action

- Block Request
- Create Security Log
- Increase Client Risk Score

---

# 3. Path Traversal

### Description

Detects attempts to access files outside the intended application directory.

### Detection Patterns

```text
../
..\
%2e%2e
/etc/passwd
boot.ini
windows/system32
```

### Risk Score

+30

### Security Action

- Block Request
- Log Attack
- Increase Client Risk Score

---

# 4. Suspicious URL Detection

### Description

Detects requests targeting commonly exploited administrative or sensitive endpoints.

### Detection Patterns

```text
/.env
/.git
/phpmyadmin
/wp-admin
/admin
/config
/server-status
```

### Risk Score

+20

### Security Action

- Log Suspicious Activity
- Increase Risk Score
- Continue Monitoring

---

# 5. Brute Force Detection

### Description

Detects repeated failed authentication attempts originating from the same IP address.

### Detection Rule

```text
Failed Login Attempts ≥ 5
```

### Risk Score

+40

### Security Action

- Block or Rate Limit Requests
- Log Attack
- Trigger Alert (Optional)

---

# 6. High Request Rate Detection

### Description

Detects unusually high request frequency that may indicate bots, scanners, or denial-of-service attempts.

### Detection Rule

```text
More than 100 requests per minute
```

### Risk Score

+30

### Security Action

- Apply Rate Limiting
- Log Request
- Continue Monitoring

---

# 7. Invalid HTTP Method Detection

### Description

Detects unsupported or suspicious HTTP methods that are not used by the application.

### Detection Patterns

```text
TRACE
CONNECT
TRACK
```

### Risk Score

+15

### Security Action

- Reject Request
- Log Event

---

# 8. User-Agent Validation

### Description

Identifies requests with missing, empty, or suspicious User-Agent headers commonly associated with automated tools.

### Detection Patterns

```text
Empty User-Agent
curl
python-requests
sqlmap
nikto
wget
```

### Risk Score

+15

### Security Action

- Increase Risk Score
- Log Suspicious Client

---

# Logging Requirements

Every detected event should generate a security log containing the following information:

- Request ID
- Timestamp
- IP Address
- HTTP Method
- Requested Endpoint
- User-Agent
- Attack Type
- Risk Score
- Security Action
- Response Status

---

# Current Implementation

The first version of EvoGuard implements rule-based detection using request inspection and configurable risk scoring.

Implemented Features:

- SQL Injection Detection
- XSS Detection
- Path Traversal Detection
- Suspicious URL Detection
- Brute Force Detection
- Request Rate Monitoring
- Security Logging

---

# Future Enhancements

The following capabilities are planned for future releases:

- Behavioral Biometrics (Keystroke Dynamics & Mouse Movement)
- Machine Learning-Based Threat Classification
- Progressive Risk Evolution Engine
- Adaptive Honeypot Redirection
- Explainable AI (XAI)
- Self-Healing Security Rules
- Dynamic Risk Thresholds
- Threat Intelligence Integration
- Automated Security Alerts
- Cloud-Based Threat Monitoring

---

# Note

The detection rules presented in this document represent the initial rule-based implementation of EvoGuard. They are intended to provide a strong security baseline while supporting future research on adaptive intrusion detection, behavioral analysis, cyber deception, and self-healing web application security.
