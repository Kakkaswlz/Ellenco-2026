/* ==================================================================== */
/* ELLENCO - NOVO-APONTAMENTO.JS                                        */
/* Controlador do Formulário de Registro de Produção de Campo (BDP)     */
/* ==================================================================== */

/* ==================================================================== */
/* ATIVIDADES: padrão + personalizadas (salvas neste navegador)         */
/* ==================================================================== */
const UNIDADES_PADRAO = {
    "Pavimentação CBUQ - Capa Asfáltica": "ton",
    "Terraplanagem - Corte e Aterro": "m³",
    "Aplicação de Brita Graduada (BGS)": "m³",
    "Assentamento de Tubos e Galerias": "m",
    "Fresagem de Pavimento Asfáltico": "m²",
    "Pintura Termoplástica e Tachas": "m²"
};
const CHAVE_ATIVIDADES = "ellenco_atividades_personalizadas";
let atividadesPersonalizadas = {};

function lerAtividadesSalvas() {
    try {
        const bruto = localStorage.getItem(CHAVE_ATIVIDADES);
        const obj = bruto ? JSON.parse(bruto) : {};
        return obj && typeof obj === "object" && !Array.isArray(obj) ? obj : {};
    } catch (e) {
        return {};
    }
}

function gravarAtividadesSalvas() {
    try {
        localStorage.setItem(CHAVE_ATIVIDADES, JSON.stringify(atividadesPersonalizadas));
    } catch (e) { /* sem armazenamento: a atividade vale só até recarregar */ }
}

function adicionarOpcaoAtividade(nome, unidade) {
    const select = document.getElementById("atividade");
    if (!select) return null;
    const opt = document.createElement("option");
    opt.value = nome;
    opt.textContent = `${nome} (${unidade})`;
    select.appendChild(opt);
    return opt;
}

async function carregarAtividadesPersonalizadas() {
    // 1) Atividades guardadas neste navegador (usadas quando o servidor está offline)
    atividadesPersonalizadas = lerAtividadesSalvas();
    Object.entries(atividadesPersonalizadas).forEach(([nome, unidade]) => {
        adicionarOpcaoSeNaoExiste(nome, String(unidade));
    });

    // 2) Atividades do banco de dados (catálogo compartilhado)
    try {
        const lista = await api.getAtividades();
        if (Array.isArray(lista)) {
            lista.forEach(a => {
                atividadesPersonalizadas[a.nome] = a.unidade;
                adicionarOpcaoSeNaoExiste(a.nome, a.unidade);
            });
            alterarUnidade();
        }
    } catch (e) { /* mantém apenas as atividades locais */ }
}

function adicionarOpcaoSeNaoExiste(nome, unidade) {
    const select = document.getElementById("atividade");
    if (!select) return null;
    const existente = Array.from(select.options).find(
        o => o.value.toLowerCase() === nome.toLowerCase()
    );
    return existente || adicionarOpcaoAtividade(nome, unidade);
}

function abrirModalNovaAtividade() {
    const modal = document.getElementById("modalNovaAtividade");
    if (modal) {
        modal.classList.remove("hidden");
        modal.classList.add("flex");
        document.getElementById("novaAtividadeNome")?.focus();
    }
}

function fecharModalNovaAtividade() {
    const modal = document.getElementById("modalNovaAtividade");
    if (modal) {
        modal.classList.add("hidden");
        modal.classList.remove("flex");
    }
    document.getElementById("formNovaAtividade")?.reset();
}

async function salvarNovaAtividade(e) {
    e.preventDefault();
    const nome = document.getElementById("novaAtividadeNome").value.trim();
    const unidade = document.getElementById("novaAtividadeUnidade").value.trim();

    if (!nome || !unidade) {
        mostrarToast("Informe o nome da atividade e a unidade técnica.", "erro");
        return;
    }

    const select = document.getElementById("atividade");
    const jaExiste = Array.from(select.options).some(
        o => o.value.toLowerCase() === nome.toLowerCase()
    );
    if (jaExiste) {
        mostrarToast("Essa atividade já existe na lista.", "erro");
        return;
    }

    let salvaNoBanco = false;
    try {
        const criada = await api.postAtividade({ nome, unidade });
        salvaNoBanco = !!(criada && criada.id);
    } catch (err) { /* cai no armazenamento local */ }

    atividadesPersonalizadas[nome] = unidade;
    if (!salvaNoBanco) gravarAtividadesSalvas(); // reserva: só neste navegador

    const opt = adicionarOpcaoAtividade(nome, unidade);
    if (opt) select.value = nome;
    alterarUnidade();

    mostrarToast(
        salvaNoBanco
            ? "Atividade cadastrada com sucesso!"
            : "Atividade salva só neste navegador (servidor indisponível).",
        salvaNoBanco ? "sucesso" : "info"
    );
    fecharModalNovaAtividade();
}

document.addEventListener("DOMContentLoaded", () => {
    renderSidebar("apontamento");
    renderTopbar("Novo Apontamento", "Registro diário com validação imediata e gravação no banco", false);
    verificarAutenticacao();
    aplicarPermissoesCargo();

    // Data padrão: hoje
    const inputData = document.getElementById("data");
    if (inputData) {
        inputData.value = new Date().toISOString().split("T")[0];
    }

    carregarAtividadesPersonalizadas();
    gerarNovoProtocolo();
    alterarUnidade();
    calcularDesvio();
});

function alterarUnidade() {
    const ativ = document.getElementById("atividade")?.value || "";
    const unidadeInput = document.getElementById("unidade");
    const label1 = document.getElementById("labelMetaPlanejada");
    const label2 = document.getElementById("labelProducaoRealizada");

    const u = { ...UNIDADES_PADRAO, ...atividadesPersonalizadas }[ativ] || "un";
    if (unidadeInput) unidadeInput.value = u;
    if (label1) label1.textContent = `Meta Programada (${u}) *`;
    if (label2) label2.textContent = `Volume Realizado em Campo (${u}) *`;

    calcularDesvio();
}

function aoMudarEquipe() {
    const eq = document.getElementById("equipe")?.value;
    const enc = document.getElementById("encarregado");
    const ativ = document.getElementById("atividade");

    const mapaLider = {
        "Equipe Pavimentação 01": { enc: "Carlos Silva", ativ: "Pavimentação CBUQ - Capa Asfáltica" },
        "Equipe Terraplanagem 02": { enc: "Marcos Souza", ativ: "Terraplanagem - Corte e Aterro" },
        "Equipe Drenagem 01": { enc: "José Santos", ativ: "Assentamento de Tubos e Galerias" },
        "Equipe Base 03": { enc: "Antônio Ferreira", ativ: "Aplicação de Brita Graduada (BGS)" },
        "Equipe Fresagem 01": { enc: "Paulo Lima", ativ: "Fresagem de Pavimento Asfáltico" },
        "Equipe Sinalização Noturna": { enc: "Roberto Dias", ativ: "Pintura Termoplástica e Tachas" }
    };

    if (mapaLider[eq]) {
        if (enc) enc.value = mapaLider[eq].enc;
        if (ativ) {
            ativ.value = mapaLider[eq].ativ;
            alterarUnidade();
        }
    }
}

function aoMudarObra() {
    // Pode sincronizar equipe se aplicável
}

function calcularDesvio() {
    const planejado = parseFloat(document.getElementById("planejado")?.value) || 0;
    const realizado = parseFloat(document.getElementById("realizado")?.value) || 0;
    const horas = parseFloat(document.getElementById("horas")?.value) || 8.5;

    const box = document.getElementById("boxResultado");
    const icone = document.getElementById("iconeResultado");
    const texto = document.getElementById("textoResultado");
    const detalhe = document.getElementById("detalheResultado");
    const avisoTypo = document.getElementById("avisoAlertaTypo");

    const elEfi = document.getElementById("resEficiencia");
    const elDesv = document.getElementById("resDesvio");
    const elProd = document.getElementById("resProdutividade");

    if (planejado <= 0 || realizado <= 0) {
        if (elEfi) elEfi.textContent = "0%";
        if (elDesv) elDesv.textContent = "0%";
        if (elProd) elProd.textContent = "0 un/h";
        if (box) box.className = "p-4 rounded-2xl border bg-slate-50 border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all";
        if (icone) icone.className = "fa-solid fa-calculator text-2xl text-slate-400";
        if (texto) texto.textContent = "Aguardando preenchimento dos volumes...";
        if (detalhe) detalhe.textContent = "Insira a meta e a produção realizada para ver o cálculo automático.";
        if (avisoTypo) avisoTypo.classList.add("hidden");
        return;
    }

    const desvio = ((realizado - planejado) / planejado) * 100;
    const eficiencia = (realizado / planejado) * 100;
    const prod = horas > 0 ? (realizado / horas).toFixed(1) : 0;
    const u = document.getElementById("unidade")?.value || "un";

    if (elEfi) elEfi.textContent = `${eficiencia.toFixed(1)}%`;
    if (elDesv) {
        elDesv.textContent = `${desvio >= 0 ? '+' : ''}${desvio.toFixed(1)}%`;
        elDesv.className = `text-base font-black ${desvio >= 0 ? 'text-emerald-600' : 'text-ellenco-red'}`;
    }
    if (elProd) elProd.textContent = `${prod} ${u}/h`;

    // Alerta de Typo / Outlier (> 300%)
    if (realizado > planejado * 3 && avisoTypo) {
        avisoTypo.classList.remove("hidden");
    } else if (avisoTypo) {
        avisoTypo.classList.add("hidden");
    }

    if (!box || !icone || !texto || !detalhe) return;

    if (eficiencia >= 100) {
        box.className = "p-4 rounded-2xl border bg-emerald-50 border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all";
        icone.className = "fa-solid fa-circle-check text-2xl text-emerald-600";
        texto.textContent = "Meta Atingida com Sucesso!";
        texto.className = "text-sm font-black text-emerald-950";
        detalhe.textContent = `A equipe superou a programação em ${desvio.toFixed(1)}% (${(realizado - planejado).toFixed(1)} ${u} adicionais).`;
        detalhe.className = "text-xs text-emerald-700";
    } else if (eficiencia >= 90) {
        box.className = "p-4 rounded-2xl border bg-blue-50 border-blue-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all";
        icone.className = "fa-solid fa-circle-info text-2xl text-blue-600";
        texto.textContent = "Produção Dentro da Faixa Aceitável";
        texto.className = "text-sm font-black text-blue-950";
        detalhe.textContent = `Atingimento de ${eficiencia.toFixed(1)}% da meta. Variação de ${Math.abs(desvio).toFixed(1)}%.`;
        detalhe.className = "text-xs text-blue-700";
    } else {
        box.className = "p-4 rounded-2xl border bg-red-50 border-red-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all";
        icone.className = "fa-solid fa-triangle-exclamation text-2xl text-ellenco-red";
        texto.textContent = "Alerta: Desvio Crítico de Produção";
        texto.className = "text-sm font-black text-red-950";
        detalhe.textContent = `Rendimento de apenas ${eficiencia.toFixed(1)}% (${(planejado - realizado).toFixed(1)} ${u} abaixo da meta). Justifique nas ocorrências.`;
        detalhe.className = "text-xs text-red-700";
    }
}

async function puxarClimaParaFormulario() {
    const obra = document.getElementById("obra")?.value || "SP-270 Rodovia Raposo Tavares";
    let cidade = "Sorocaba";
    if (obra.includes("Industrial")) cidade = "Campinas";
    if (obra.includes("Jardim")) cidade = "Votorantim";
    if (obra.includes("Aeroporto")) cidade = "Ribeirão Preto";

    mostrarToast(`Consultando clima para ${cidade}...`, "info");
    const clima = await api.consultarClima(cidade);

    const climaSelect = document.getElementById("clima");
    if (climaSelect) {
        if (clima.condicaoTexto.includes("Chuva Forte")) {
            climaSelect.value = "Chuva Forte (Parado)";
        } else if (clima.condicaoTexto.includes("Chuva")) {
            climaSelect.value = "Chuva Leve";
        } else if (clima.condicaoTexto.includes("Nublado")) {
            climaSelect.value = "Nublado";
        } else {
            climaSelect.value = "Ensolarado";
        }
    }

    const obs = document.getElementById("observacao");
    if (obs && !obs.value) {
        obs.value = `Clima capturado via Open-Meteo: ${clima.cidade} (${clima.temperatura}°C, ${clima.condicaoTexto}, vento ${clima.vento} km/h).`;
    }

    mostrarToast(`Clima preenchido: ${clima.condicaoTexto} (${clima.temperatura}°C)`, "sucesso");
}

function gerarNovoProtocolo() {
    const num = Math.floor(1000 + Math.random() * 9000);
    const el = document.getElementById("protocoloNumero");
    if (el) el.textContent = `BDP-2026-${num}`;
}

async function registrarApontamento(e) {
    e.preventDefault();

    const planejado = parseFloat(document.getElementById("planejado").value);
    const realizado = parseFloat(document.getElementById("realizado").value);

    if (isNaN(planejado) || isNaN(realizado) || planejado <= 0) {
        mostrarToast("Preencha corretamente os valores de meta e produção.", "erro");
        return;
    }

    const checkAssinatura = document.getElementById("checkAssinatura");
    if (!checkAssinatura || !checkAssinatura.checked) {
        mostrarToast("Você deve marcar o termo de assinatura digital.", "warning");
        return;
    }

    const protocolo = document.getElementById("protocoloNumero")?.textContent || `BDP-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const dados = {
        protocolo,
        data: document.getElementById("data").value,
        obra: document.getElementById("obra").value,
        turno: document.getElementById("turno").value,
        equipe: document.getElementById("equipe").value,
        encarregado: document.getElementById("encarregado").value,
        atividade: document.getElementById("atividade").value,
        unidade: document.getElementById("unidade").value,
        horas: parseFloat(document.getElementById("horas").value) || 8.5,
        planejado,
        realizado,
        efetivo: parseInt(document.getElementById("efetivo").value) || 14,
        clima: document.getElementById("clima").value,
        parada: document.getElementById("motivoParada").value,
        obs: document.getElementById("observacao").value.trim()
    };

    try {
        mostrarToast("Gravando BDP no banco de dados SQLite...", "info");
        await api.postApontamento(dados);

        mostrarToast("Apontamento gravado com sucesso no banco de dados!", "sucesso");

        setTimeout(() => {
            if (confirm("Apontamento registrado com sucesso!\n\nDeseja visualizar o registro no Histórico & Auditoria?")) {
                window.location.href = "historico-auditoria.html";
            } else {
                limparFormulario();
                gerarNovoProtocolo();
            }
        }, 400);

    } catch (err) {
        console.error("Erro ao registrar apontamento:", err);
        mostrarToast("Erro ao gravar apontamento no banco.", "erro");
    }
}

function limparFormulario() {
    document.getElementById("formApontamento")?.reset();
    const inputData = document.getElementById("data");
    if (inputData) {
        inputData.value = new Date().toISOString().split("T")[0];
    }
    alterarUnidade();
    calcularDesvio();
}

window.alterarUnidade = alterarUnidade;
window.abrirModalNovaAtividade = abrirModalNovaAtividade;
window.fecharModalNovaAtividade = fecharModalNovaAtividade;
window.salvarNovaAtividade = salvarNovaAtividade;
window.aoMudarEquipe = aoMudarEquipe;
window.aoMudarObra = aoMudarObra;
window.calcularDesvio = calcularDesvio;
window.puxarClimaParaFormulario = puxarClimaParaFormulario;
window.registrarApontamento = registrarApontamento;
window.limparFormulario = limparFormulario;
