import { describe, it, expect, beforeAll } from 'vitest'

beforeAll(() => {
  process.env.ENCRYPTION_KEY = 'a'.repeat(64)
})

const getCrypto = () => import('../lib/crypto')

describe('encrypt / decrypt', () => {
  it('round-trips a plaintext string', async () => {
    const { encrypt, decrypt } = await getCrypto()
    const original = 'sk-test-abc123XYZ'
    expect(decrypt(encrypt(original))).toBe(original)
  })

  it('produces different ciphertext each call (random IV)', async () => {
    const { encrypt } = await getCrypto()
    expect(encrypt('hello')).not.toBe(encrypt('hello'))
  })

  it('throws on tampered ciphertext', async () => {
    const { encrypt, decrypt } = await getCrypto()
    const ct = encrypt('secret')
    const tampered = ct.slice(0, -4) + 'AAAA'
    expect(() => decrypt(tampered)).toThrow()
  })
})

describe('mask', () => {
  it('masks a long key', async () => {
    const { mask } = await getCrypto()
    expect(mask('sk-ant-api01-ABCDEF')).toMatch(/^sk-ant-.*\*{4}.*/)
  })

  it('returns **** for short values', async () => {
    const { mask } = await getCrypto()
    expect(mask('abc')).toBe('****')
  })
})
