import '@testing-library/jest-dom'

// Stub minimal de localStorage pour jsdom
const store = {}
const localStorageMock = {
  getItem:    (k)    => store[k] ?? null,
  setItem:    (k, v) => { store[k] = String(v) },
  removeItem: (k)    => { delete store[k] },
  clear:      ()     => { Object.keys(store).forEach(k => delete store[k]) },
}
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock })

// Stub fetch global (remplacé par vi.fn() dans les tests qui en ont besoin)
globalThis.fetch = vi.fn()

afterEach(() => {
  localStorageMock.clear()
  vi.restoreAllMocks()
})
