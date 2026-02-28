import type { AppState, User } from '@/store/types'

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

export function findUserByEmail(state: AppState, email: string): User | null {
  const target = normalizeEmail(email)
  for (const id of state.userIds) {
    const u = state.usersById[id]
    if (u && normalizeEmail(u.email) === target) return u
  }
  return null
}

export function makeUserId(email: string) {
  // stable enough for a demo (no crypto requirements)
  return `u-${normalizeEmail(email).replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`
}
