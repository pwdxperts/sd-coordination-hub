import { prisma } from './prisma'
import bcrypt from 'bcryptjs'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: string
  phone: string | null
  department: string | null
  province: string | null
  municipality: string | null
}

export async function verifyLogin(email: string, password: string): Promise<AuthUser | null> {
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user || !user.active) return null

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) return null

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    department: user.department,
    province: user.province,
    municipality: user.municipality,
  }
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
  }
}

export function hasAccess(user: AuthUser, requiredRoles: string[]): boolean {
  return requiredRoles.includes(user.role)
}

export function canAssign(user: AuthUser): boolean {
  return ['national_director', 'provincial_coordinator', 'hub_analyst', 'admin'].includes(user.role)
}

export function canEscalate(user: AuthUser): boolean {
  return ['national_director', 'provincial_coordinator', 'admin'].includes(user.role)
}

export function canResolve(user: AuthUser): boolean {
  return ['national_director', 'provincial_coordinator', 'hub_analyst', 'admin'].includes(user.role)
}

export function getAssignedProvince(user: AuthUser): string | null {
  return user.province || null
}

export function generateReference(): string {
  const year = new Date().getFullYear()
  const prefix = `NSDCH-${year}-`
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `${prefix}${random}`
}
