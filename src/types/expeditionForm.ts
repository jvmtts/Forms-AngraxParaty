export type Step = 0 | 1 | 2
export interface Companion {
  id: string
  nome: string
  rg: string
  dataNascimento: string
  tamanhoCamiseta: string
}
export type Ownership = '' | 'participante' | 'terceiro'
export type OwnerType = '' | 'pf' | 'pj'

export interface FormValues {
  acompanhantes: Companion[]
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
  tipoProprietario: OwnerType
  nomeProprietario: string
  cpfProprietario: string
  razaoSocialProprietario: string
  cnpjProprietario: string
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

export type FormErrors = Record<string, string | undefined>

export const initialValues: FormValues = {
  acompanhantes: [],
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
  tipoProprietario: '',
  nomeProprietario: '',
  cpfProprietario: '',
  razaoSocialProprietario: '',
  cnpjProprietario: '',
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
