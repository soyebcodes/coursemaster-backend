/**
 * Middleware to check if user has required role
 */
const roleCheck = (requiredRoles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (!requiredRoles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Forbidden - insufficient permissions' });
  }

  next();
};

module.exports = roleCheck;
