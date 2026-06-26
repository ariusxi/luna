import { Injectable } from "../src";

@Injectable()
export class UserService {
  public getUsers(): string[] {
    return ['Alice', 'Bob']
  }
}