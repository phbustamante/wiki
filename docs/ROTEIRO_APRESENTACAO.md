# Roteiro de Apresentação — Central de Automação JIMI

> Duração sugerida: **10 a 15 minutos** (8–10 slides + demonstração ao vivo).
> Use os blocos **🎤 Fala** como texto-base e os **🖥️ Mostre** como guia da tela.

---

## Slide 1 — Abertura

**Título:** Central de Automação JIMI
**Subtítulo:** Gerencie comandos, atualizações e processos operacionais dos equipamentos JIMI com mais rapidez e controle.

🎤 **Fala:**
"Bom dia/boa tarde. Vou apresentar a Central de Automação JIMI, uma plataforma web que criei para padronizar e acelerar a configuração e a atualização dos nossos equipamentos — JC181, JC450 e JC400AD. A ideia central é simples: o usuário **seleciona opções na tela** e o sistema **monta o comando pronto**, sem precisar decorar sintaxe nem digitar nada."

---

## Slide 2 — O problema

- Comandos dos equipamentos têm **sintaxe complexa e posicional** (ex.: `APN,NOME,APN,,,,,,LOGIN,,SENHA,,,,,IP,IP,`).
- Cada modelo tem **dezenas de comandos** com regras diferentes.
- Erro de digitação = configuração errada = retrabalho e chamado de suporte.
- O processo de **atualização de firmware** estava espalhado em vários documentos e links.

🎤 **Fala:**
"Hoje configurar um equipamento exige consultar manual, copiar formato, contar vírgulas. Um caractere errado quebra o comando. E a parte de atualização — drivers, ferramentas, firmware — ficava espalhada. Eu quis centralizar tudo isso num lugar só, à prova de erro."

---

## Slide 3 — A solução

Duas grandes áreas numa única plataforma:

1. **Automação de Comandos** — monta o comando por seleção visual, em tempo real.
2. **Atualização de Equipamentos** — passo a passo, arquivos para download, imagens e vídeo do processo.

Mais: **histórico**, **favoritos**, **busca**, **tema claro/escuro** e **100% responsivo**.

🎤 **Fala:**
"A plataforma tem duas frentes. A primeira gera comandos por toque. A segunda concentra todo o procedimento de atualização. E recursos de produtividade: histórico do que foi gerado, favoritos para os comandos do dia a dia, e busca rápida."

---

## Slide 4 — Como funciona (o coração do produto)

Fluxo: **Escolher equipamento → escolher comando → selecionar parâmetros → copiar.**

Exemplo:
`ACC` + Status `ON` + Canal `1` → **`ACC,ON,1`** (montado em tempo real).

🖥️ **Mostre (demo ao vivo):**
1. Abra a JC181, clique no comando **ACC**.
2. Toque em **ON** e **Canal 1** → mostre o resultado mudando na hora.
3. Clique em **Copiar comando**.
4. Mostre que ele apareceu no **Histórico** e marque como **Favorito** (estrela).

🎤 **Fala:**
"Repare que eu não digitei nada. Cada opção é um botão, e o comando vai se montando em tempo real, em destaque. Um clique copia. Quem usa não precisa saber a sintaxe."

---

## Slide 5 — Tipos de campo inteligentes

A interface se adapta ao tipo de cada parâmetro:

- **Seleção (pills)** com rótulos amigáveis — ex.: `101 — Sleep (plataforma + vibração)`.
- **Faixa numérica** com slider — ex.: velocidade de `10 a 120 km/h`.
- **Texto livre** — ex.: APN, URLs, senhas.
- **Constantes posicionais ocultas** — reproduzem formatos exatos (o `NA,NA,NA,NA` do SERVER, o `IP,IP` do APN) sem o usuário ver complexidade.

🎤 **Fala:**
"Nem todo parâmetro é um botão. Quando é uma faixa, viro um slider. Quando é texto, viro um campo. E os formatos mais traiçoeiros, com campos fixos e vírgulas vazias, eu reproduzo exatamente, mas escondo do usuário. Ele só vê o que importa."

---

## Slide 6 — Escala e arquitetura

- **Tudo vem de arquivos de dados (JSON)** — nenhum comando fica fixo no código.
- Hoje a plataforma já tem **153 comandos** cadastrados:
  - JC181 → 34 comandos
  - JC450 → 53 comandos
  - JC400AD (JC261) → 66 comandos
- Adicionar equipamento/comando = editar dados, a interface se monta sozinha.
- A camada de dados é **isolada**: trocar o JSON por uma **API REST** no futuro não muda nenhuma tela.

🎤 **Fala:**
"A decisão de arquitetura mais importante: o conteúdo é dirigido por dados. Os comandos vivem em JSON, não no código. Isso significa que dá pra crescer para centenas de equipamentos sem reprogramar a tela — e que, quando ligarmos um backend, a interface continua igual."

---

## Slide 7 — Módulo de Atualização

Cada equipamento tem uma página de atualização com 4 seções:

1. **Passo a passo** — com seletor de método (ex.: JC450 tem cartão SD, Android local e PhoenixSuit).
2. **Arquivos para download** — firmware, drivers e ferramentas, com a versão.
3. **Imagens** do processo.
4. **Upload do vídeo** do processo (arraste e solte).

🖥️ **Mostre:**
- Abra a atualização da **JC450**, alterne entre os **métodos** (pills) e mostre os passos numerados.
- Mostre os **downloads** reais (firmware 2.2.1.5, software).
- Mostre o campo de **upload de vídeo**.

🎤 **Fala:**
"Aqui está toda a jornada de atualização. Um mesmo equipamento pode ter vários métodos — eu deixo o técnico escolher e mostro o passo a passo certo. Os arquivos oficiais, com a versão, ficam a um clique. E há espaço para registrar em vídeo como o processo foi feito."

---

## Slide 8 — Tecnologias

| Camada | Tecnologia |
| --- | --- |
| Interface | **React 18 + TypeScript** (build com Vite) |
| Estilo | **Tailwind CSS** — design clean, tema claro/escuro, responsivo |
| Estado | **Zustand** (com persistência local: tema, histórico, favoritos) |
| Ícones | **Lucide React** |
| Navegação | **React Router** |
| Dados | **JSON** (preparado para virar **API REST + PostgreSQL**) |

🎤 **Fala:**
"Stack moderna e enxuta. React com TypeScript para segurança de tipos, Tailwind para um visual limpo no estilo de apps premium, e Zustand guardando histórico e favoritos no próprio navegador. Tudo pronto para escalar."

---

## Slide 9 — Resultados e próximos passos

**Entregue:**
- Plataforma funcional, responsiva, com 153 comandos e 3 fluxos de atualização.
- Geração de comando sem erro, com copiar/histórico/favoritos.
- Identidade visual JIMI (logo + cores da marca).

**Próximos passos:**
- **Dashboard administrativo** para cadastrar equipamentos/comandos sem mexer no código.
- **Backend (API + banco)** com upload real de vídeos e importação/exportação JSON.
- Comando **OTA (`UPDATE`)** integrado à automação.

🎤 **Fala:**
"O que está pronto já resolve o dia a dia. Os próximos passos são um painel administrativo para a equipe cadastrar sozinha e um backend para guardar vídeos e centralizar os dados. A base já foi feita pensando nisso."

---

## Slide 10 — Encerramento

🎤 **Fala:**
"Resumindo: tiramos a complexidade da mão do usuário. Ele seleciona, o sistema monta. Padronizamos comandos e atualizações num só lugar, com a cara da JIMI. Obrigado — posso mostrar qualquer parte ao vivo."

---

## Apêndice — Roteiro da demonstração ao vivo (3–4 min)

1. **Home** — mostre o título, a busca e os cards das duas seções.
2. **Busca** — digite "JC450" e mostre o filtro.
3. **Automação** — JC450 → comando **ADAS,CALIBRATION** (mostra os sliders em mm) ou **ACC** (rápido). Copie.
4. **Histórico/Favoritos** — mostre o comando salvo; favorite um.
5. **Tema** — alterne claro/escuro no canto superior direito.
6. **Atualização** — JC450 → alterne métodos, mostre downloads e o upload de vídeo.
7. **Responsivo** (opcional) — diminua a janela e mostre adaptando ao celular.

## Apêndice — Perguntas prováveis e respostas

- **"Como adiciono um novo equipamento?"** Hoje, editando um arquivo de dados (JSON); em breve, pelo painel administrativo.
- **"Os comandos são confiáveis?"** Sim — os formatos posicionais (APN, SERVER) são reproduzidos exatamente como na documentação oficial.
- **"Funciona no celular?"** Sim, é totalmente responsivo (desktop, tablet e celular).
- **"O vídeo de atualização fica salvo?"** Na versão atual é pré-visualização local; o armazenamento definitivo entra com o backend.
- **"Dá pra escalar para centenas de equipamentos?"** Sim, foi essa a premissa: conteúdo dirigido por dados, interface genérica.
