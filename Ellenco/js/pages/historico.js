/* ==================================================================== */
/* ELLENCO - HISTORICO.JS                                               */
/* Controlador da Auditoria, Filtros Dinâmicos, Detalhes e Exportações   */
/* ==================================================================== */

let todosApontamentos = [];
let listaFiltradaAtual = [];

document.addEventListener("DOMContentLoaded", async () => {
    renderSidebar("historico");
    renderTopbar("Histórico & Auditoria", "Auditoria completa e exportações de relatórios gerenciais", false);
    verificarAutenticacao();
    aplicarPermissoesCargo();

    const dataPrint = document.getElementById("printDataEmissao");
    if (dataPrint) {
        dataPrint.textContent = new Date().toLocaleDateString("pt-BR");
    }

    await carregarHistorico();
});

async function carregarHistorico() {
    try {
        const [apontamentos, obras, atividades] = await Promise.all([
            api.getApontamentos(),
            api.getObras().catch(() => []),
            api.getAtividades().catch(() => [])
        ]);

        todosApontamentos = Array.isArray(apontamentos) ? apontamentos : [];

        // Preenche os selects dinamicamente direto do banco de dados
        popularFiltrosDinamicos(obras, atividades);

        renderizarHistorico();
    } catch (err) {
        console.error("Erro ao carregar histórico:", err);
        mostrarToast("Erro ao carregar apontamentos.", "erro");
    }
}

/**
 * Preenche os selects de Obras e Atividades a partir do banco de dados
 * e de qualquer registro presente nos apontamentos.
 */
function popularFiltrosDinamicos(obrasCadastradas = [], atividadesCadastradas = []) {
    // 1. OBRAS
    const selectObra = document.getElementById("filtroObraHistorico");
    if (selectObra) {
        const valorAtual = selectObra.value || "todas";
        const conjuntoObras = new Set();

        if (Array.isArray(obrasCadastradas)) {
            obrasCadastradas.forEach(o => {
                const nome = (typeof o === "string" ? o : o.nome || "").trim();
                if (nome) conjuntoObras.add(nome);
            });
        }
        todosApontamentos.forEach(a => {
            if (a.obra && a.obra.trim()) conjuntoObras.add(a.obra.trim());
        });

        const obrasOrdenadas = Array.from(conjuntoObras).sort((a, b) => a.localeCompare(b, "pt-BR"));

        selectObra.innerHTML = `<option value="todas">Todas as Obras</option>` +
            obrasOrdenadas.map(o => `<option value="${escaparHtml(o)}">${escaparHtml(o)}</option>`).join("");

        if (conjuntoObras.has(valorAtual)) {
            selectObra.value = valorAtual;
        } else {
            selectObra.value = "todas";
        }
    }

    // 2. ATIVIDADES
    const selectAtiv = document.getElementById("filtroAtividadeHistorico");
    if (selectAtiv) {
        const valorAtual = selectAtiv.value || "todas";
        const conjuntoAtividades = new Set();

        if (Array.isArray(atividadesCadastradas)) {
            atividadesCadastradas.forEach(a => {
                const nome = (typeof a === "string" ? a : a.nome || "").trim();
                if (nome) conjuntoAtividades.add(nome);
            });
        }
        todosApontamentos.forEach(a => {
            if (a.atividade && a.atividade.trim()) conjuntoAtividades.add(a.atividade.trim());
        });

        const atividadesOrdenadas = Array.from(conjuntoAtividades).sort((a, b) => a.localeCompare(b, "pt-BR"));

        selectAtiv.innerHTML = `<option value="todas">Todas as Atividades</option>` +
            atividadesOrdenadas.map(a => `<option value="${escaparHtml(a)}">${escaparHtml(a)}</option>`).join("");

        if (conjuntoAtividades.has(valorAtual)) {
            selectAtiv.value = valorAtual;
        } else {
            selectAtiv.value = "todas";
        }
    }
}

function escaparHtml(texto) {
    return String(texto).replace(/[&<>"']/g, c => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
}

function renderizarHistorico() {
    const filtroTexto = document.getElementById("filtroHistorico")?.value.toLowerCase().trim() || "";
    const filtroStatus = document.getElementById("filtroStatusHistorico")?.value || "todos";
    const filtroObra = document.getElementById("filtroObraHistorico")?.value || "todas";
    const filtroAtividade = document.getElementById("filtroAtividadeHistorico")?.value || "todas";
    const filtroDataDe = document.getElementById("filtroDataDeHistorico")?.value || "";
    const filtroDataAte = document.getElementById("filtroDataAteHistorico")?.value || "";

    listaFiltradaAtual = todosApontamentos.filter(i => {
        // Busca textual livre
        const okTexto = !filtroTexto ||
            (i.equipe || "").toLowerCase().includes(filtroTexto) ||
            (i.obra || "").toLowerCase().includes(filtroTexto) ||
            (i.atividade || "").toLowerCase().includes(filtroTexto) ||
            (i.encarregado || "").toLowerCase().includes(filtroTexto) ||
            (i.protocolo || "").toLowerCase().includes(filtroTexto) ||
            (i.obs || "").toLowerCase().includes(filtroTexto);

        // Filtro de Obra
        const okObra = (filtroObra === "todas" || (i.obra || "").trim() === filtroObra.trim());

        // Filtro de Atividade
        const okAtividade = (filtroAtividade === "todas" || (i.atividade || "").trim() === filtroAtividade.trim());

        // Filtro de Desempenho / Meta
        let okStatus = true;
        const desv = parseFloat(i.desvio) || 0;
        if (filtroStatus === "acima") okStatus = (desv >= -10);
        else if (filtroStatus === "critico") okStatus = (desv < -10);

        // Filtros de Data
        let okDataDe = true;
        let okDataAte = true;
        if (filtroDataDe) {
            okDataDe = Boolean(i.data && i.data >= filtroDataDe);
        }
        if (filtroDataAte) {
            okDataAte = Boolean(i.data && i.data <= filtroDataAte);
        }

        return okTexto && okObra && okAtividade && okStatus && okDataDe && okDataAte;
    });

    renderizarTabelaHistorico(listaFiltradaAtual);
}

function limparFiltrosHistorico() {
    const fTexto = document.getElementById("filtroHistorico");
    const fStatus = document.getElementById("filtroStatusHistorico");
    const fObra = document.getElementById("filtroObraHistorico");
    const fAtiv = document.getElementById("filtroAtividadeHistorico");
    const fDataDe = document.getElementById("filtroDataDeHistorico");
    const fDataAte = document.getElementById("filtroDataAteHistorico");

    if (fTexto) fTexto.value = "";
    if (fStatus) fStatus.value = "todos";
    if (fObra) fObra.value = "todas";
    if (fAtiv) fAtiv.value = "todas";
    if (fDataDe) fDataDe.value = "";
    if (fDataAte) fDataAte.value = "";

    renderizarHistorico();
}

function renderizarTabelaHistorico(lista) {
    const tbody = document.getElementById("tabelaHistorico");
    const contador = document.getElementById("contadorRegistrosHistorico");
    if (!tbody) return;

    if (contador) {
        contador.textContent = `Exibindo ${lista.length} registros auditados`;
    }

    if (!lista.length) {
        tbody.innerHTML = `<tr><td colspan="10" class="p-8 text-center text-xs text-slate-400">Nenhum apontamento localizado com os filtros aplicados.</td></tr>`;
        return;
    }

    tbody.innerHTML = lista.map(item => {
        const dataFmt = item.data ? item.data.split("-").reverse().join("/") : "-";
        const desv = parseFloat(item.desvio) || 0;
        let badgeStatus = '';

        if (desv >= 0) {
            badgeStatus = `<span class="badge badge-success"><i class="fa-solid fa-circle-check"></i> Superada</span>`;
        } else if (desv >= -10) {
            badgeStatus = `<span class="badge badge-warning"><i class="fa-solid fa-triangle-exclamation"></i> Atenção</span>`;
        } else {
            badgeStatus = `<span class="badge badge-danger"><i class="fa-solid fa-circle-xmark"></i> Crítico</span>`;
        }

        const protocolo = item.protocolo || `BDP-2026-${item.id}`;

        return `
            <tr class="hover:bg-slate-50 transition-colors">
                <td class="font-semibold text-slate-700 text-xs">${dataFmt}</td>
                <td class="font-mono font-bold text-slate-800 text-[11px]">${protocolo}</td>
                <td class="font-bold text-slate-900 text-xs">${item.obra}</td>
                <td class="text-slate-700 text-xs">
                    <span class="font-semibold block">${item.equipe}</span>
                    <span class="text-[10px] text-slate-400">${item.encarregado}</span>
                </td>
                <td class="text-slate-600 text-xs truncate max-w-[160px]">${item.atividade}</td>
                <td class="text-right font-semibold text-slate-600 text-xs">${Number(item.planejado).toLocaleString("pt-BR")} ${item.unidade || ''}</td>
                <td class="text-right font-black text-slate-900 text-xs">${Number(item.realizado).toLocaleString("pt-BR")} ${item.unidade || ''}</td>
                <td class="text-right font-black text-xs ${desv >= 0 ? 'text-emerald-600' : 'text-ellenco-red'}">${desv >= 0 ? '+' : ''}${desv.toFixed(1)}%</td>
                <td class="text-center">${badgeStatus}</td>
                <td class="text-center no-print">
                    <div class="flex items-center justify-center gap-1.5">
                        <button onclick="abrirModalDetalhes(${item.id})" class="p-1.5 text-slate-500 hover:text-ellenco-blue hover:bg-slate-100 rounded-lg transition-colors cursor-pointer" title="Ver Detalhes">
                            <i class="fa-solid fa-eye text-xs"></i>
                        </button>
                        <button onclick="excluirApontamento(${item.id})" class="p-1.5 text-slate-400 hover:text-ellenco-red hover:bg-red-50 rounded-lg transition-colors cursor-pointer" title="Excluir Registro">
                            <i class="fa-solid fa-trash-can text-xs"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join("");
}

function abrirModalDetalhes(id) {
    const item = todosApontamentos.find(i => String(i.id) === String(id));
    if (!item) return;

    const modal = document.getElementById("modalDetalhesApontamento");
    const protocoloElem = document.getElementById("modalDetalheProtocolo");
    const container = document.getElementById("conteudoModalDetalhes");

    if (protocoloElem) protocoloElem.textContent = item.protocolo || `BDP-2026-${item.id}`;

    const dataFmt = item.data ? item.data.split("-").reverse().join("/") : "-";
    const desv = parseFloat(item.desvio) || 0;

    container.innerHTML = `
        <div class="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
            <div><strong>Obra:</strong> <span class="block text-slate-900 font-semibold">${item.obra}</span></div>
            <div><strong>Data & Turno:</strong> <span class="block text-slate-900 font-semibold">${dataFmt} (${item.turno || 'Diurno'})</span></div>
            <div><strong>Equipe:</strong> <span class="block text-slate-900 font-semibold">${item.equipe}</span></div>
            <div><strong>Encarregado:</strong> <span class="block text-slate-900 font-semibold">${item.encarregado}</span></div>
        </div>

        <div class="p-3.5 rounded-2xl border border-slate-200 space-y-2">
            <p><strong>Atividade:</strong> ${item.atividade}</p>
            <div class="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
                <div><span class="text-[10px] text-slate-400 block">Meta</span><strong class="text-sm font-bold text-slate-800">${item.planejado} ${item.unidade}</strong></div>
                <div><span class="text-[10px] text-slate-400 block">Realizado</span><strong class="text-sm font-black text-slate-900">${item.realizado} ${item.unidade}</strong></div>
                <div><span class="text-[10px] text-slate-400 block">Desvio</span><strong class="text-sm font-black ${desv >= 0 ? 'text-emerald-600' : 'text-ellenco-red'}">${desv >= 0 ? '+' : ''}${desv.toFixed(1)}%</strong></div>
            </div>
        </div>

        <div class="grid grid-cols-2 gap-3 text-slate-600">
            <div><strong>Clima:</strong> ${item.clima || 'Ensolarado'}</div>
            <div><strong>Paradas:</strong> ${item.parada || 'Nenhuma'}</div>
            <div><strong>Jornada:</strong> ${item.horas || 8.5}h</div>
            <div><strong>Efetivo:</strong> ${item.efetivo || 14} pessoas</div>
        </div>

        ${item.obs ? `
            <div class="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-slate-700">
                <strong>Observações:</strong>
                <p class="mt-1 text-[11px] leading-relaxed">${item.obs}</p>
            </div>
        ` : ''}
    `;

    if (modal) {
        modal.classList.remove("hidden");
        modal.classList.add("flex");
    }
}

function fecharModalDetalhes() {
    const modal = document.getElementById("modalDetalhesApontamento");
    if (modal) {
        modal.classList.add("hidden");
        modal.classList.remove("flex");
    }
}

async function excluirApontamento(id) {
    if (!confirm("Deseja realmente remover este registro de apontamento da auditoria?")) return;
    try {
        await api.deleteApontamento(id);
        mostrarToast("Registro removido com sucesso.", "info");
        await carregarHistorico();
    } catch (e) {
        mostrarToast(e.message || "Erro ao remover registro.", "erro");
    }
}

// EXPORTAÇÕES EXCEL E PDF (Respeitam a seleção filtrada)
async function exportarExcel() {
    const dadosOrigem = (listaFiltradaAtual && listaFiltradaAtual.length) ? listaFiltradaAtual : todosApontamentos;

    if (!dadosOrigem.length) {
        mostrarToast("Nenhum dado disponível para exportação.", "warning");
        return;
    }

    const dadosExcel = dadosOrigem.map(i => ({
        Protocolo: i.protocolo || `BDP-${i.id}`,
        Data: i.data,
        Turno: i.turno,
        Obra: i.obra,
        Equipe: i.equipe,
        Encarregado: i.encarregado,
        Atividade: i.atividade,
        Unidade: i.unidade,
        "Meta Planejada": i.planejado,
        "Produção Real": i.realizado,
        "Desvio %": i.desvio,
        "Eficiência %": i.eficiencia,
        "Produtividade/h": i.produtividade,
        Clima: i.clima,
        Ocorrência: i.parada,
        Observações: i.obs
    }));

    const ws = XLSX.utils.json_to_sheet(dadosExcel);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Auditoria_Ellenco");
    XLSX.writeFile(wb, `Auditoria_Producao_Ellenco_${new Date().toISOString().split("T")[0]}.xlsx`);
    mostrarToast("Planilha Excel exportada com sucesso!", "sucesso");
}

function exportarPDF() {
    mostrarToast("Gerando relatório PDF...", "info");
    const elem = document.querySelector("main");
    const opt = {
        margin: [10, 10, 10, 10],
        filename: `Auditoria_Producao_Ellenco_${new Date().toISOString().split("T")[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
    };
    html2pdf().set(opt).from(elem).save().then(() => {
        mostrarToast("PDF gerado com sucesso!", "sucesso");
    });
}

window.renderizarHistorico = renderizarHistorico;
window.limparFiltrosHistorico = limparFiltrosHistorico;
window.abrirModalDetalhes = abrirModalDetalhes;
window.fecharModalDetalhes = fecharModalDetalhes;
window.excluirApontamento = excluirApontamento;
window.exportarExcel = exportarExcel;
window.exportarPDF = exportarPDF;