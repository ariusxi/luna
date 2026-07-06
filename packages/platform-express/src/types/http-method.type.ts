/**
 * HTTP methods supported by the Express adapter.
 *
 * Maps directly to Express `Router` methods, ensuring type safety
 * when using `@On` with the Express adapter.
 */
export type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete' | 'options' | 'head'
