import { Injectable } from '@lunafw/core'

@Injectable()
export class UserService {
  public getUsers(): string[] {
    return ['Alice', 'Bob']
  }
}