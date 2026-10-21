import { test } from '@japa/runner'
import vine, { errors } from '@vinejs/vine'
import { publicHostField } from '#validators/helpers'

const validator = vine.compile(vine.object({ address: publicHostField() }))

async function validateAddress(address: string): Promise<string> {
  const { address: validated } = await validator.validate({ address })
  return validated
}

test.group('publicHostField', () => {
  test('accepte un nom de domaine, une IPv4 et une IPv6 publiques', async ({ assert }) => {
    assert.equal(await validateAddress('play.hypixel.net'), 'play.hypixel.net')
    assert.equal(await validateAddress('203.0.113.7'), '203.0.113.7')
    assert.equal(await validateAddress('2001:db8::1'), '2001:db8::1')
  })

  test('retire les espaces en bordure', async ({ assert }) => {
    assert.equal(await validateAddress('  play.hypixel.net  '), 'play.hypixel.net')
  })

  test('rejette les caractères de contrôle et interdits dans un hôte', async ({ assert }) => {
    for (const address of [
      'victim.com\u0000.attacker.com',
      'play.\nexample.com',
      'play example.com',
      'example.com/path',
      'user@example.com',
      'example.com#frag',
    ]) {
      await assert.rejects(() => validateAddress(address), errors.E_VALIDATION_ERROR)
    }
  })

  test('rejette un port collé à l’adresse', async ({ assert }) => {
    await assert.rejects(() => validateAddress('play.example.com:25565'), errors.E_VALIDATION_ERROR)
  })

  test('rejette toujours les IP privées', async ({ assert }) => {
    await assert.rejects(() => validateAddress('127.0.0.1'), errors.E_VALIDATION_ERROR)
    await assert.rejects(() => validateAddress(' 10.0.0.1 '), errors.E_VALIDATION_ERROR)
  })
})
