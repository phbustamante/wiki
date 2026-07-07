function templateForm(comandos, actionUrl, downloadName) {
  return {
    comandos,
    valores: {},
    erro: null,
    gerando: false,

    init() {
      for (const c of this.comandos) {
        for (const p of c.parametros || []) {
          if (p.tipo === "fixo") continue;
          const chave = `${c.nome}.${p.nome}`;
          this.valores[chave] = p.padrao !== undefined ? String(p.padrao) : "";
        }
      }
    },

    valorParametro(comando, p) {
      if (p.tipo === "fixo") return p.valor;
      return this.valores[`${comando.nome}.${p.nome}`] ?? "";
    },

    // Regra: só libera o botão quando TODO campo obrigatório está preenchido
    get completo() {
      for (const c of this.comandos) {
        for (const p of c.parametros || []) {
          if (p.tipo === "fixo") continue;
          const obrigatorio = p.obrigatorio !== false; // default: true
          if (!obrigatorio) continue;
          const valor = (this.valores[`${c.nome}.${p.nome}`] ?? "").toString().trim();
          if (!valor) return false;
        }
      }
      return true;
    },

    get preview() {
      return this.comandos
        .map((c) => {
          const valores = (c.parametros || []).map((p) => this.valorParametro(c, p));
          let linha = valores.length ? [c.nome, ...valores].join(",") : c.nome;
          linha += c.sufixo || "";
          return linha + "#";
        })
        .join("\n");
    },

    async gerar() {
      if (!this.completo || this.gerando) return;

      this.gerando = true;
      this.erro = null;

      console.log("VALORES ENVIADOS:");
      console.table(this.valores);
      console.log(JSON.stringify(this.valores, null, 2));

      try {
        const resp = await fetch(actionUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(this.valores),
        });
        if (!resp.ok) {
          const corpo = await resp.json().catch(() => ({}));
          this.erro = (corpo.erros || ["Erro ao gerar configuração."]).join(" ");
          return;
        }
        const blob = await resp.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = downloadName;
        a.click();
        URL.revokeObjectURL(url);
      } catch (e) {
        this.erro = "Falha de conexão ao gerar configuração.";
      } finally {
        this.gerando = false;
      }
    },
  };
}