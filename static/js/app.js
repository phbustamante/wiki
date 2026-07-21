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

// Identifica de forma única uma instância de comando dentro de um template.
// Sem "chave" (comando comum, sem repetição), cai no nome — comportamento antigo preservado.
function chaveDe(comando) {
  return comando.chave ?? comando.nome;
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
      const chave = `${chaveDe(comando)}.${parametro.nome}`;
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
  return { theme: "system", historico: [], favoritos: [], templatesCustom: [] };
}

function saveStore(s) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify({
      theme: s.theme,
      historico: s.historico,
      favoritos: s.favoritos,
      templatesCustom: s.templatesCustom,
    }));
  } catch {}
}

// Um comando é "repetível" no construtor de templates se tiver um parâmetro
// canal/tipo_evento com opções fixas — cada opção vira uma instância possível.
function discriminadorDe(comando) {
  return (comando.parametros || []).find(
    p => (p.nome === "canal" || p.nome === "tipo_evento") && p.opcoes && p.opcoes.length > 0
  ) || null;
}

// ── Alpine.js store global ────────────────────────────────────────────────────

document.addEventListener("alpine:init", () => {
  const saved = loadStore();

  Alpine.store("app", {
    theme: saved.theme ?? "system",
    historico: saved.historico ?? [],
    favoritos: saved.favoritos ?? [],
    templatesCustom: saved.templatesCustom ?? [],
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

    salvarTemplateCustom(tpl) {
      const agora = Date.now();
      const existente = tpl.id && this.templatesCustom.find(t => t.id === tpl.id);
      if (existente) {
        this.templatesCustom = this.templatesCustom.map(t =>
          t.id === tpl.id ? { ...t, ...tpl, atualizadoEm: agora } : t
        );
        saveStore(this);
        return existente.id;
      }
      const novoId = uid();
      this.templatesCustom = [
        { ...tpl, id: novoId, criadoEm: agora, atualizadoEm: agora },
        ...this.templatesCustom,
      ];
      saveStore(this);
      return novoId;
    },

    removerTemplateCustom(id) {
      this.templatesCustom = this.templatesCustom.filter(t => t.id !== id);
      saveStore(this);
    },

    getTemplateCustom(id) {
      return this.templatesCustom.find(t => t.id === id) || null;
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

function homePage(equipamentos, linha) {
  return {
    busca: "",
    equipamentos,
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
          const chave = `${chaveDe(comando)}.${parametro.nome}`;
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
        const chave = `${chaveDe(comando)}.${p.nome}`;
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
      return this.comandoBloqueavel(comando) && !this.desbloqueados[chaveDe(comando)];
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

// ── Componente: listagem de templates do equipamento (oficiais + personalizados) ──

function templatesEquipamentoPage(equipamento, templatesOficiais, linha) {
  return {
    equipamento,
    templatesOficiais,
    linha,

    expandido: null,
    escolhaAberta: false,
    passoModal: "escolha",

    get meusTemplates() {
      return Alpine.store("app").templatesCustom.filter(t => t.equipamentoId === this.equipamento.id);
    },

    abrirEscolha() {
      this.passoModal = "escolha";
      this.escolhaAberta = true;
    },

    fecharEscolha() {
      this.escolhaAberta = false;
    },

    criarDoZero() {
      window.location.href = `/${this.linha}/templates/${this.equipamento.id}/personalizado`;
    },

    criarComBase(templateId) {
      window.location.href = `/${this.linha}/templates/${this.equipamento.id}/personalizado?base=${encodeURIComponent(templateId)}`;
    },

    urlEditar(templateId) {
      return `/${this.linha}/templates/${this.equipamento.id}/personalizado?editar=${encodeURIComponent(templateId)}`;
    },

    alternarExpandido(id) {
      this.expandido = this.expandido === id ? null : id;
    },

    async gerarWriteconfig(tpl) {
      const itens = tpl.itens.map(i => ({
        equipamentoId: tpl.equipamentoId,
        equipamentoNome: tpl.equipamentoNome,
        resultado: i.resultado,
        linha: tpl.linha,
      }));
      await Alpine.store("app").exportarWriteconfig("template-custom", itens, tpl.nome);
    },

    excluir(tpl) {
      if (confirm(`Excluir o template "${tpl.nome}"? Essa ação não pode ser desfeita.`)) {
        Alpine.store("app").removerTemplateCustom(tpl.id);
      }
    },
  };
}

// ── Componente: construtor de template personalizado (criar/editar) ──────────

function templateBuilderPage(equipamento, templatesOficiais, baseComandos, baseInfo, voltarUrl) {
  return {
    equipamento,
    templatesOficiais,
    baseComandos,
    baseInfo,
    voltarUrl,

    editandoId: null,
    nome: "",
    descricao: "",
    itens: [],

    busca: "",
    ativoNome: null,
    editandoChave: null,
    selecao: {},
    tituloAtivo: "",

    erroForm: "",
    erro: "",
    salvando: false,

    init() {
      const params = new URLSearchParams(window.location.search);
      const editarId = params.get("editar");

      if (editarId) {
        const tpl = Alpine.store("app").getTemplateCustom(editarId);
        if (tpl) {
          this.editandoId = tpl.id;
          this.nome = tpl.nome;
          this.descricao = tpl.descricao || "";
          this.itens = tpl.itens.map(i => this._recalcularCompletude(i));
          return;
        }
      }

      if (this.baseComandos && this.baseComandos.length) {
        this.itens = this.baseComandos.map(c => this._itemFromResolvido(c));
        if (this.baseInfo) {
          this.nome = `Cópia de ${this.baseInfo.nome}`;
          this.descricao = this.baseInfo.descricao || "";
        }
      }
    },

    // Recalcula completo/faltando a partir da definição atual do comando —
    // garante que templates salvos antes desse campo existir continuem corretos.
    _recalcularCompletude(item) {
      const valores = { ...item.valores };
      const base = this.equipamento.comandos.find(c => c.nome === item.nomeComando);
      if (!base) return { ...item, valores, completo: true, faltando: [] };
      const resultado = montarComando(base, valores);
      return { ...item, valores, completo: resultado.completo, faltando: resultado.faltando };
    },

    _itemFromResolvido(c) {
      const valores = selecaoInicial(c);
      const resultado = montarComando(c, valores);
      return {
        chave: chaveDe(c),
        nomeComando: c.nome,
        titulo: c.titulo || null,
        grupo: c.grupo,
        valores,
        resultado: resultado.texto,
        completo: resultado.completo,
        faltando: resultado.faltando,
      };
    },

    // ── Lista de comandos (esquerda) ──

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

    existentesDoComando(comando) {
      return this.itens.filter(i => i.nomeComando === comando.nome);
    },

    podeInserirNovo(comando) {
      const disc = discriminadorDe(comando);
      const existentes = this.existentesDoComando(comando);
      if (!disc) return existentes.length === 0;
      return existentes.length < normalizarOpcoes(disc.opcoes).length;
    },

    statusComando(comando) {
      const disc = discriminadorDe(comando);
      const existentes = this.existentesDoComando(comando);
      if (!disc) return existentes.length > 0 ? "Inserido" : "";
      const total = normalizarOpcoes(disc.opcoes).length;
      return existentes.length > 0 ? `${existentes.length}/${total}` : "";
    },

    abrirComando(comando) {
      const disc = discriminadorDe(comando);
      if (!disc) {
        const existente = this.itens.find(i => i.nomeComando === comando.nome);
        if (existente) {
          this.editarItem(existente.chave);
          return;
        }
      }
      this.selecionarComando(comando.nome);
    },

    selecionarComando(nome) {
      const comando = this.equipamento.comandos.find(c => c.nome === nome);
      if (!comando) return;
      this.ativoNome = nome;
      this.selecao = selecaoInicial(comando);
      this.tituloAtivo = "";
      this.editandoChave = null;
      this.erroForm = "";
    },

    // ── Editor do comando ativo (centro) ──

    get comandoAtivo() {
      return this.ativoNome
        ? (this.equipamento.comandos.find(c => c.nome === this.ativoNome) || null)
        : null;
    },

    get discriminadorAtivo() {
      return this.comandoAtivo ? discriminadorDe(this.comandoAtivo) : null;
    },

    get editorVisiveis() {
      return this.comandoAtivo ? parametrosVisiveis(this.comandoAtivo) : [];
    },

    opcoesDoParametro(p) {
      const todas = normalizarOpcoes(p.opcoes);
      const disc = this.discriminadorAtivo;
      if (!disc || p.nome !== disc.nome) return todas;
      const usadosPorOutros = this.itens
        .filter(i => i.nomeComando === this.comandoAtivo.nome && i.chave !== this.editandoChave)
        .map(i => i.valores[disc.nome]);
      return todas.filter(op => !usadosPorOutros.includes(op.valor));
    },

    tipoDe(p) { return tipoDe(p); },
    isObrigatorio(p) { return isObrigatorio(p); },

    setValor(nome, valor) {
      this.selecao = { ...this.selecao, [nome]: valor };
    },

    toggleOpcao(p, valor) {
      const desmarca = this.selecao[p.nome] === valor && !isObrigatorio(p);
      this.selecao = { ...this.selecao, [p.nome]: desmarca ? "" : valor };
    },

    get resultadoAtivo() {
      if (!this.comandoAtivo) return { texto: "", completo: false, faltando: [] };
      return montarComando(this.comandoAtivo, this.selecao);
    },

    cancelarEdicao() {
      this.ativoNome = null;
      this.editandoChave = null;
      this.selecao = {};
      this.tituloAtivo = "";
      this.erroForm = "";
    },

    inserir() {
      if (!this.comandoAtivo) return;
      this.erroForm = "";

      const disc = this.discriminadorAtivo;
      let chave;

      if (this.editandoChave) {
        chave = this.editandoChave;
      } else if (disc) {
        const valor = this.selecao[disc.nome];
        if (!valor) {
          this.erroForm = `Selecione o valor de "${disc.nome}" antes de inserir.`;
          return;
        }
        const jaUsado = this.itens.some(i =>
          i.nomeComando === this.comandoAtivo.nome && i.valores[disc.nome] === valor
        );
        if (jaUsado) {
          this.erroForm = "Esse canal/evento já foi inserido neste template.";
          return;
        }
        chave = `${this.comandoAtivo.nome}::${valor}`;
      } else {
        if (this.itens.some(i => i.nomeComando === this.comandoAtivo.nome)) {
          this.erroForm = "Esse comando já foi inserido neste template.";
          return;
        }
        chave = this.comandoAtivo.nome;
      }

      const resultado = montarComando(this.comandoAtivo, this.selecao);
      const item = {
        chave,
        nomeComando: this.comandoAtivo.nome,
        titulo: this.tituloAtivo.trim() || null,
        grupo: this.comandoAtivo.grupo,
        valores: { ...this.selecao },
        resultado: resultado.texto,
        completo: resultado.completo,
        faltando: resultado.faltando,
      };

      const idx = this.itens.findIndex(i => i.chave === chave);
      if (idx >= 0) {
        this.itens = [...this.itens.slice(0, idx), item, ...this.itens.slice(idx + 1)];
      } else {
        this.itens = [...this.itens, item];
      }

      this.cancelarEdicao();
    },

    // ── Pré-visualização (direita) ──

    get itensAgrupados() {
      const mapa = {};
      for (const i of this.itens) {
        const g = i.grupo || "Outros";
        if (!mapa[g]) mapa[g] = [];
        mapa[g].push(i);
      }
      return Object.keys(mapa).map(g => ({ grupo: g, itens: mapa[g] }));
    },

    get itensIncompletos() {
      return this.itens.filter(i => !i.completo);
    },

    comandoTemIncompleto(comando) {
      return this.existentesDoComando(comando).some(i => !i.completo);
    },

    editarItem(chave) {
      const item = this.itens.find(i => i.chave === chave);
      if (!item) return;
      this.ativoNome = item.nomeComando;
      this.selecao = { ...item.valores };
      this.tituloAtivo = item.titulo || "";
      this.editandoChave = chave;
      this.erroForm = "";
    },

    removerItem(chave) {
      this.itens = this.itens.filter(i => i.chave !== chave);
      if (this.editandoChave === chave) this.cancelarEdicao();
    },

    grupoCorText(grupo) { return (GRUPO_CORES[grupo] || {}).text || "text-muted-foreground"; },
    grupoCorBg(grupo)   { return (GRUPO_CORES[grupo] || {}).bg   || "bg-accent/40"; },
    grupoCorDot(grupo)  { return (GRUPO_CORES[grupo] || {}).dot  || "bg-muted-foreground"; },

    // ── Salvar ──

    salvar() {
      this.erro = "";
      if (!this.nome.trim()) {
        this.erro = "Informe um nome para o template.";
        return;
      }
      if (!this.itens.length) {
        this.erro = "Insira ao menos um comando no template.";
        return;
      }
      if (this.itensIncompletos.length > 0) {
        this.erro = "Existem comandos com parâmetros obrigatórios pendentes. Edite-os antes de salvar.";
        return;
      }

      this.salvando = true;
      Alpine.store("app").salvarTemplateCustom({
        id: this.editandoId,
        equipamentoId: this.equipamento.id,
        equipamentoNome: this.equipamento.equipamento,
        linha: this.equipamento.linha,
        nome: this.nome.trim(),
        descricao: this.descricao.trim(),
        itens: this.itens,
      });
      window.location.href = this.voltarUrl;
    },

    cancelar() {
      window.location.href = this.voltarUrl;
    },
  };
}