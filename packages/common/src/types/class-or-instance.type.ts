/** A class constructor — used to instantiate or resolve from the DI container. */
export interface ClassConstructor<T> {
  new(...args: unknown[]): T
}

/**
 * A value that is either a class constructor or an already-constructed instance.
 *
 * Luna decorators (`@UseGuards`, `@UsePipes`, `@UseInterceptors`) accept both
 * forms so that middleware can receive configuration at decoration time without
 * needing the DI container.
 *
 * - **Class** — resolved from the DI container; falls back to `new Class()` if
 *   not registered.
 * - **Instance** — used as-is; no DI resolution or instantiation.
 *
 * @example
 * // class — resolved via DI
 * @UsePipes(ValidationPipe)
 *
 * // instance — receives schema at decoration time
 * @UsePipes(new ZodPipe(CreateUserSchema))
 */
export type ClassOrInstance<T> = ClassConstructor<T> | T
