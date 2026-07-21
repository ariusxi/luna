/**
 * Configuration options for the gRPC adapter.
 */
export interface GrpcAdapterOptions {
  /** TCP port to listen on. Pass `0` to let the OS assign a free port. */
  port: number
  /**
   * Absolute path (or array of paths) to `.proto` files that define the
   * services handled by this adapter.
   */
  protoPath: string | string[]
  /**
   * Name of the protobuf package as declared in the `.proto` file
   * (the `package` statement). Used to locate service definitions.
   *
   * @example 'users' for `package users;`
   */
  packageName: string
}
