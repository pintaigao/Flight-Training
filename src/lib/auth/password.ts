import bcrypt from 'bcryptjs'

// NOTE: This is a simple client-side demo helper.
// In a real app, password hashing & verification should happen on the server.

const COST = 10

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, COST)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash)
}
