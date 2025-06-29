# Woolball Monitor CLI

Uma interface de linha de comando (CLI) para monitorar o servidor Woolball em tempo real.

## Funcionalidades

- Conexão em tempo real com o servidor Woolball
- Monitoramento de tarefas (iniciadas, concluídas, com erro)
- Contagem de nós conectados
- Interface interativa com comandos úteis
- Visualização de estatísticas em tempo real

## Requisitos

- Node.js 16 ou superior
- Servidor Woolball em execução

## Instalação

```bash
# Instalar dependências
npm install
```

## Uso

```bash
# Iniciar o monitor
npm start
```

## Comandos disponíveis

Dentro da interface CLI, você pode usar os seguintes comandos:

- `h` ou `help` - Mostra a ajuda com todos os comandos disponíveis
- `c` ou `clear` - Limpa a tela
- `s` ou `stats` - Mostra estatísticas atuais
- `q` ou `quit` - Sai do monitor

## Configuração

Por padrão, o monitor se conecta a `ws://localhost:9003`. Para alterar a URL do servidor Woolball, edite a constante `WEBSOCKET_URL` no arquivo `index.js`.

## Exemplo de saída

```
============================================================
                    WOOLBALL MONITOR CLI                    
============================================================
Conectado a: ws://localhost:9003
ID do Cliente: node-monitor-7f3a9b1c2d
------------------------------------------------------------
Comandos disponíveis:
  h, help    - Mostra esta ajuda
  c, clear   - Limpa a tela
  s, stats   - Mostra estatísticas atuais
  q, quit    - Sai do monitor
------------------------------------------------------------
Estatísticas:
  Nós conectados:     2
  Total de tarefas:   5
  Tarefas ativas:     1
  Tarefas concluídas: 3
  Tarefas com erro:   1
------------------------------------------------------------
woolball> 
```