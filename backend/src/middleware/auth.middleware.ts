import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: "admin" | "owner" | "guest";
    teamId: string | null;
  };
}

export const authenticateJWT = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    const secret = process.env.JWT_SECRET || "supersecretjwtsecretkeyshouldbe32charactersormore!";

    jwt.verify(token, secret, (err, decoded) => {
      if (err) {
        return res.status(403).json({ message: "Invalid or expired token" });
      }

      const payload = decoded as { id: string; role: "admin" | "owner" | "guest"; teamId: string | null };
      req.user = payload;
      next();
    });
  } else {
    res.status(401).json({ message: "Authorization header is missing or malformed" });
  }
};

export const requireRole = (roles: ("admin" | "owner" | "guest")[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden: insufficient permissions" });
    }

    next();
  };
};
