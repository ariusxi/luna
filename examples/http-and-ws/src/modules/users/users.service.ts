import { Injectable } from '@lunafw/core'
import { NotFoundError } from '../../common/filters/domain-exception.filter'
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

  findOne(id: string): User {
    const user = this.users.find((u) => u.id === id)
    if (!user) throw new NotFoundError('User', id)
    return user
  }

  create(data: Omit<User, 'id'>): User {
    const user: User = { id: String(this.users.length + 1), ...data }
    this.users.push(user)
    return user
  }

  remove(id: string): { deleted: boolean } {
    const index = this.users.findIndex((u) => u.id === id)
    if (index === -1) throw new NotFoundError('User', id)
    this.users.splice(index, 1)
    return { deleted: true }
  }
}
