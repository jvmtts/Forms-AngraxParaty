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

## Integração com o Basin

O formulário já está preparado para enviar os dados e os documentos diretamente ao Basin. A geração do contrato não faz parte desta etapa.

Para testar localmente, copie `.env.example` para `.env` e substitua o valor pelo endpoint criado no painel do Basin:

```env
VITE_BASIN_ENDPOINT=https://usebasin.com/f/SEU_FORM_ID
```

Na hospedagem, cadastre a mesma variável de ambiente e publique novamente o projeto. Como as variáveis do Vite são aplicadas durante a compilação, uma nova publicação é necessária sempre que o endpoint for alterado.

O envio usa `multipart/form-data`, mantém os documentos em seus formatos originais e apresenta os campos no painel do Basin com nomes legíveis. Sem um endpoint válido configurado, nenhum dado é enviado.
