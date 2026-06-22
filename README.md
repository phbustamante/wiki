# Automação de Comandos — Equipamentos JIMI

Plataforma web para montar comandos de configuração por **seleção visual** — o
usuário toca nas opções e o comando final é gerado em tempo real, pronto para
copiar. Nenhum comando é fixo no código: tudo vem de um JSON (e, na fase 2, de
uma API REST).

## Tecnologias

- **React 18 + TypeScript** (Vite)
- **Tailwind CSS** — design clean estilo Apple, modo claro/escuro, responsivo
- **Zustand** (com persistência em `localStorage`) — tema, histórico e favoritos
- **Lucide React** — ícones

## Rodar

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + build de produção em dist/
```

## Funcionalidades

| Recurso | Onde |
| --- | --- |
| Lista de equipamentos em cards + busca | [HomePage](src/pages/HomePage.tsx) |
| Página por equipamento + busca de comandos | [EquipmentPage](src/pages/EquipmentPage.tsx) |
| Montagem do comando em tempo real | [lib/comando.ts](src/lib/comando.ts), [CommandBuilder](src/components/CommandBuilder.tsx) |
| Botão "Copiar comando" | [CommandResult](src/components/CommandResult.tsx) |
| Histórico recente + Favoritos | [HistoryFavorites](src/components/HistoryFavorites.tsx), [store](src/store/useStore.ts) |
| Modo claro/escuro/sistema | [ThemeToggle](src/components/ThemeToggle.tsx) |

## Onde colocar os comandos

Todo o conteúdo vive em **[src/data/equipamentos.json](src/data/equipamentos.json)**.
Basta adicionar/editar equipamentos seguindo o formato abaixo — a interface se
monta sozinha.

```jsonc
{
  "equipamentos": [
    {
      "id": "jc181",                    // slug usado na URL (/equipamento/jc181)
      "equipamento": "JC181",           // nome exibido
      "descricao": "Texto opcional",    // opcional
      "categoria": "Dashcam",           // opcional (vira badge)
      "comandos": [
        {
          "nome": "ACC",                // primeiro token do comando
          "descricao": "Controle de acesso", // opcional
          "separador": ",",             // opcional (padrão ",")
          "prefixo": "",                // opcional (ex.: "#")
          "sufixo": "",                 // opcional (ex.: "*")
          "parametros": [
            {
              "nome": "Status",
              "descricao": "opcional",
              "padrao": "ON",           // opcional: pré-seleção
              "obrigatorio": true,      // opcional (padrão true)
              "opcoes": ["ON", "OFF"]   // string simples...
            },
            {
              "nome": "Canal",
              "opcoes": [               // ...ou objeto { label, valor }
                { "label": "Canal 1", "valor": "1" },
                { "label": "Canal 2", "valor": "2" }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

**Como o comando é montado:** `nome` + valores selecionados, unidos pelo
`separador`. Parâmetros opcionais não selecionados são omitidos.

```
ACC + { Status: "ON", Canal: "1" }  →  ACC,ON,1
```

> Pode me mandar os comandos e parâmetros de cada equipamento em texto que eu
> converto para este JSON.

## Fase 2 — Backend (preparado)

A UI consome os dados apenas por [src/lib/dataSource.ts](src/lib/dataSource.ts).
Para plugar a API REST (Node + Express + PostgreSQL) e o dashboard
administrativo, basta trocar o corpo de `listarEquipamentos()` /
`obterEquipamento()` por chamadas `fetch(...)` — **nenhuma tela muda**.
