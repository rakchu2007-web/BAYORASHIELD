import { Request, Response, NextFunction } from 'express';
import { Role } from '../src/types/security.ts';

export type Permission =
  | 'read:red_exploits'
  | 'write:red_exploits'
  | 'read:blue_defense'
  | 'write:blue_defense'
  | 'execute:model_tests'
  | 'audit:all'
  | 'isolation:verify';

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  red_team: ['read:red_exploits', 'write:red_exploits', 'execute:model_tests'],
  blue_team: ['read:blue_defense', 'write:blue_defense', 'execute:model_tests'],
  judge_auditor: [
    'read:red_exploits',
    'read:blue_defense',
    'audit:all',
    'isolation:verify',
    'execute:model_tests'
  ]
};

export const KNOWN_TOKENS: Record<string, { role: Role; name: string }> = {
  'BAYORA-RED-SECRET-KEY-9941': { role: 'red_team', name: 'Red Operator #104' },
  'BAYORA-BLUE-DEFENSE-KEY-3312': { role: 'blue_team', name: 'Blue Defender #208' },
  'BAYORA-JUDGE-AUDIT-KEY-7700': { role: 'judge_auditor', name: 'Security Auditor #001' }
};

export interface AuthenticatedRequest extends Request {
  userRole?: Role;
  userName?: string;
  userToken?: string;
}

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) || false;
}

export function extractAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    req.userRole = undefined;
    req.userName = 'Unauthenticated';
    req.userToken = '';
    return next();
  }

  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  const known = KNOWN_TOKENS[token];
  if (known) {
    req.userRole = known.role;
    req.userName = known.name;
    req.userToken = token;
  } else {
    req.userRole = undefined;
    req.userName = 'Invalid Token';
    req.userToken = token;
  }
  next();
}

export function requireRole(allowedRoles: Role[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.userRole) {
      return res.status(401).json({
        error: 'ERR_UNAUTHORIZED',
        message: 'Missing or invalid authentication token. Authorization denied by security gateway.',
        enforced: true,
        providedToken: req.userToken || 'NONE',
        allowedRoles
      });
    }

    if (!allowedRoles.includes(req.userRole)) {
      return res.status(403).json({
        error: 'ERR_FORBIDDEN_ROLE_ISOLATION',
        message: `Cross-team boundary violation: Role '${req.userRole}' is strictly denied access to this resource. Allowed roles: [${allowedRoles.join(', ')}].`,
        enforced: true,
        actorRole: req.userRole,
        actorName: req.userName,
        timestamp: new Date().toISOString()
      });
    }

    next();
  };
}

export function requirePermission(permission: Permission) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.userRole) {
      return res.status(401).json({
        error: 'ERR_UNAUTHORIZED',
        message: `Authentication required: Missing token for permission '${permission}'.`,
        requiredPermission: permission,
        enforced: true
      });
    }

    if (!hasPermission(req.userRole, permission)) {
      const allowedRoles = (Object.keys(ROLE_PERMISSIONS) as Role[]).filter(r =>
        ROLE_PERMISSIONS[r].includes(permission)
      );
      return res.status(403).json({
        error: 'ERR_FORBIDDEN_PERMISSION_DENIED',
        message: `Access blocked by RBAC boundary middleware: Role '${req.userRole}' does not possess required permission '${permission}'. Required role: [${allowedRoles.join(', ')}].`,
        requiredPermission: permission,
        attemptedRole: req.userRole,
        allowedRoles,
        enforced: true,
        timestamp: new Date().toISOString()
      });
    }

    next();
  };
}
