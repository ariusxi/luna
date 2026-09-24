import { RequestHandler } from 'express'

export interface ExpressRoutePath {
  path: string | RegExp
  paramsMiddleware: RequestHandler[]
  isWildcard: boolean
}

const PARAM_NAME = /^[A-Za-z_][A-Za-z0-9_]*$/

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Compiles Luna's terminal wildcard syntax to a RegExp accepted by Express 4
 * and Express 5. Captures are copied from Express's numeric RegExp params to
 * stable named params before the route handler runs.
 */
export function compileExpressRoutePath(path: string): ExpressRoutePath {
  if (!path.includes('*')) return { path, paramsMiddleware: [], isWildcard: false }

  const normalized = path === '*' ? '/*' : path
  const wildcardMatches = [...normalized.matchAll(/\*/g)]
  const wildcardIndex = wildcardMatches[0]?.index ?? -1

  if (wildcardMatches.length !== 1 || wildcardIndex < 0) {
    throw new Error(`ExpressAdapter: route "${path}" must contain exactly one wildcard`)
  }

  const wildcardName = normalized.slice(wildcardIndex + 1) || 'wildcard'
  if (!PARAM_NAME.test(wildcardName)) {
    throw new Error(`ExpressAdapter: wildcard in route "${path}" must be terminal and optionally named`)
  }

  const prefix = normalized.slice(0, wildcardIndex)
  const paramNames: string[] = []
  let source = ''

  for (const segment of prefix.split('/')) {
    if (!segment) continue
    source += '/'
    if (segment.startsWith(':')) {
      const name = segment.slice(1)
      if (!PARAM_NAME.test(name)) {
        throw new Error(`ExpressAdapter: unsupported parameter segment "${segment}" in wildcard route "${path}"`)
      }
      paramNames.push(name)
      source += '([^/]+)'
    } else {
      source += escapeRegExp(segment)
    }
  }

  const isRootWildcard = prefix === '/'
  if (isRootWildcard) source = ''
  paramNames.push(wildcardName)
  source += isRootWildcard ? '/(.*)' : '/(.+)'

  const route = new RegExp(`^${source}/?$`)
  const paramsMiddleware: RequestHandler = (request, _response, next) => {
    const captures = paramNames.map((_name, index) => request.params[String(index)])
    for (const [index, name] of paramNames.entries()) {
      request.params[name] = captures[index]
      delete request.params[String(index)]
    }
    next()
  }

  return { path: route, paramsMiddleware: [paramsMiddleware], isWildcard: true }
}
