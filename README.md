# Forms Angra × Paraty

Base React, TypeScript, Vite e Tailwind CSS para a página de pré-inscrição da Expedição Angra × Paraty da Usina do Jet.

## Desenvolvimento

```bash
npm install
npm run dev
```

## Validação

```bash
npm run lint
npm run build
```

O envio do formulário, o armazenamento dos documentos e a geração do contrato serão conectados depois da definição final dos campos e do fluxo operacional.

Para ativar o envio, copie `.env.example` para `.env` e informe o endpoint aprovado:

```env
VITE_FORM_ENDPOINT=https://seu-endpoint-seguro.example
```
