import { compileExpressRoutePath } from '../../src/routing/express-route-path'

describe('compileExpressRoutePath', () => {
  it('leaves ordinary Express paths unchanged', () => {
    const route = compileExpressRoutePath('/:id')

    expect(route.path).toBe('/:id')
    expect(route.paramsMiddleware).toEqual([])
    expect(route.isWildcard).toBe(false)
  })

  it.each(['*', '/*'])('compiles the root wildcard %s', (path) => {
    const route = compileExpressRoutePath(path)

    expect(route.path).toBeInstanceOf(RegExp)
    expect((route.path as RegExp).test('/')).toBe(true)
    expect((route.path as RegExp).test('/images/avatar.png')).toBe(true)
  })

  it('compiles a named terminal wildcard and preceding params', () => {
    const route = compileExpressRoutePath('/users/:id/files/*filepath')
    const pattern = route.path as RegExp

    expect(pattern.exec('/users/42/files/avatar/photo.png')?.slice(1)).toEqual([
      '42',
      'avatar/photo.png',
    ])
    expect(pattern.test('/users/42/files')).toBe(false)
  })

  it.each(['/files/*/edit', '/files/**', '/files/*bad-name'])(
    'rejects invalid wildcard syntax: %s',
    (path) => expect(() => compileExpressRoutePath(path)).toThrow('ExpressAdapter:'),
  )
})
