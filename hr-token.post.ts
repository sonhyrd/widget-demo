import { createHash } from 'node:crypto'
import jwt from 'jsonwebtoken'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { userId, email, firstName, lastName } = body

  if (!userId || !email) {
    throw createError({
      statusCode: 400,
      message: 'userId and email are required',
    })
  }

  const now = Math.floor(Date.now() / 1000)
  const jti = createHash('sha256')
    .update(`${userId}-${now}-${Math.random()}`)
    .digest('hex')

  const expiresIn = 60 * 60 * 24 * 30 * 2 // 2 months

  const claims = {
    iss: 'https://app.paulsjob.ai',
    aud: 'paul-job',
    sub: userId,
    email,
    firstName,
    lastName,
    exp: now + expiresIn,
    iat: now,
    nbf: now,
    jti,
  }

  const privateKeyRaw = `-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEAxHyRfQMNrcD6VXblrLpR1e5UnQ52G2G3ZxdzTiDP/T5p+7vf
v12S6iBkPeQ8NMfTHmSbH+dB05jn/sWC6xknpv75aH8f/HVdxb9TT376WTv7Q4jH
eeeULYxYcvvwkVaenh5p4U9jXux1FzBqcL1J+wX08UnD9pdbW88jtEGNR3eIdAgf
wCy+hRvyYtyMEtYlflqKzSlkWNjxDetnV/VDs6gEVavwi+J9TfkglgnSzlmEiXrH
XTwiC2NAb6TxOkvn5gobXELirSm8pOLXgkB5Y6exII/wQW2K9acqFufNFV3TE6RJ
mJDOyeFRRqOeDbIp2HDMjFuMm/eHvaO5bT0tlwIDAQABAoIBAGz3TFQQ8nAO2oW1
F3BwL9w9fS1QjM1opqaEicylQ9OE3o/dxBtDkKtI5W6xeXYn73wmfST3QjlPzjEr
ZgxteeER/E0oWxvOFwAIt/IZUEtWiWUNoNqJRFLyR0cVU3e2mubDpSJvvYMyDUmb
7xuwzitpRUrfBs9lZyQGPx3DUM91kNehe939fHGSkrRiSkZZSf6MJjxSGp9Nihg5
yo5ydMrrmzDIw9lX8wmq6MWUHJKFpCPD4It4HyO/HHNX2Z/OvOss2r1jjhvA+qqO
ZAcFsRXE+pbGNB1nsRRQHqgE50PvVLtgieMumi5UEjnQppmt14mm/2tz77OXLjVE
hyPj4PECgYEA1I5BmaWtGgtqwWGj0dFWi2fTAXW7utN1jv//k6OE4mEoJXzIjs5p
LYqDauKQgjahPIzfHa+ZwnDTr0Ss29Ce271VLVpaYbtPjVPcDbA9QofvC5XjZe93
FrboIj1q8hmjRnwoFHkUl0VXyNHKhdulNcgGkK+3F1T/VOLmNerRj98CgYEA7KWD
q1/9BdFQheFtQRDoW+3moHLDITegKNc+EdeF6vdA9pamgadqKkXoZ6IgVPK8YgnH
jKKQZqJbN7Jb9la7r6CyPVoc/we8dTTb1RK5Y7OiuXLcaqBuDRkzzpAae3rrAvYv
QuGRhW9Dhc8QPji9KW4ZJ4J9HlPC9RmXn43duUkCgYEAhcrVeAVVJGOzWu4+079V
HoLHys90z3BzOwPgt+nhpy1Iu/ADvgAnLEdX2VurYotIiniRqHnz6vRiCpzLwcFb
fS18BAQvh/0DYg47IVKh/NLboQtEC9HjwCR5kbPfMWz53VAhWmGsmFtJmlqThBZx
s5yopUI1mTYjUidQiPe52TkCgYAgv0K6O107Kdz3udsxjtJorkIk39yqwxTRsf9v
3qA0hKSjuvMtq+ogEW54sNHCj5iMBIhtqK1M1pjC21aofxYX1qfzn321uO9WVMs6
8A1hg6E4AnIH+01fWKZ3pi9T+Q1+amzd13MYwO3aHW5E/fsHOaoXcpI32SV4X2NA
/BO7qQKBgQCnk6JgN/0peoI3z/FSxrsql/xa/hKtsqOUhALpcZfe4LBME8+jbxKT
6qaeq069AaU0O2yxE5+18QW/TfwV7C00EihrjlZtVUPf0+4CpgxEN4cl2pIwpdV9
YNGNRchNQEQXvWG2OKHjmsebeSE7UsP9QUbiGlRO0+sKYUoidnQjkw==
-----END RSA PRIVATE KEY-----`

  const runtimeConfig = useRuntimeConfig()

  // Get private key from runtime config
  // const privateKeyRaw = runtimeConfig.ssoPrivateKey

  if (!privateKeyRaw) {
    throw createError({
      statusCode: 500,
      message: 'SSO private key is not configured',
    })
  }

  // JWT signing options
  const signOptions: jwt.SignOptions = {
    algorithm: 'RS256',
    // keyid: runtimeConfig.ssoKeyId,
    keyid: '20250610-86d0',
  }

  let token
  try {
    // Create JWT using jsonwebtoken library
    token = jwt.sign(claims, privateKeyRaw, signOptions)
  }
  catch (error) {
    throw createError({
      statusCode: 500,
      message: error instanceof Error ? error.message : 'Failed to sign JWT token',
    })
  }

  return {
    token,
    expiresIn,
  }
})
