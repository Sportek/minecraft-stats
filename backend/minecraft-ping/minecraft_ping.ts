import { pingJava } from '@minescope/mineping'

export const pingMinecraftJava = async (address: string, port: number = 25565) => {
  try {
    const data = await pingJava(address, { port, timeout: 5000 })
    return data
  } catch (error) {
    throw new Error(error)
  }
}

export const isPingPossible = async (address: string, port: number = 25565) => {
  try {
    const data = await pingMinecraftJava(address, port)
    return !!data
  } catch (error) {
    return false
  }
}
