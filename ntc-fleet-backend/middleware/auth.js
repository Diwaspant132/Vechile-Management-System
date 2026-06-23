import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

// Ensure JWT_SECRET is explicitly configured in production to avoid security misconfigurations
if (process.env.NODE_ENV === 'production' && !JWT_SECRET) {
  console.error("FATAL ERROR: JWT_SECRET environment variable is not defined in production.");
  process.exit(1);
}

const getSecret = () => process.env.JWT_SECRET || 'NTC_SUPER_SECRET_KEY_9841';

export const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: "Access denied. No token provided." });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: "Access denied. Invalid token format." });
    }

    const decoded = jwt.verify(token, getSecret());
    req.user = decoded; // { userId, role, branch }
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: "Session expired. Please log in again." });
    }
    return res.status(401).json({ error: "Invalid token." });
  }
};

export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({ error: "Access denied. Unknown identity." });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Access denied. Insufficient permissions." });
    }

    next();
  };
};
