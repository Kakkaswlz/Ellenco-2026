/* ==================================================================== */
/* ELLENCO - EQUIPES.JS                                                 */
/* Controlador da Listagem e Cadastro de Equipes de Campo               */
/* ==================================================================== */

document.addEventListener("DOMContentLoaded", async () => {
    renderSidebar("equipes");
    renderTopbar("Equipes de Campo", "Gestão do efetivo, produtividade acumulada e frentes ativas", false);
    verificarAutenticacao();
    aplicarPermissoesCargo();

    await carregarEquipes();
});

async function carregarEquipes() {
    try {
        const equipes = await api.getEquipes();
        renderizarGridEquipes(equipes);
    } catch (e) {
        console.error("Erro ao carregar equipes:", e);
        mostrarToast("Erro ao carregar equipes.", "erro");
    }
}

function renderizarGridEquipes(equipes) {
    const container = document.getElementById("gridEquipes");
    if (!container) return;

    if (!equipes.length) {
        container.innerHTML = `<div class="col-span-full p-8 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">Nenhuma equipe cadastrada no sistema.</div>`;
        return;
    }

    container.innerHTML = equipes.map(eq => {
        const meta = parseFloat(eq.meta_acumulada || eq.metaAcumulada) || 0;
        const real = parseFloat(eq.realizado_acumulado || eq.realizadoAcumulado) || 0;
        const ef = meta > 0 ? (real / meta) * 100 : 100;
        let badgeStatus = '';
        let barraColor = 'bg-emerald-500';

        if (ef >= 100) {
            badgeStatus = `<span class="badge badge-success">Acima da Meta</span>`;
            barraColor = 'bg-emerald-500';
        } else if (ef >= 90) {
            badgeStatus = `<span class="badge badge-info">Na Meta</span>`;
            barraColor = 'bg-blue-500';
        } else {
            badgeStatus = `<span class="badge badge-danger">Abaixo da Meta</span>`;
            barraColor = 'bg-ellenco-red';
        }

        return `
            <div class="card-stat bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4 flex flex-col justify-between hover:shadow-md transition-all">
                <div>
                    <div class="flex justify-between items-start">
                        <div>
                            <span class="text-[10px] font-bold uppercase text-slate-400">Equipe de Produção</span>
                            <h3 class="font-extrabold text-slate-900 text-base mt-0.5">${eq.nome}</h3>
                        </div>
                        ${badgeStatus}
                    </div>

                    <div class="mt-3.5 space-y-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <p class="flex items-center gap-2"><i class="fa-solid fa-hard-hat text-amber-500 w-4 text-center"></i> <strong>Líder:</strong> <span class="text-slate-800">${eq.encarregado}</span></p>
                        <p class="flex items-center gap-2"><i class="fa-solid fa-industry text-blue-600 w-4 text-center"></i> <strong>Atividade:</strong> <span class="text-slate-800">${eq.atividade}</span></p>
                        <p class="flex items-center gap-2"><i class="fa-solid fa-road text-slate-400 w-4 text-center"></i> <strong>Obra:</strong> <span class="text-slate-800 truncate">${eq.obra}</span></p>
                        <p class="flex items-center gap-2"><i class="fa-solid fa-users text-teal-600 w-4 text-center"></i> <strong>Efetivo:</strong> <span class="text-slate-800">${eq.integrantes} colaboradores</span></p>
                    </div>
                </div>

                <div class="pt-3 border-t border-slate-100 space-y-2">
                    <div class="flex justify-between text-xs font-bold text-slate-700">
                        <span>Atingimento da Meta</span>
                        <span class="text-slate-900">${ef.toFixed(1)}%</span>
                    </div>
                    <div class="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                        <div class="${barraColor} h-2.5 rounded-full transition-all duration-500" style="width: ${Math.min(ef, 100)}%"></div>
                    </div>
                    <div class="flex justify-between text-[11px] text-slate-400 pt-0.5">
                        <span>Meta: ${meta.toLocaleString("pt-BR")}</span>
                        <span class="font-bold text-slate-700">Real: ${real.toLocaleString("pt-BR")}</span>
                    </div>
                </div>
            </div>
        `;
    }).join("");
}

function abrirModalNovaEquipe() {
    const modal = document.getElementById("modalNovaEquipe");
    if (modal) {
        modal.classList.remove("hidden");
        modal.classList.add("flex");
    }
}

function fecharModalNovaEquipe() {
    const modal = document.getElementById("modalNovaEquipe");
    if (modal) {
        modal.classList.add("hidden");
        modal.classList.remove("flex");
    }
}

async function salvarNovaEquipe(e) {
    e.preventDefault();
    const nova = {
        nome: document.getElementById("novaEquipeNome").value.trim(),
        encarregado: document.getElementById("novaEquipeEncarregado").value.trim(),
        atividade: document.getElementById("novaEquipeAtividade").value,
        obra: document.getElementById("novaEquipeObra")?.value || "SP-270 Rodovia Raposo Tavares",
        integrantes: parseInt(document.getElementById("novaEquipeIntegrantes").value) || 12,
        meta_acumulada: 1000,
        realizado_acumulado: 1000,
        produtividade_media: "50.0 un/h",
        status: "Na Meta"
    };

    try {
        mostrarToast("Cadastrando equipe no banco de dados...", "info");
        await api.postEquipe(nova);
        mostrarToast("Equipe cadastrada com sucesso!", "sucesso");
        fecharModalNovaEquipe();
        document.getElementById("formNovaEquipe")?.reset();
        await carregarEquipes();
    } catch (err) {
        mostrarToast("Erro ao cadastrar equipe.", "erro");
    }
}

window.abrirModalNovaEquipe = abrirModalNovaEquipe;
window.fecharModalNovaEquipe = fecharModalNovaEquipe;
window.salvarNovaEquipe = salvarNovaEquipe;
