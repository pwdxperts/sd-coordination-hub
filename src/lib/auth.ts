import { prisma } from './prisma'
import bcrypt from 'bcryptjs'
import * as crypto from 'crypto'

// ============================================================
// TYPE DEFINITIONS
// ============================================================

export interface AuthUser {
  id: string
  name: string
  email: string
  role: string
  phone: string | null
  department: string | null
  province: string | null
  municipality: string | null
  mfaEnabled: boolean
  mfaVerified?: boolean
}

export type UserRole =
  | 'public_reporter'
  | 'hub_intake'
  | 'hub_analyst'
  | 'provincial_coordinator'
  | 'municipal_user'
  | 'sector_user'
  | 'rapid_response'
  | 'executive_viewer'
  | 'system_admin'

// ============================================================
// ROLE HIERARCHY & PERMISSIONS
// ============================================================

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  public_reporter: 0,
  hub_intake: 1,
  municipal_user: 2,
  sector_user: 2,
  provincial_coordinator: 3,
  rapid_response: 3,
  executive_viewer: 4,
  hub_analyst: 4,
  system_admin: 99,
}

export const ROLE_LABELS: Record<UserRole, string> = {
  public_reporter: 'Public Reporter',
  hub_intake: 'Hub Intake',
  hub_analyst: 'Hub Analyst',
  provincial_coordinator: 'Provincial Coordinator',
  municipal_user: 'Municipal User',
  sector_user: 'Sector User',
  rapid_response: 'Rapid Response',
  executive_viewer: 'Executive Viewer',
  system_admin: 'System Admin',
}

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  public_reporter: ['cases:submit', 'cases:track_own'],
  hub_intake: ['intake:view', 'intake:verify', 'intake:reject', 'cases:view'],
  hub_analyst: [
    'cases:view', 'cases:classify', 'cases:assign', 'cases:escalate',
    'cases:add_evidence', 'cases:add_comment', 'intake:view',
    'reports:view', 'dashboard:view',
  ],
  provincial_coordinator: [
    'cases:view_own_province', 'cases:assign', 'cases:escalate',
    'interventions:manage', 'dashboard:view', 'reports:view',
  ],
  municipal_user: [
    'cases:view_own_municipality', 'cases:submit_action_plan',
    'cases:add_evidence', 'cases:add_comment',
  ],
  sector_user: [
    'cases:view_own_sector', 'cases:escalate',
    'cases:add_comment', 'reports:view',
  ],
  rapid_response: [
    'cases:view_assigned', 'cases:add_evidence',
    'cases:add_comment', 'cases:update_progress',
  ],
  executive_viewer: [
    'dashboard:view', 'reports:view', 'executive:view',
    'cases:view', 'geography:view',
  ],
  system_admin: [
    'users:manage', 'settings:manage', 'audit:view',
    'cases:*', 'intake:*', 'dashboard:*', 'reports:*',
    'executive:*', 'geography:*', 'interventions:*',
  ],
}

export function hasPermission(user: AuthUser, permission: string): boolean {
  const perms = ROLE_PERMISSIONS[user.role] || []
  return perms.includes('*:*') || perms.includes(permission) ||
    perms.some((p: string) => {
      const [area, action] = p.split(':')
      if (area === '*') return true
      if (action === '*') return permission.startsWith(area + ':')
      return p === permission
    })
}

export function canAccessCase(user: AuthUser, caseData: { province?: string | null; sector?: string | null; municipality?: string | null; assignedToId?: string | null }): boolean {
  if (user.role === 'system_admin' || user.role === 'hub_analyst') return true
  if (user.role === 'provincial_coordinator' && caseData.province === user.province) return true
  if (user.role === 'municipal_user' && caseData.municipality === user.municipality) return true
  if (user.role === 'sector_user' && caseData.sector === user.department) return true
  if (user.role === 'rapid_response' && caseData.assignedToId === user.id) return true
  if (user.role === 'executive_viewer') return true
  return false
}

// ============================================================
// PASSWORD VALIDATION
// ============================================================

export function validatePassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 8) return { valid: false, message: 'Password must be at least 8 characters' }
  if (!/[A-Z]/.test(password)) return { valid: false, message: 'Password must contain an uppercase letter' }
  if (!/[a-z]/.test(password)) return { valid: false, message: 'Password must contain a lowercase letter' }
  if (!/[0-9]/.test(password)) return { valid: false, message: 'Password must contain a number' }
  return { valid: true }
}

// ============================================================
// AUTH FUNCTIONS
// ============================================================

export async function verifyLogin(email: string, password: string): Promise<AuthUser | null> {
  const user = await prisma.user.findUnique({ where: { email } })

  if (!user || !user.active) return null

  // Check if account is locked
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    throw new Error('ACCOUNT_LOCKED')
  }

  const valid = await bcrypt.compare(password, user.password)

  if (!valid) {
    // Increment login attempts
    const attempts = user.loginAttempts + 1
    const updateData: any = { loginAttempts: attempts }

    // Lock after 5 failed attempts for 15 minutes
    if (attempts >= 5) {
      updateData.lockedUntil = new Date(Date.now() + 15 * 60 * 1000)
      updateData.loginAttempts = 0
    }

    await prisma.user.update({ where: { id: user.id }, data: updateData })
    return null
  }

  // Reset login attempts on success
  await prisma.user.update({
    where: { id: user.id },
    data: { loginAttempts: 0, lockedUntil: null },
  })

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    department: user.department,
    province: user.province,
    municipality: user.municipality,
    mfaEnabled: user.mfaEnabled,
  }
}

export async function updateLastLogin(userId: string, ip?: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { lastLogin: new Date(), lastLoginIp: ip || null },
  })
}

export async function getUserById(id: string): Promise<AuthUser | null> {
  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) return null
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    department: user.department,
    province: user.province,
    municipality: user.municipality,
    mfaEnabled: user.mfaEnabled,
  }
}

export function hasAccess(user: AuthUser, requiredRoles: string[]): boolean {
  return requiredRoles.includes(user.role)
}

export function canAssign(user: AuthUser): boolean {
  return ['system_admin', 'provincial_coordinator', 'hub_analyst'].includes(user.role)
}

export function canEscalate(user: AuthUser): boolean {
  return ['system_admin', 'provincial_coordinator', 'hub_analyst'].includes(user.role)
}

export function canResolve(user: AuthUser): boolean {
  return ['system_admin', 'provincial_coordinator', 'hub_analyst'].includes(user.role)
}

export function getAssignedProvince(user: AuthUser): string | null {
  return user.province || null
}

export function canReassign(user: AuthUser): boolean {
  return ['system_admin', 'provincial_coordinator', 'hub_analyst'].includes(user.role)
}

// ============================================================
// MFA (TOTP) FUNCTIONS
// ============================================================

export function generateMfaSecret(): { base32: string; otpauthUrl: string } {
  const secret = crypto.randomBytes(20).toString('hex')
  const base32 = Buffer.from(secret).toString('base64').replace(/=/g, '').substring(0, 32).toUpperCase()
  const otpauthUrl = `otpauth://totp/NSDCH:${base32}?secret=${base32}&issuer=NSDCH-CoGTA&algorithm=SHA1&digits=6&period=30`
  return { base32, otpauthUrl }
}

export function verifyTOTP(secret: string, token: string): boolean {
  // In production, use speakeasy or otplib library
  // This is a simplified check - actual TOTP requires proper time-based HMAC
  // For demo, accept any 6-digit number if the secret is set
  if (!secret || !token) return false
  if (token.length !== 6 || !/^\d{6}$/.test(token)) return false
  
  // In production, this would do proper TOTP verification
  // For the prototype, we check against the stored secret
  const decoded = Buffer.from(secret, 'base64').toString('hex')
  const hash = crypto.createHmac('sha1', decoded).update(Math.floor(Date.now() / 30000).toString()).digest('hex')
  const offset = parseInt(hash.substring(hash.length - 1), 16)
  const otp = (parseInt(hash.substring(offset * 2, offset * 2 + 8), 16) & 0x7fffffff) % 1000000
  const expected = otp.toString().padStart(6, '0')
  
  return token === expected
}

export async function setupMfa(userId: string): Promise<{ secret: string; otpauthUrl: string } | null> {
  const { base32, otpauthUrl } = generateMfaSecret()
  await prisma.user.update({
    where: { id: userId },
    data: { mfaSecret: base32, mfaEnabled: false },
  })
  return { secret: base32, otpauthUrl }
}

export async function enableMfa(userId: string, token: string): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user?.mfaSecret) return false
  if (!verifyTOTP(user.mfaSecret, token)) return false
  await prisma.user.update({
    where: { id: userId },
    data: { mfaEnabled: true },
  })
  return true
}

export async function disableMfa(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { mfaEnabled: false, mfaSecret: null },
  })
}

// ============================================================
// REFERENCE NUMBER GENERATION
// ============================================================

export function generateReference(): string {
  const year = new Date().getFullYear()
  const prefix = `NSDCH-${year}-`
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `${prefix}${random}`
}

// ============================================================
// SESSION HELPERS
// ============================================================

export function parseSessionCookie(cookie?: string): { userId: string; role: string } | null {
  if (!cookie) return null
  try {
    const data = Buffer.from(cookie, 'base64').toString('utf-8')
    return JSON.parse(data)
  } catch {
    return null
  }
}

export function createSessionCookie(userId: string, role: string): string {
  return Buffer.from(JSON.stringify({ userId, role })).toString('base64')
}
