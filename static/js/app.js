// ── Utilitários ───────────────────────────────────────────────────────────────

function normalize(text) {
  if (!text) return "";
  return String(text)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function tempoRelativo(ms) {
  const diff = Date.now() - ms;
  const s = Math.floor(diff / 1000);
  if (s < 45) return "agora";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} d`;
  return new Date(ms).toLocaleDateString("pt-BR");
}

// ── Lógica de montagem de comandos ────────────────────────────────────────────

function normalizarOpcoes(opcoes) {
  return (opcoes || []).map(o =>
    typeof o === "string" ? { label: o, valor: o } : o
  );
}

function tipoDe(p) {
  if (p.tipo) return p.tipo;
  return (p.opcoes && p.opcoes.length > 0) ? "select" : "texto";
}

function isObrigatorio(p) {
  return p.obrigatorio !== false && tipoDe(p) !== "fixo";
}

function parametrosVisiveis(comando) {
  return comando.parametros.filter(p => tipoDe(p) !== "fixo");
}

function selecaoInicial(comando) {
  const sel = {};
  for (const p of comando.parametros) {
    if (p.tipo !== "fixo" && p.padrao !== undefined) {
      sel[p.nome] = p.padrao;
    }
  }
  return sel;
}

function montarComando(comando, selecao) {
  const sep = comando.separador ?? ",";
  const tokens = [];
  const faltando = [];

  for (const p of comando.parametros) {
    if (tipoDe(p) === "fixo") { tokens.push(p.valor ?? ""); continue; }
    const valor = selecao[p.nome];
    if (valor !== undefined && valor !== "") {
      tokens.push(valor);
    } else {
      if (isObrigatorio(p)) faltando.push(p.nome);
      tokens.push("");
    }
  }

  if (!comando.manterVazios) {
    while (tokens.length && tokens[tokens.length - 1] === "") tokens.pop();
  }

  const corpo = [comando.nome, ...tokens].join(sep);
  const texto = `${comando.prefixo ?? ""}${corpo}${comando.sufixo ?? ""}`;
  return { texto, completo: faltando.length === 0, faltando };
}

function montarTemplate(comandos, valores) {
  const linhas = [];
  let completo = true;
  const faltando = [];

  for (const comando of comandos) {
    const selecao = {};

    for (const parametro of comando.parametros) {
      if (parametro.tipo === "fixo") continue;
      const chave = `${comando.nome}.${parametro.nome}`;
      selecao[parametro.nome] = valores[chave];
    }

    const resultado = montarComando(comando, selecao);
    linhas.push(resultado.texto);

    if (!resultado.completo) {
      completo = false;
      faltando.push(...resultado.faltando);
    }
  }

  return { preview: linhas.join("\n"), completo, faltando };
}

// ── Store persistente (localStorage) ─────────────────────────────────────────

const STORE_KEY = "aceq-store";
const HISTORICO_MAX = 30;

function loadStore() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { theme: "system", historico: [], favoritos: [] };
}

function saveStore(s) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify({
      theme: s.theme,
      historico: s.historico,
      favoritos: s.favoritos,
    }));
  } catch {}
}

// ── Alpine.js store global ────────────────────────────────────────────────────

document.addEventListener("alpine:init", () => {
  const saved = loadStore();

  Alpine.store("app", {
    theme: saved.theme ?? "system",
    historico: saved.historico ?? [],
    favoritos: saved.favoritos ?? [],
    writeconfigStatus: "",
    gruposFechados: {},

    init() {
      this._applyTheme();
      window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
        if (this.theme === "system") this._applyTheme();
      });
    },

    setTheme(t) {
      this.theme = t;
      this._applyTheme();
      saveStore(this);
    },

    _applyTheme() {
      const dark =
        this.theme === "dark" ||
        (this.theme === "system" &&
          window.matchMedia("(prefers-color-scheme: dark)").matches);
      document.documentElement.classList.toggle("dark", dark);
    },

    registrarHistorico(item) {
      const semDup = this.historico.filter(h => h.resultado !== item.resultado);
      this.historico = [{ ...item, id: uid(), criadoEm: Date.now() }, ...semDup].slice(0, HISTORICO_MAX);
      saveStore(this);
    },

    limparHistorico(linha) {
      this.historico = linha
        ? this.historico.filter(h => (h.linha || "jc") !== linha)
        : [];
      saveStore(this);
    },

    isFavorito(resultado) {
      return this.favoritos.some(f => f.resultado === resultado);
    },

    alternarFavorito(item) {
      const existente = this.favoritos.find(f => f.resultado === item.resultado);
      if (existente) {
        this.favoritos = this.favoritos.filter(f => f.id !== existente.id);
      } else {
        this.favoritos = [{ ...item, id: uid(), criadoEm: Date.now() }, ...this.favoritos];
      }
      saveStore(this);
    },

    removerFavorito(id) {
      this.favoritos = this.favoritos.filter(f => f.id !== id);
      saveStore(this);
    },

    agruparPorEquipamento(itens) {
      const grupos = [];
      const indice = {};

      for (const item of itens || []) {
        const id = item.equipamentoId || item.equipamentoNome || "sem-modelo";
        if (!indice[id]) {
          indice[id] = {
            id,
            nome: item.equipamentoNome || "Modelo nao informado",
            linha: item.linha || "jc",
            itens: [],
          };
          grupos.push(indice[id]);
        }
        indice[id].itens.push(item);
      }

      return grupos;
    },

    grupoAberto(tipo, id) {
      return !this.gruposFechados[`${tipo}:${id}`];
    },

    alternarGrupo(tipo, id) {
      const chave = `${tipo}:${id}`;
      this.gruposFechados = { ...this.gruposFechados, [chave]: !this.gruposFechados[chave] };
    },

    async exportarWriteconfig(origem, itens = null, modelo = "") {
      itens = itens || (origem === "favoritos" ? this.favoritos : this.historico);
      if (!itens.length) return;

      try {
        const response = await fetch(`/writeconfig/${origem}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ itens }),
        });
        if (!response.ok) throw new Error("Falha ao exportar");

        const blob = await response.blob();
        const disposition = response.headers.get("Content-Disposition") || "";
        const filenameMatch = disposition.match(/filename="?([^"]+)"?/i);
        const filename = filenameMatch ? filenameMatch[1] : "writeconfig.txt";
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);

        this.writeconfigStatus = modelo
          ? `Download do ${filename} iniciado para ${modelo}`
          : `Download do ${filename} iniciado`;
      } catch {
        this.writeconfigStatus = "Nao foi possivel gerar o writeconfig.txt";
      }

      setTimeout(() => { this.writeconfigStatus = ""; }, 4000);
    },

    tempoRelativo(ms) { return tempoRelativo(ms); },
  });

  Alpine.store("app").init();
});

// ── Componente: página de equipamento + construtor integrado ──────────────────

const GRUPO_CORES = {
  "Consultas":            { text: "text-sky-500",     bg: "bg-sky-500/10",     dot: "bg-sky-500" },
  "Configuração Inicial": { text: "text-amber-500",   bg: "bg-amber-500/10",   dot: "bg-amber-500" },
  "Sistema":              { text: "text-violet-500",  bg: "bg-violet-500/10",  dot: "bg-violet-500" },
  "Rede e WiFi":          { text: "text-emerald-500", bg: "bg-emerald-500/10", dot: "bg-emerald-500" },
  "Rastreamento":         { text: "text-cyan-500",    bg: "bg-cyan-500/10",    dot: "bg-cyan-500" },
  "Vídeo":                { text: "text-rose-500",    bg: "bg-rose-500/10",    dot: "bg-rose-500" },
  "Controle":             { text: "text-red-400",     bg: "bg-red-400/10",     dot: "bg-red-400" },
  "Eventos":              { text: "text-orange-500",  bg: "bg-orange-500/10",  dot: "bg-orange-500" },
  "IA / ADAS / DMS":      { text: "text-indigo-500",  bg: "bg-indigo-500/10",  dot: "bg-indigo-500" },
  "Diagnóstico":          { text: "text-slate-400",   bg: "bg-slate-400/10",   dot: "bg-slate-400" },
};

function equipmentPage(equipamento) {
  return {
    equipamento,
    busca: "",
    selecionadoNome: null,
    builderSelecao: {},
    builderCopiado: false,
    _activeCmdName: null,

    init() {
      this._checkAndReset();
      this.$watch("selecionadoNome", () => this._checkAndReset());
      this.$watch("busca", () => this._checkAndReset());
    },

    _checkAndReset() {
      const cmd = this.comandoAtivo;
      if (cmd && cmd.nome !== this._activeCmdName) {
        this._activeCmdName = cmd.nome;
        this.builderSelecao = selecaoInicial(cmd);
        this.builderCopiado = false;
      }
    },

    get comandosFiltrados() {
      const q = normalize(this.busca);
      if (!q) return this.equipamento.comandos;
      return this.equipamento.comandos.filter(c =>
        [c.nome, c.descricao, c.grupo].filter(Boolean).some(v => normalize(String(v)).includes(q))
      );
    },

    get comandosAgrupados() {
      const ORDEM = ["Consultas","Configuração Inicial","Sistema","Rede e WiFi","Rastreamento","Vídeo","Controle","Eventos","IA / ADAS / DMS","Diagnóstico","Outros"];
      const mapa = {};
      for (const c of this.comandosFiltrados) {
        const g = c.grupo || "Outros";
        if (!mapa[g]) mapa[g] = [];
        mapa[g].push(c);
      }
      return ORDEM.filter(g => mapa[g]).map(g => ({ grupo: g, comandos: mapa[g] }));
    },

    get comandoAtivo() {
      if (this.selecionadoNome) {
        const found = this.comandosFiltrados.find(c => c.nome === this.selecionadoNome);
        if (found) return found;
      }
      return this.comandosFiltrados[0] ?? null;
    },

    get builderResultado() {
      if (!this.comandoAtivo) return { texto: "", completo: false, faltando: [] };
      return montarComando(this.comandoAtivo, this.builderSelecao);
    },

    get builderFavorito() {
      return Alpine.store("app").isFavorito(this.builderResultado.texto);
    },

    get favoritosDoEquipamento() {
      return Alpine.store("app").favoritos.filter(f => f.equipamentoId === this.equipamento.id);
    },

    async copiarFavorito(texto) {
      try { await navigator.clipboard.writeText(texto); } catch {}
    },

    get builderVisiveis() {
      return this.comandoAtivo ? parametrosVisiveis(this.comandoAtivo) : [];
    },

    builderOpcoesDe(p) { return normalizarOpcoes(p.opcoes); },
    builderTipoDe(p) { return tipoDe(p); },
    builderIsObrigatorio(p) { return isObrigatorio(p); },

    builderToggleOpcao(p, valor) {
      const deseleciona = this.builderSelecao[p.nome] === valor && !isObrigatorio(p);
      this.builderSelecao = { ...this.builderSelecao, [p.nome]: deseleciona ? "" : valor };
    },

    builderSetValor(nome, valor) {
      this.builderSelecao = { ...this.builderSelecao, [nome]: valor };
    },

    async builderCopiar() {
      if (!this.builderResultado.completo) return;
      try {
        await navigator.clipboard.writeText(this.builderResultado.texto);
        Alpine.store("app").registrarHistorico({
          equipamentoId: this.equipamento.id,
          equipamentoNome: this.equipamento.equipamento,
          comandoNome: this.comandoAtivo.nome,
          resultado: this.builderResultado.texto,
          linha: this.equipamento.linha,
        });
        this.builderCopiado = true;
        setTimeout(() => { this.builderCopiado = false; }, 2000);
      } catch {}
    },

    builderFavoritar() {
      Alpine.store("app").alternarFavorito({
        equipamentoId: this.equipamento.id,
        equipamentoNome: this.equipamento.equipamento,
        comandoNome: this.comandoAtivo.nome,
        resultado: this.builderResultado.texto,
        linha: this.equipamento.linha,
      });
    },

    selecionar(nome) { this.selecionadoNome = nome; },

    grupoCorText(grupo) { return (GRUPO_CORES[grupo] || {}).text || "text-muted-foreground"; },
    grupoCorBg(grupo)   { return (GRUPO_CORES[grupo] || {}).bg   || "bg-accent/40"; },
    grupoCorDot(grupo)  { return (GRUPO_CORES[grupo] || {}).dot  || "bg-muted-foreground"; },
  };
}

// ── Componente: página inicial (busca) ────────────────────────────────────────

function homePage(equipamentos, atualizacoes, linha) {
  return {
    busca: "",
    equipamentos,
    atualizacoes,
    linha: linha || "jc",

    get filtrados() {
      const q = normalize(this.busca);
      if (!q) return this.equipamentos;
      return this.equipamentos.filter(e =>
        [e.equipamento, e.descricao, e.categoria, ...(e.comandos || []).map(c => c.nome)]
          .filter(Boolean)
          .some(v => normalize(String(v)).includes(q))
      );
    },

    get atualizacoesFiltradas() {
      const q = normalize(this.busca);
      if (!q) return this.atualizacoes;
      return this.atualizacoes.filter(a =>
        [a.equipamento, a.descricao, a.categoria]
          .filter(Boolean)
          .some(v => normalize(String(v)).includes(q))
      );
    },
  };
}

// ── Componente: upload de vídeo ───────────────────────────────────────────────

function videoUpload() {
  return {
    video: null,
    arrastando: false,

    selecionar(file) {
      if (!file || !file.type.startsWith("video/")) return;
      if (this.video) URL.revokeObjectURL(this.video.url);
      const tamanho = file.size < 1024 ? `${file.size} B`
        : file.size < 1024 * 1024 ? `${(file.size / 1024).toFixed(0)} KB`
        : `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
      this.video = { url: URL.createObjectURL(file), nome: file.name, tamanho };
    },

    remover() {
      if (this.video) URL.revokeObjectURL(this.video.url);
      this.video = null;
      const input = this.$refs.fileInput;
      if (input) input.value = "";
    },

    onDrop(e) {
      e.preventDefault();
      this.arrastando = false;
      this.selecionar(e.dataTransfer.files?.[0]);
    },
  };
}

// ── Componente: página de template (formulário guiado) ────────────────────────

const CATEGORIA_LIVRE = "Configuração Inicial";

function templateForm(comandos, endpoint) {
  return {
    comandos,
    endpoint,

    valores: {},
    preview: "",
    completo: false,
    erro: "",
    gerando: false,
    busca: "",

    cardsFechados: {},
    desbloqueados: {},

    init() {
      for (const comando of this.comandos) {
        for (const parametro of comando.parametros) {
          if (parametro.tipo === "fixo") continue;
          const chave = `${comando.nome}.${parametro.nome}`;
          this.valores[chave] = parametro.padrao !== undefined ? parametro.padrao : "";
        }
      }

      this.$watch("valores", () => this.atualizarPreview(), { deep: true });
      this.atualizarPreview();
    },

    atualizarPreview() {
      const resultado = montarTemplate(this.comandos, this.valores);
      this.preview = resultado.preview;
      this.completo = resultado.completo;
    },

    // ── Navegação lateral (agrupada, igual à página de equipamento) ──

    get comandosFiltrados() {
      const q = normalize(this.busca);
      if (!q) return this.comandos;
      return this.comandos.filter(c =>
        [c.nome, c.descricao, c.grupo].filter(Boolean).some(v => normalize(String(v)).includes(q))
      );
    },

    get comandosAgrupados() {
      const ORDEM = ["Consultas","Configuração Inicial","Sistema","Rede e WiFi","Rastreamento","Vídeo","Controle","Eventos","IA / ADAS / DMS","Diagnóstico","Outros"];
      const mapa = {};
      for (const c of this.comandosFiltrados) {
        const g = c.grupo || "Outros";
        if (!mapa[g]) mapa[g] = [];
        mapa[g].push(c);
      }
      return ORDEM.filter(g => mapa[g]).map(g => ({ grupo: g, comandos: mapa[g] }));
    },

    // Usa id no DOM (não x-ref) porque precisa ser dinâmico por iteração.
    irPara(nomeComando) {
      const alvo = document.getElementById(`card-${nomeComando}`);
      if (alvo) alvo.scrollIntoView({ behavior: "smooth", block: "start" });
    },

    comandoCompleto(comando) {
      for (const p of comando.parametros) {
        if (p.tipo === "fixo") continue;
        const obrigatorio = p.obrigatorio !== false;
        if (!obrigatorio) continue;
        const chave = `${comando.nome}.${p.nome}`;
        const valor = (this.valores[chave] ?? "").toString().trim();
        if (!valor) return false;
      }
      return true;
    },

    tipoDe(p) { return tipoDe(p); },
    isObrigatorio(p) { return isObrigatorio(p); },
    opcoesDe(p) { return normalizarOpcoes(p.opcoes); },

    grupoCorText(grupo) { return (GRUPO_CORES[grupo] || {}).text || "text-muted-foreground"; },
    grupoCorBg(grupo)   { return (GRUPO_CORES[grupo] || {}).bg   || "bg-accent/40"; },
    grupoCorDot(grupo)  { return (GRUPO_CORES[grupo] || {}).dot  || "bg-muted-foreground"; },

    // ── Expandir / minimizar cards ──

    cardAberto(nomeComando) {
      return !this.cardsFechados[nomeComando];
    },

    toggleCard(nomeComando) {
      this.cardsFechados = { ...this.cardsFechados, [nomeComando]: !this.cardsFechados[nomeComando] };
    },

    // ── Regra: comandos fora de "Configuração Inicial" vêm bloqueados,
    //           pré-preenchidos com o padrão do JSON, até o cliente clicar em "Editar" ──

    comandoBloqueavel(comando) {
      return (comando.grupo || "Outros") !== CATEGORIA_LIVRE;
    },

    comandoBloqueado(comando) {
      return this.comandoBloqueavel(comando) && !this.desbloqueados[comando.nome];
    },

    desbloquear(nomeComando) {
      this.desbloqueados = { ...this.desbloqueados, [nomeComando]: true };
    },

    // ── Geração / download ──

    async gerar() {
      if (!this.completo || this.gerando) return;
      this.gerando = true;
      this.erro = "";

      try {
        const res = await fetch(this.endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(this.valores),
        });

        if (!res.ok) {
          const corpo = await res.json().catch(() => ({}));
          this.erro = (corpo.erros || ["Erro ao gerar configuração."]).join(" ");
          return;
        }

        const blob = await res.blob();

        const disposition = res.headers.get("Content-Disposition") || "";
        const filenameMatch = disposition.match(/filename="?([^"]+)"?/i);
        const filename = filenameMatch ? filenameMatch[1] : "writeconfig.txt";

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);
      } catch (e) {
        this.erro = "Falha de conexão ao gerar o writeconfig.";
      } finally {
        this.gerando = false;
      }
    },
  };
}