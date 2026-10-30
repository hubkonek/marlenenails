// Minimal declarations for the built-in Bun runner; no runtime dependency.
declare module 'bun:test' {
  export function describe(name: string, body: () => void): void
  export function test(name: string, body: () => void | Promise<void>): void
}
