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

O endpoint desta expedição já está configurado no código. A variável abaixo é opcional e permite substituí-lo sem alterar o código:

```env
VITE_BASIN_ENDPOINT=https://usebasin.com/f/2566ad740c53
```

Na hospedagem, não é necessário cadastrar a variável de ambiente para usar o endpoint acima. Caso você a defina, publique novamente o projeto após alterá-la, pois o Vite aplica essas variáveis durante a compilação.

O envio usa `multipart/form-data`, mantém os documentos em seus formatos originais e apresenta os campos no painel do Basin com nomes legíveis. Um endpoint inválido impede o envio.
