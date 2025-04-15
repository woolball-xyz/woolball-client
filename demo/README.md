# Aplicação de Demonstração para browser-node

Esta aplicação serve como um cliente de teste para validar as funcionalidades do pacote `browser-node`, especificamente o recurso de conversão de fala para texto (speech-to-text) usando o worker implementado.

## Como usar

### Pré-requisitos

Antes de executar a aplicação de demonstração, você precisa construir o pacote `browser-node` e o worker de speech-to-text:

```bash
npm run build:all
```

Este comando irá:
1. Compilar o código TypeScript
2. Criar o bundle do browser-node
3. Criar o bundle do worker de speech-to-text

### Executando a aplicação

Para iniciar o servidor de demonstração:

```bash
npm run serve:demo
```

Isso iniciará um servidor HTTP na porta 3000. Acesse a aplicação em seu navegador:

```
http://localhost:3000/
```

## Funcionalidades

A aplicação de demonstração permite:

1. Carregar um arquivo de áudio
2. Converter o áudio em texto usando o worker de speech-to-text
3. Visualizar o resultado da conversão

## Estrutura

- `index.html`: Interface da aplicação
- `app.js`: Lógica da aplicação que utiliza o pacote browser-node

## Como funciona

A aplicação carrega o worker de speech-to-text como um Web Worker separado, permitindo que o processamento pesado de conversão de áudio para texto seja executado em uma thread separada, sem bloquear a interface do usuário.

O fluxo de funcionamento é:

1. O usuário seleciona um arquivo de áudio
2. O arquivo é convertido para base64
3. Os dados são enviados para o worker
4. O worker processa o áudio e retorna o texto
5. O resultado é exibido na interface

Esta aplicação serve como um exemplo prático de como integrar o pacote `browser-node` em projetos reais.