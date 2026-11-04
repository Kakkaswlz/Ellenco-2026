/* ==================================================================== */
/* ELLENCO - HISTORICO.JS                                               */
/* Controlador da Auditoria, Filtros, Detalhes e Exportações            */
/* ==================================================================== */

let todosApontamentos = [];

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
        todosApontamentos = await api.getApontamentos();
        renderizarHistorico();
    } catch (err) {
        console.error("Erro ao carregar histórico:", err);
        mostrarToast("Erro ao carregar apontamentos.", "erro");
    }
}

function renderizarHistorico() {
    const filtroTexto = document.getElementById("filtroHistorico")?.value.toLowerCase().trim() || "";
    const filtroStatus = document.getElementById("filtroStatusHistorico")?.value || "todos";
    const filtroObra = document.getElementById("filtroObraHistorico")?.value || "todas";

    let lista = todosApontamentos.filter(i => {
        const okTexto = (i.equipe || "").toLowerCase().includes(filtroTexto) ||
                        (i.obra || "").toLowerCase().includes(filtroTexto) ||
                        (i.atividade || "").toLowerCase().includes(filtroTexto) ||
                        (i.encarregado || "").toLowerCase().includes(filtroTexto) ||
                        (i.protocolo || "").toLowerCase().includes(filtroTexto);

        const okObra = (filtroObra === "todas" || i.obra === filtroObra);

        let okStatus = true;
        const desv = parseFloat(i.desvio) || 0;
        if (filtroStatus === "acima") okStatus = (desv >= -10);
        else if (filtroStatus === "critico") okStatus = (desv < -10);

        return okTexto && okObra && okStatus;
    });

    renderizarTabelaHistorico(lista);
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
                        <button onclick="abrirModalDetalhes(${item.id})" class="p-1.5 rounded-lg text-slate-500 hover:text-ellenco-navy hover:bg-slate-100 transition-colors cursor-pointer" title="Ver Detalhes">
                            <i class="fa-solid fa-eye text-xs"></i>
                        </button>
                        <button onclick="excluirApontamento(${item.id})" class="p-1.5 rounded-lg text-slate-400 hover:text-ellenco-red hover:bg-red-50 transition-colors cursor-pointer" title="Excluir Registro">
                            <i class="fa-solid fa-trash text-xs"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join("");
}

function abrirModalDetalhes(id) {
    const item = todosApontamentos.find(i => i.id === id);
    if (!item) return;

    const modal = document.getElementById("modalDetalhesApontamento");
    const container = document.getElementById("conteudoModalDetalhes");
    const elProt = document.getElementById("modalDetalheProtocolo");

    if (elProt) elProt.textContent = item.protocolo || `BDP-2026-${item.id}`;

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
        mostrarToast("Registro removido do banco com sucesso.", "info");
        await carregarHistorico();
    } catch (e) {
        mostrarToast("Erro ao remover registro.", "erro");
    }
}

// EXPORTAÇÕES EXCEL E PDF
async function exportarExcel() {
    if (!todosApontamentos.length) {
        mostrarToast("Nenhum dado disponível para exportação.", "warning");
        return;
    }

    const dadosExcel = todosApontamentos.map(i => ({
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
window.abrirModalDetalhes = abrirModalDetalhes;
window.fecharModalDetalhes = fecharModalDetalhes;
window.excluirApontamento = excluirApontamento;
window.exportarExcel = exportarExcel;
window.exportarPDF = exportarPDF;
