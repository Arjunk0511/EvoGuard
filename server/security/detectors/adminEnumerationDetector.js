const ADMIN_PATTERNS = [
    "/admin",
    "/admin/",
    "/admin/users",
    "/admin/user"
];

function adminEnumerationDetector(req) {

    const path = (req.originalUrl || req.url || "").toLowerCase();

    const isAdminProbe = ADMIN_PATTERNS.some(pattern =>
        path.includes(pattern)
    );

    if (!isAdminProbe) {
        return {
            detector: "AdminEnumerationDetector",
            detected: false
        };
    }

    return {
        detector: "AdminEnumerationDetector",
        detected: true,
        attackType: "ADMIN_ENUMERATION",
        severity: "HIGH",
        score: 80,
        reason: `Admin endpoint access detected: ${path}`
    };
}

module.exports = adminEnumerationDetector;