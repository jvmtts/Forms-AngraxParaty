import type { FormErrors, FormValues } from '../types/expeditionForm'

export const FIELD_LIMITS = {
  nome: 120,
  cpf: 14,
  rg: 14,
  data: 10,
  email: 254,
  whatsapp: 15,
  cep: 9,
  endereco: 150,
  numero: 12,
  complemento: 80,
  cidade: 80,
  marcaJet: 40,
  modeloJet: 60,
  anoJet: 4,
  inscricaoJet: 30,
  numeroArrais: 30,
} as const

const MAX_FILE_SIZE = 10 * 1024 * 1024
const ALLOWED_FILE_TYPES = new Set(['application/pdf', 'image/jpeg', 'image/png'])
const ALLOWED_FILE_EXTENSION = /\.(pdf|jpe?g|png)$/i
const PERSON_NAME = /^[\p{L}'’-]+(?:\s+[\p{L}'’-]+)+$/u

export function onlyDigits(value: string) {
  return value.replace(/\D/g, '')
}

export function limitText(value: string, maxLength: number) {
  return value.slice(0, maxLength)
}

export function sanitizeRg(value: string) {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9.-]/g, '')
    .slice(0, FIELD_LIMITS.rg)
}

export function sanitizeIdentifier(value: string, maxLength: number) {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9./-]/g, '')
    .slice(0, maxLength)
}

export function sanitizeHouseNumber(value: string) {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9/-]/g, '')
    .slice(0, FIELD_LIMITS.numero)
}

export function maskCpf(value: string) {
  const digits = onlyDigits(value).slice(0, 11)
  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

export function maskPhone(value: string) {
  const digits = onlyDigits(value).slice(0, 11)
  if (digits.length <= 2) return digits
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

export function maskCep(value: string) {
  const digits = onlyDigits(value).slice(0, 8)
  return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits
}

export function maskDate(value: string) {
  const digits = onlyDigits(value).slice(0, 8)
  if (digits.length <= 2) return digits
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
}

export function parseDate(value: string) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value)
  if (!match) return null
  const day = Number(match[1])
  const month = Number(match[2])
  const year = Number(match[3])
  const date = new Date(year, month - 1, day)
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null
  return date
}

export function isValidCpf(value: string) {
  const cpf = onlyDigits(value)
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false

  const calculateDigit = (length: number) => {
    let sum = 0
    for (let index = 0; index < length; index += 1) {
      sum += Number(cpf[index]) * (length + 1 - index)
    }
    const remainder = (sum * 10) % 11
    return remainder === 10 ? 0 : remainder
  }

  return calculateDigit(9) === Number(cpf[9]) && calculateDigit(10) === Number(cpf[10])
}

export function validateFile(file: File | null) {
  if (!file) return 'Envie este documento.'
  const hasAllowedType = ALLOWED_FILE_TYPES.has(file.type)
  const hasAllowedExtension = ALLOWED_FILE_EXTENSION.test(file.name)
  if (!hasAllowedType || !hasAllowedExtension) return 'Use um arquivo PDF, JPG ou PNG.'
  if (file.size === 0) return 'O arquivo selecionado está vazio.'
  if (file.size > MAX_FILE_SIZE) return 'O arquivo deve ter no máximo 10 MB.'
  return ''
}

function isValidPersonName(value: string) {
  const normalized = value.trim().replace(/\s+/g, ' ')
  return normalized.length >= 5 && normalized.length <= FIELD_LIMITS.nome && PERSON_NAME.test(normalized)
}

function isValidBirthDate(value: string) {
  const birthDate = parseDate(value)
  if (!birthDate) return false
  const today = new Date()
  const oldestAccepted = new Date(today.getFullYear() - 120, today.getMonth(), today.getDate())
  return birthDate < today && birthDate >= oldestAccepted
}

function isValidEmail(value: string) {
  const email = value.trim()
  return email.length <= FIELD_LIMITS.email && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)
}

export function validatePersonal(values: FormValues) {
  const errors: FormErrors = {}

  if (!isValidPersonName(values.nomeCompleto)) {
    errors.nomeCompleto = 'Informe nome e sobrenome, sem números ou símbolos indevidos.'
  }
  if (!isValidCpf(values.cpf)) errors.cpf = 'Informe um CPF válido com 11 dígitos.'

  const rgLength = values.rg.replace(/[^A-Z0-9]/g, '').length
  if (rgLength < 5 || rgLength > FIELD_LIMITS.rg) {
    errors.rg = 'Informe um RG com 5 a 14 letras ou números.'
  }

  if (!isValidBirthDate(values.dataNascimento)) {
    errors.dataNascimento = 'Informe uma data válida entre hoje e 120 anos atrás.'
  }
  if (!isValidEmail(values.email)) errors.email = 'Informe um e-mail válido.'

  const phoneLength = onlyDigits(values.whatsapp).length
  if (phoneLength !== 10 && phoneLength !== 11) {
    errors.whatsapp = 'Informe DDD e telefone com 10 ou 11 dígitos.'
  }

  if (onlyDigits(values.cep).length !== 8) errors.cep = 'Informe um CEP com 8 dígitos.'
  if (values.endereco.trim().length < 3) errors.endereco = 'Informe um endereço válido.'
  if (!values.numero.trim()) errors.numero = 'Informe o número ou use S/N.'
  if (values.cidade.trim().length < 2) errors.cidade = 'Informe uma cidade válida.'
  if (!values.estado) errors.estado = 'Selecione o estado.'

  return errors
}

export function validateJet(values: FormValues) {
  const errors: FormErrors = {}

  if (!values.proprietarioJet) errors.proprietarioJet = 'Informe quem é o proprietário.'
  if (values.proprietarioJet === 'terceiro') {
    if (!isValidPersonName(values.nomeProprietario)) {
      errors.nomeProprietario = 'Informe nome e sobrenome do proprietário.'
    }
    if (!isValidCpf(values.cpfProprietario)) {
      errors.cpfProprietario = 'Informe um CPF válido com 11 dígitos.'
    }
  }

  if (values.marcaJet.trim().length < 2) errors.marcaJet = 'Informe a marca do jet.'
  if (values.modeloJet.trim().length < 2) errors.modeloJet = 'Informe o modelo do jet.'

  const year = Number(values.anoJet)
  if (!/^\d{4}$/.test(values.anoJet) || year < 1980 || year > new Date().getFullYear() + 1) {
    errors.anoJet = 'Informe um ano válido com 4 dígitos.'
  }

  const registrationLength = values.inscricaoJet.replace(/[^A-Z0-9]/g, '').length
  if (registrationLength < 4) errors.inscricaoJet = 'Informe o número completo de inscrição do jet.'

  const jetFileError = validateFile(values.docJet)
  if (jetFileError) errors.docJet = jetFileError

  const arraisLength = values.numeroArrais.replace(/[^A-Z0-9]/g, '').length
  if (arraisLength < 5) errors.numeroArrais = 'Informe o número completo da habilitação.'

  const expirationDate = parseDate(values.validadeArrais)
  if (!expirationDate) {
    errors.validadeArrais = 'Informe uma data válida no formato DD/MM/AAAA.'
  } else {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (expirationDate < today) errors.validadeArrais = 'A habilitação informada está vencida.'
  }

  const arraisFileError = validateFile(values.docArrais)
  if (arraisFileError) errors.docArrais = arraisFileError
  if (!values.confirmacao) errors.confirmacao = 'Confirme a veracidade dos dados.'

  return errors
}
