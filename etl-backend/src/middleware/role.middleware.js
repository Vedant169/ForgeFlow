'use strict';

/**
 * Role-Based Access Control (RBAC) middleware.
 * Verifies that the authenticated user's role is included in allowedRoles.
 *
 * Supported Roles:
 * - 'admin'     : Full access to all user records, administration, and execution
 * - 'developer' : Default role; can execute pipelines, view their own pipeline history and analytics
 * - 'viewer'    : Read-only access to authorized records
 *
 * @param {...string} allowedRoles - List of authorized roles (e.g. 'admin', 'developer')
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required before role verification.',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access requires one of the following roles: [${allowedRoles.join(', ')}]. Current role: '${req.user.role}'.`,
      });
    }

    next();
  };
};

module.exports = authorize;
