import { createHmac } from 'node:crypto'

const EXPEDITION_KEY = 'angra-paraty'
const EXISTING_REGISTRATIONS = 0
const RESERVATION_TTL_SECONDS = 30 * 24 * 60 * 60
const RATE_WINDOW_SECONDS = 60 * 60
const MAX_RESERVATIONS_PER_IP = 30

const RESERVE_SCRIPT = `
local existing = redis.call('GET', KEYS[2])
if existing then return tonumber(existing) end
local attempts = redis.call('INCR', KEYS[3])
if attempts == 1 then redis.call('EXPIRE', KEYS[3], tonumber(ARGV[2])) end
if attempts > tonumber(ARGV[3]) then return -1 end
redis.call('SETNX', KEYS[1], tonumber(ARGV[1]))
local number = redis.call('INCR', KEYS[1])
redis.call('SET', KEYS[2], number, 'EX', tonumber(ARGV[4]))
return number
`

const REQUEST_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function getRequestId(body) {
  try {
    const data = typeof body === 'string' ? JSON.parse(body) : body
    return data && !Array.isArray(data) && typeof data.requestId === 'string'
      ? data.requestId
      : ''
  } catch {
    return ''
  }
}

function getClientIp(headers) {
  const forwardedFor = headers['x-forwarded-for']
  const value = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor
  return typeof value === 'string' && value.trim() ? value.split(',')[0].trim() : 'unknown'
}

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store')
  response.setHeader('Content-Type', 'application/json; charset=utf-8')

  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')
    return response.status(405).json({ error: 'Método não permitido.' })
  }

  const requestId = getRequestId(request.body)
  if (!REQUEST_ID_PATTERN.test(requestId)) {
    return response.status(400).json({ error: 'Identificador da solicitação inválido.' })
  }

  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) {
    return response.status(503).json({ error: 'Contador temporariamente indisponível.' })
  }

  const ipHash = createHmac('sha256', token).update(getClientIp(request.headers)).digest('hex').slice(0, 24)
  const prefix = `usina:protocolo:${EXPEDITION_KEY}`
  const command = [
    'EVAL',
    RESERVE_SCRIPT,
    3,
    `${prefix}:sequencia`,
    `${prefix}:solicitacao:${requestId}`,
    `${prefix}:limite:${ipHash}`,
    EXISTING_REGISTRATIONS,
    RATE_WINDOW_SECONDS,
    MAX_RESERVATIONS_PER_IP,
    RESERVATION_TTL_SECONDS,
  ]

  try {
    const upstream = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(command),
      signal: AbortSignal.timeout(8000),
    })

    if (!upstream.ok) throw new Error('Falha no serviço de contagem')
    const data = await upstream.json()
    if (data.error) throw new Error('Comando de contagem rejeitado')

    const number = Number(data.result)
    if (number === -1) {
      return response.status(429).json({ error: 'Muitas tentativas. Aguarde antes de tentar novamente.' })
    }
    if (!Number.isSafeInteger(number) || number < 1) throw new Error('Número de protocolo inválido')

    return response.status(200).json({ protocol: String(number).padStart(3, '0') })
  } catch {
    return response.status(503).json({ error: 'Não foi possível gerar o protocolo agora. Tente novamente.' })
  }
}
