# Luna gRPC Example

Demonstrates `@lunafw/platform-grpc` with a simple `UserService` defined in a `.proto` file.

## Running

```bash
npm install
npm start
```

The server starts on port **50051**.

## Structure

```
src/
├── main.ts                          # Bootstrap with GrpcAdapter
├── app.module.ts
├── proto/
│   └── users.proto                  # UserService definition
├── common/
│   └── interceptors/
│       └── logging.interceptor.ts   # Logs every gRPC call
└── modules/
    └── users/
        ├── user.model.ts
        ├── users.service.ts         # In-memory store
        ├── users.controller.ts      # @Controller('UserService')
        └── users.module.ts
```

## How It Works

The controller maps directly to the proto service:

```typescript
@Controller('UserService')   // matches service name in .proto
export class UsersController {
  @On('GetUser')             // matches rpc method name
  getUser(@Body('id') id: string) { ... }

  @On('ListUsers')
  listUsers() { ... }

  @On('CreateUser')
  createUser(@Body() req: Omit<User, 'id'>) { ... }

  @On('DeleteUser')
  deleteUser(@Body('id') id: string) { ... }
}
```

`GrpcAdapter` is initialized with the proto path and package name:

```typescript
const adapter = new GrpcAdapter({
  port: 50051,
  protoPath: path.join(__dirname, 'proto', 'users.proto'),
  packageName: 'users',
})
```

## Testing

Use [grpcurl](https://github.com/fullstorydev/grpcurl) or any gRPC client.

```bash
# Create a user
grpcurl -plaintext -d '{"name":"Alice","email":"alice@example.com"}' \
  localhost:50051 users.UserService/CreateUser

# List all users
grpcurl -plaintext -d '{}' localhost:50051 users.UserService/ListUsers

# Get a user by ID
grpcurl -plaintext -d '{"id":"<id>"}' localhost:50051 users.UserService/GetUser

# Delete a user
grpcurl -plaintext -d '{"id":"<id>"}' localhost:50051 users.UserService/DeleteUser
```
