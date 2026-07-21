import { Injectable } from '@lunafw/core'
import { User } from './user.model'

@Injectable()
export class UsersService {
  private users: User[] = [
    { id: '1', name: 'Alice', email: 'alice@example.com' },
    { id: '2', name: 'Bob', email: 'bob@example.com' },
  ]

  findAll(): User[] {
    return this.users
  }

  findOne(id: string): User | null {
    return this.users.find((u) => u.id === id) ?? null
  }

  create(data: Omit<User, 'id'>): User {
    const user: User = { id: String(this.users.length + 1), ...data }
    this.users.push(user)
    return user
  }

  remove(id: string): boolean {
    const index = this.users.findIndex((u) => u.id === id)
    if (index === -1) return false
    this.users.splice(index, 1)
    return true
  }
}
