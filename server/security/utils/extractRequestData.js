/**
 * Extract Request Data Utility
 * -----------------------------------
 * Collects all possible user-controlled
 * inputs from an Express request object.
 *
 * Detectors use this utility so they don't
 * have to repeat the same extraction logic.
 */

function safeStringify(data) {

    if (data === undefined || data === null) {
        return "";
    }

    if (typeof data === "string") {
        return data;
    }

    try {

        return JSON.stringify(data);

    } catch (err) {

        return String(data);

    }

}

function extractRequestData(req) {

    return [

        // Request body
        safeStringify(req.body),

        // Query parameters
        safeStringify(req.query),

        // URL parameters
        safeStringify(req.params),

        // Original URL
        safeStringify(req.originalUrl),

        // Path
        safeStringify(req.path),

        // Headers (optional)
        safeStringify(req.headers),

        // Cookies (if cookie-parser is used)
        safeStringify(req.cookies)

    ];

}

module.exports = extractRequestData;