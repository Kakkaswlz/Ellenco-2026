/* ==================================================================== */
/* ELLENCO - ATIVIDADES.JS                                              */
/* Controlador da Listagem e Cadastro de Atividades (serviço + unidade) */
/* ==================================================================== */

const ATIVIDADES_PADRAO_LISTA = [
    { nome: "Pavimentação CBUQ - Capa Asfáltica", unidade: "ton" },
    { nome: "Terraplanagem - Corte e Aterro", unidade: "m³" },
    { nome: "Locação e Execução por Estacas", unidade: "estacas" },
    { nome: "Aplicação de Brita Graduada (BGS)", unidade: "m³" },
    { nome: "Assentamento de Tubos e Galerias", unidade: "m" },
    { nome: "Fresagem de Pavimento Asfáltico", unidade: "m²" },
    { nome: "Pintura Termoplástica e Tachas", unidade: "m²" }
];
const CHAVE_ATIVIDADES_LOCAL = "ellenco_atividades_personalizadas";

document.addEventListener("DOMContentLoaded", async () => {
    renderSidebar("atividades");
    renderTopbar("Atividades", "Catálogo de serviços e unidades técnicas dos apontamentos", false);
    verificarAutenticacao();
    aplicarPermissoesCargo();

    await carregarAtividades();
});

function escaparHtml(texto) {
    return String(texto).replace(/[&<>"']/g, c => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
}

function lerAtividadesLocais() {
    try {
        const bruto = localStorage.getItem(CHAVE_ATIVIDADES_LOCAL);
        const obj = bruto ? JSON.parse(bruto) : {};
        return obj && typeof obj === "object" && !Array.isArray(obj) ? obj : {};
    } catch (e) {
        return {};
    }
}

function gravarAtividadeLocal(nome, unidade) {
    try {
        const locais = lerAtividadesLocais();
        locais[nome] = unidade;
        localStorage.setItem(CHAVE_ATIVIDADES_LOCAL, JSON.stringify(locais));
    } catch (e) { /* sem armazenamento: vale só até recarregar */ }
}

async function carregarAtividades() {
    try {
        const doBanco = await api.getAtividades();
        const lista = Array.isArray(doBanco) && doBanco.length
            ? doBanco.map(a => ({ nome: a.nome, unidade: a.unidade, local: false }))
            : ATIVIDADES_PADRAO_LISTA.map(a => ({ ...a, local: false }));

        // Atividades criadas offline (ficam só neste navegador)
        Object.entries(lerAtividadesLocais()).forEach(([nome, unidade]) => {
            if (!lista.some(a => a.nome.toLowerCase() === nome.toLowerCase())) {
                lista.push({ nome, unidade: String(unidade), local: true });
            }
        });

        renderizarGridAtividades(lista);
    } catch (e) {
        console.error("Erro ao carregar atividades:", e);
        mostrarToast("Erro ao carregar atividades.", "erro");
    }
}

function renderizarGridAtividades(atividades) {
    const container = document.getElementById("gridAtividades");
    if (!container) return;

    if (!atividades.length) {
        container.innerHTML = `<div class="col-span-full p-8 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">Nenhuma atividade cadastrada no sistema.</div>`;
        return;
    }

    container.innerHTML = atividades.map(at => `
        <div class="card-stat bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center justify-between gap-3 hover:shadow-md transition-all">
            <div class="min-w-0">
                <span class="text-[10px] font-bold uppercase text-slate-400">Atividade</span>
                <h3 class="font-extrabold text-slate-900 text-base mt-0.5">${escaparHtml(at.nome)}</h3>
                ${at.local ? `<p class="text-[11px] text-slate-400 mt-1">Somente neste navegador</p>` : ""}
            </div>
            <span class="badge badge-info shrink-0">${escaparHtml(at.unidade)}</span>
        </div>
    `).join("");
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

    const jaExiste = Array.from(document.querySelectorAll("#gridAtividades h3")).some(
        h => h.textContent.trim().toLowerCase() === nome.toLowerCase()
    );
    if (jaExiste) {
        mostrarToast("Essa atividade já existe na lista.", "erro");
        return;
    }

    try {
        mostrarToast("Cadastrando atividade no banco de dados...", "info");
        const criada = await api.postAtividade({ nome, unidade });
        if (criada && criada.id) {
            mostrarToast("Atividade cadastrada com sucesso!", "sucesso");
        } else {
            gravarAtividadeLocal(nome, unidade);
            mostrarToast("Atividade salva só neste navegador (servidor indisponível).", "aviso");
        }
        fecharModalNovaAtividade();
        await carregarAtividades();
    } catch (err) {
        mostrarToast(err.message || "Erro ao cadastrar atividade.", "erro");
    }
}

window.abrirModalNovaAtividade = abrirModalNovaAtividade;
window.fecharModalNovaAtividade = fecharModalNovaAtividade;
window.salvarNovaAtividade = salvarNovaAtividade;