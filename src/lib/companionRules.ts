import type { Companion } from '../types/expeditionForm'

const validName = /^[\p{L}'’-]+(?:\s+[\p{L}'’-]+)+$/u

function parseBirthDate(value: string) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value)
  if (!match) return null
  const day = Number(match[1])
  const month = Number(match[2])
  const year = Number(match[3])
  const date = new Date(year, month - 1, day)
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : null
}

export function validateCompanions(companions: Companion[]) {
  const errors: Record<string, string> = {}
  if (companions.length > 3) errors.acompanhantes = 'É permitido cadastrar até três acompanhantes.'

  companions.forEach((companion, index) => {
    const prefix = `acompanhante-${index}`
    const name = companion.nome.trim().replace(/\s+/g, ' ')
    if (name.length < 5 || name.length > 120 || !validName.test(name)) errors[`${prefix}-nome`] = 'Informe nome e sobrenome.'
    if (companion.rg && !/^\d{5,14}$/.test(companion.rg)) errors[`${prefix}-rg`] = 'Use de 5 a 14 números ou deixe vazio.'

    const birth = parseBirthDate(companion.dataNascimento)
    const today = new Date()
    const oldest = new Date(today.getFullYear() - 120, today.getMonth(), today.getDate())
    if (!birth || birth >= today || birth < oldest) errors[`${prefix}-dataNascimento`] = 'Informe uma data de nascimento válida.'
    if (!['PP', 'P', 'M', 'G', 'GG', 'XGG'].includes(companion.tamanhoCamiseta)) errors[`${prefix}-tamanhoCamiseta`] = 'Selecione o tamanho da camiseta.'
  })

  return errors
}

export function appendCompanions(payload: FormData, companions: Companion[]) {
  payload.append('Quantidade de acompanhantes', String(companions.length))
  companions.forEach((companion, index) => {
    const prefix = `Acompanhante ${index + 1}`
    payload.append(`${prefix} - Nome`, companion.nome.trim())
    if (companion.rg.trim()) payload.append(`${prefix} - RG`, companion.rg.trim())
    payload.append(`${prefix} - Data de nascimento`, companion.dataNascimento)
    payload.append(`${prefix} - Tamanho da camiseta`, companion.tamanhoCamiseta)
  })
}
