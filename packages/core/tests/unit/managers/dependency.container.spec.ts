import 'reflect-metadata'
import { DependencyContainer } from '../../../src/core/managers/dependency.container'
import { Injectable } from '../../../src/core/decorators/injectable.decorator'
import { Inject } from '../../../src/core/decorators/inject.decorator'
import { ProviderScope } from '../../../src/core/types'

describe('DependencyContainer', () => {
  let container: DependencyContainer

  beforeEach(() => {
    container = new DependencyContainer(class TestModule {})
  })

  describe('register', () => {
    it('should register an injectable class', () => {
      @Injectable()
      class MyService {}

      expect(() => container.register(MyService)).not.toThrow()
    })

    it('should throw if class is not decorated with @Injectable', () => {
      class NotInjectable {}

      expect(() => container.register(NotInjectable as any)).toThrow(
        'NotInjectable is not decorated with @Injectable.'
      )
    })

    it('should register a ValueProvider', () => {
      expect(() =>
        container.register({ provide: 'TOKEN', useValue: 42 })
      ).not.toThrow()
    })

    it('should register a FactoryProvider', () => {
      expect(() =>
        container.register({ provide: 'TOKEN', useFactory: () => 'result' })
      ).not.toThrow()
    })

    it('should register a ClassProvider', () => {
      @Injectable()
      class Impl {}

      expect(() =>
        container.register({ provide: 'TOKEN', useClass: Impl })
      ).not.toThrow()
    })
  })

  describe('resolve', () => {
    it('should resolve a registered injectable', () => {
      @Injectable()
      class MyService {}

      container.register(MyService)
      const instance = container.resolve<MyService>(MyService)

      expect(instance).toBeInstanceOf(MyService)
    })

    it('should throw DependencyResolutionError for unregistered token', () => {
      @Injectable()
      class Unknown {}

      expect(() => container.resolve(Unknown)).toThrow('[Luna] Cannot resolve')
    })

    it('should resolve dependencies recursively', () => {
      @Injectable()
      class Dep {}

      @Injectable()
      class Service {
        constructor(public dep: Dep) {}
      }

      container.register(Dep)
      container.register(Service)

      const instance = container.resolve<Service>(Service)
      expect(instance.dep).toBeInstanceOf(Dep)
    })

    it('should resolve a ValueProvider', () => {
      container.register({ provide: 'API_KEY', useValue: 'secret' })
      expect(container.resolve('API_KEY')).toBe('secret')
    })

    it('should resolve a FactoryProvider', () => {
      container.register({ provide: 'Config', useFactory: () => ({ port: 3000 }) })
      expect(container.resolve('Config')).toEqual({ port: 3000 })
    })

    it('should resolve a FactoryProvider with injected dependencies', () => {
      @Injectable()
      class Db {}

      container.register(Db)
      container.register({
        provide: 'Repo',
        useFactory: (db: Db) => ({ db }),
        inject: [Db],
      })

      const repo = container.resolve<{ db: Db }>('Repo')
      expect(repo.db).toBeInstanceOf(Db)
    })

    it('should resolve with @Inject token', () => {
      @Injectable()
      class Service {
        constructor(@Inject('API_KEY') public key: string) {}
      }

      container.register({ provide: 'API_KEY', useValue: 'my-key' })
      container.register(Service)

      const instance = container.resolve<Service>(Service)
      expect(instance.key).toBe('my-key')
    })

    it('should return same instance for Singleton scope', () => {
      @Injectable()
      class SingletonService {}

      container.register(SingletonService)
      const a = container.resolve<SingletonService>(SingletonService)
      const b = container.resolve<SingletonService>(SingletonService)

      expect(a).toBe(b)
    })

    it('should return different instances for Transient scope', () => {
      @Injectable({ scope: ProviderScope.Transient })
      class TransientService {}

      container.register(TransientService)
      const a = container.resolve<TransientService>(TransientService)
      const b = container.resolve<TransientService>(TransientService)

      expect(a).not.toBe(b)
    })

    it('should include dependencyOf in error message', () => {
      @Injectable()
      class Missing {}

      @Injectable()
      class Parent {
        constructor(public dep: Missing) {}
      }

      container.register(Parent)

      expect(() => container.resolve(Parent)).toThrow('Required by Parent')
    })
  })

  describe('getProvider', () => {
    it('should return the registered provider', () => {
      container.register({ provide: 'TOKEN', useValue: 1 })
      expect(container.getProvider('TOKEN')).toBeDefined()
    })

    it('should return undefined for unknown token', () => {
      expect(container.getProvider('UNKNOWN')).toBeUndefined()
    })
  })

  describe('boot', () => {
    it('should instantiate all registered providers', () => {
      @Injectable()
      class A {}

      @Injectable()
      class B {}

      container.register(A)
      container.register(B)
      container.boot()

      expect(container.resolve<A>(A)).toBeInstanceOf(A)
      expect(container.resolve<B>(B)).toBeInstanceOf(B)
    })
  })
})
