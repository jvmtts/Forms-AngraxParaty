export type Step = 0 | 1 | 2
export type Ownership = '' | 'participante' | 'terceiro'

export interface FormValues {
  nomeCompleto: string
  cpf: string
  rg: string
  dataNascimento: string
  email: string
  whatsapp: string
  cep: string
  endereco: string
  numero: string
  complemento: string
  cidade: string
  estado: string
  proprietarioJet: Ownership
  nomeProprietario: string
  cpfProprietario: string
  marcaJet: string
  modeloJet: string
  anoJet: string
  inscricaoJet: string
  docJet: File | null
  numeroArrais: string
  validadeArrais: string
  docArrais: File | null
  confirmacao: boolean
}

export type FormErrors = Partial<Record<keyof FormValues, string>>

export const initialValues: FormValues = {
  nomeCompleto: '',
  cpf: '',
  rg: '',
  dataNascimento: '',
  email: '',
  whatsapp: '',
  cep: '',
  endereco: '',
  numero: '',
  complemento: '',
  cidade: '',
  estado: '',
  proprietarioJet: '',
  nomeProprietario: '',
  cpfProprietario: '',
  marcaJet: '',
  modeloJet: '',
  anoJet: '',
  inscricaoJet: '',
  docJet: null,
  numeroArrais: '',
  validadeArrais: '',
  docArrais: null,
  confirmacao: false,
}
