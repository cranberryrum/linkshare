const CODE_LENGTH = 4

export const generateCode = (): string => {
  let code = ''
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += Math.floor(Math.random() * 10).toString()
  }
  return code
}

export const generateExpirationTime = (): number => {
  return Date.now() + (10 * 60 * 1000) // 10 minutes from now
}