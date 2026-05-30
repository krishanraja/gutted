// Lazily construct a module-level client singleton.
//
// Importing an API route at build time evaluates its module-scope code. If a
// client is built eagerly there (new Stripe(process.env.X!), new Anthropic(...),
// etc.) and the secret is absent, construction throws and `next build` crashes
// during the "Collecting page data" step. Wrapping construction in this helper
// defers it to the first property access at request time, so a build with no
// secrets stays green. The proxy only intercepts the top-level access; nested
// resources (anthropic.messages, stripe.webhooks, resend.emails) are the real
// SDK objects, and methods are bound to the real instance, so private fields and
// signature verification behave exactly as with a directly constructed client.
export function lazyClient<T extends object>(factory: () => T): T {
  let instance: T | undefined
  return new Proxy({} as T, {
    get(_target, prop) {
      instance ??= factory()
      const value = (instance as Record<string | symbol, unknown>)[prop]
      return typeof value === 'function'
        ? (value as (...args: unknown[]) => unknown).bind(instance)
        : value
    },
  })
}
