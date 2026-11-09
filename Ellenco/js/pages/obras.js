/* ==================================================================== */
/* ELLENCO - OBRAS.JS                                                   */
/* Controlador do Acompanhamento de Obras & Frentes Contratuais         */
/* ==================================================================== */

document.addEventListener("DOMContentLoaded", async () => {
    renderSidebar("obras");
    renderTopbar("Obras & Frentes", "Acompanhamento físico e volumétrico de contratos ativos", false);
    verificarAutenticacao();
    aplicarPermissoesCargo();

    await carregarObras();
});

async function carregarObras() {
    try {
        const obras = await api.getObras();
        renderizarGridObras(obras);
    } catch (e) {
        console.error("Erro ao carregar obras:", e);
        mostrarToast("Erro ao carregar obras.", "erro");
    }
}

function renderizarGridObras(obras) {
    const container = document.getElementById("gridObras");
    if (!container) return;

    if (!obras.length) {
        container.innerHTML = `<div class="col-span-full p-8 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">Nenhum contrato cadastrado.</div>`;
        return;
    }

    container.innerHTML = obras.map(ob => {
        const progresso = parseFloat(ob.progresso) || 0;
        const volume = ob.volume_total || ob.volumeTotal || "10.000 un";

        return `
            <div class="card-stat bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
                <div class="h-28 gradient-brand p-5 flex items-end justify-between text-white relative">
                    <div class="relative z-10">
                        <span class="bg-white/20 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full backdrop-blur-md uppercase tracking-wider">${escapeHTML(ob.status)}</span>
                        <h3 class="font-black text-lg mt-1 truncate">${escapeHTML(ob.nome)}</h3>
                    </div>
                </div>

                <div class="p-5 space-y-4">
                    <div class="text-xs text-slate-600 space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                        <p class="flex items-center gap-2"><i class="fa-solid fa-location-dot text-ellenco-red w-4 text-center"></i> <strong>Local:</strong> <span class="text-slate-800">${escapeHTML(ob.local)}</span></p>
                        <p class="flex items-center gap-2"><i class="fa-solid fa-user-tie text-blue-600 w-4 text-center"></i> <strong>Responsável:</strong> <span class="text-slate-800">${escapeHTML(ob.eng)}</span></p>
                        <p class="flex items-center gap-2"><i class="fa-solid fa-layer-group text-slate-500 w-4 text-center"></i> <strong>Volume Contratado:</strong> <span class="text-slate-800 font-bold">${escapeHTML(volume)}</span></p>
                    </div>

                    <div class="space-y-1.5 pt-2 border-t border-slate-100">
                        <div class="flex justify-between text-xs font-bold text-slate-700">
                            <span>Avanço Físico Contratual</span>
                            <span class="text-slate-900">${progresso}%</span>
                        </div>
                        <div class="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                            <div class="h-3 bg-gradient-to-r from-ellenco-navy to-ellenco-blue rounded-full transition-all duration-500" style="width: ${progresso}%"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join("");
}

function abrirModalNovaObra() {
    const modal = document.getElementById("modalNovaObra");
    if (modal) {
        modal.classList.remove("hidden");
        modal.classList.add("flex");
    }
}

function fecharModalNovaObra() {
    const modal = document.getElementById("modalNovaObra");
    if (modal) {
        modal.classList.add("hidden");
        modal.classList.remove("flex");
    }
}

async function salvarNovaObra(e) {
    e.preventDefault();
    const progresso = parseFloat(document.getElementById("novaObraProgresso").value) || 10;
    let status = "Em Andamento";
    if (progresso < 20) status = "Recém Iniciada";
    else if (progresso >= 80) status = "Em Fase Final";

    const nova = {
        nome: document.getElementById("novaObraNome").value.trim(),
        local: document.getElementById("novaObraLocal").value.trim(),
        eng: document.getElementById("novaObraEngenheiro").value.trim(),
        volume_total: document.getElementById("novaObraVolume").value.trim() || "10.000 un",
        progresso: progresso,
        status: status
    };

    try {
        mostrarToast("Cadastrando obra no banco de dados...", "info");
        await api.postObra(nova);
        mostrarToast("Obra cadastrada com sucesso!", "sucesso");
        fecharModalNovaObra();
        document.getElementById("formNovaObra")?.reset();
        await carregarObras();
    } catch (err) {
        mostrarToast(err.message || "Erro ao cadastrar obra.", "erro");
    }
}

window.abrirModalNovaObra = abrirModalNovaObra;
window.fecharModalNovaObra = fecharModalNovaObra;
window.salvarNovaObra = salvarNovaObra;
