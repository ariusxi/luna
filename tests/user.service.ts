import { Injectable } from '../packages/core'

@Injectable()
export class UserService {
  public getUsers(): string[] {
    return ['Alice', 'Bob']
  }
}