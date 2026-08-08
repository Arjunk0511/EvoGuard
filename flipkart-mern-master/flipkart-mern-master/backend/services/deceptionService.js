const honeypotMapping = {
    BRUTE_FORCE: {
        honeypotType: 'LOGIN',
        redirectPath: '/honeypot/login'
    },

    ADMIN_ENUMERATION: {
        honeypotType: 'ADMIN',
        redirectPath: '/honeypot/admin'
    },

    ENDPOINT_SCANNING: {
        honeypotType: 'ADMIN',
        redirectPath: '/honeypot/admin'
    },

    BOT_TRAFFIC: {
        honeypotType: 'CATALOG',
        redirectPath: '/honeypot/catalog'
    },

    SQL_INJECTION: {
        honeypotType: 'DATABASE',
        redirectPath: '/honeypot/database'
    },

    DEFAULT: {
        honeypotType: 'ADMIN',
        redirectPath: '/honeypot/admin'
    }
};


const selectHoneypot = ({ attackType, riskStatus }) => {
    const target =
        honeypotMapping[attackType] ||
        honeypotMapping.DEFAULT;

    return {
        honeypotType: target.honeypotType,
        redirectPath: target.redirectPath,
        attackType: attackType || 'UNKNOWN',
        riskStatus: riskStatus || 'UNKNOWN'
    };
};


module.exports = {
    selectHoneypot
};