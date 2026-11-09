/* ==================================================================== */
/* ELLENCO - APROVACOES.JS                                              */
/* Controlador do Painel de Aprovação e Gestão de Usuários             */
/* ==================================================================== */

document.addEventListener("DOMContentLoaded", async () => {
    renderSidebar("aprovacoes");
    renderTopbar("Gestão de Acessos", "Aprovação e controle de colaboradores cadastrados", false);
    verificarAutenticacao();
    aplicarPermissoesCargo();

    await carregarUsuarios();
});

async function carregarUsuarios() {
    try {
        const usuarios = await api.getUsuarios();
        atualizarMetricasUsuarios(usuarios);
        renderizarTabelaUsuarios(usuarios);
    } catch (e) {
        console.error("Erro ao carregar usuários:", e);
        mostrarToast("Erro ao carregar lista de usuários.", "erro");
    }
}

function atualizarMetricasUsuarios(lista) {
    let pendentes = 0;
    let aprovados = 0;

    lista.forEach(u => {
        if (u.status === 'pendente') pendentes++;
        else if (u.status === 'aprovado') aprovados++;
    });

    const elPen = document.getElementById("statPendentes");
    const elAp = document.getElementById("statAprovados");
    const elTot = document.getElementById("statTotalUsuarios");

    if (elPen) elPen.textContent = pendentes;
    if (elAp) elAp.textContent = aprovados;
    if (elTot) elTot.textContent = lista.length;
}

function renderizarTabelaUsuarios(lista) {
    const tbody = document.getElementById("tabelaAprovacoes");
    if (!tbody) return;

    if (!lista.length) {
        tbody.innerHTML = `<tr><td colspan="8" class="p-8 text-center text-xs text-slate-400">Nenhum colaborador encontrado no banco de dados.</td></tr>`;
        return;
    }

    const usuarioAtual = getUsuarioLogado();

    tbody.innerHTML = lista.map(u => {
        let badgeStatus = '';
        if (u.status === 'aprovado') {
            badgeStatus = `<span class="badge badge-success"><i class="fa-solid fa-circle-check"></i> Aprovado</span>`;
        } else if (u.status === 'pendente') {
            badgeStatus = `<span class="badge badge-warning"><i class="fa-solid fa-clock"></i> Pendente</span>`;
        } else {
            badgeStatus = `<span class="badge badge-danger"><i class="fa-solid fa-ban"></i> Recusado</span>`;
        }

        const dataFmt = formatarDataSolicitacao(u.criado_em);

        let botoesAcao = '';
        if (u.status === 'pendente') {
            botoesAcao = `
                <div class="flex items-center justify-center gap-1.5">
                    <button onclick="aprovarUsuario(${u.id}, this.dataset.nome)" data-nome="${escapeHTML(u.nome)}" class="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition-colors cursor-pointer" title="Aprovar Acesso">
                        <i class="fa-solid fa-check mr-1"></i> Aprovar
                    </button>
                    <button onclick="rejeitarUsuario(${u.id}, this.dataset.nome)" data-nome="${escapeHTML(u.nome)}" class="px-2.5 py-1 rounded-lg bg-red-100 hover:bg-red-200 text-ellenco-red font-bold text-[11px] transition-colors cursor-pointer" title="Recusar Solicitação">
                        <i class="fa-solid fa-xmark mr-1"></i> Recusar
                    </button>
                </div>
            `;
        } else {
            botoesAcao = `<span class="text-[11px] text-slate-400 font-semibold">${u.aprovado_por ? 'Por ' + escapeHTML(u.aprovado_por) : 'Liberado'}</span>`;
        }

        return `
            <tr class="hover:bg-slate-50 transition-colors">
                <td class="font-bold text-slate-900 text-xs">${escapeHTML(u.nome)}</td>
                <td class="font-mono font-semibold text-slate-700 text-xs">${escapeHTML(u.re)}</td>
                <td class="text-slate-600 text-xs">${escapeHTML(u.email)}</td>
                <td class="text-slate-800 font-medium text-xs">${escapeHTML(u.cargo_label || u.cargo)}</td>
                <td class="text-slate-600 text-xs truncate max-w-[160px]">${escapeHTML(u.obra)}</td>
                <td class="text-slate-500 text-xs">${dataFmt}</td>
                <td class="text-center">${badgeStatus}</td>
                <td class="text-center">${botoesAcao}</td>
            </tr>
        `;
    }).join("");
}

function formatarDataSolicitacao(valor) {
    if (!valor) return "-";

    const dataTexto = String(valor).trim();
    const partesData = dataTexto.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!partesData) return "-";

    const [, ano, mes, dia] = partesData;
    if (/^\d{4}-\d{2}-\d{2}$/.test(dataTexto)) return `${dia}/${mes}/${ano}`;

    const data = new Date(dataTexto);
    if (Number.isNaN(data.getTime())) return `${dia}/${mes}/${ano}`;

    return new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo" }).format(data);
}

async function aprovarUsuario(id, nome) {
    const usuarioLogado = getUsuarioLogado();
    try {
        mostrarToast(`Aprovando acesso de ${nome}...`, "info");
        await api.atualizarStatusUsuario(id, 'aprovado', usuarioLogado.nome);
        mostrarToast(`Acesso de ${nome} aprovado com sucesso!`, "sucesso");
        await carregarUsuarios();
    } catch (e) {
        mostrarToast(e.message || "Erro ao aprovar usuário.", "erro");
    }
}

async function rejeitarUsuario(id, nome) {
    const motivo = prompt(`Informe o motivo da recusa do acesso para ${nome}:`, "Cadastro inconsistente com a equipe");
    if (motivo === null) return;

    try {
        mostrarToast(`Atualizando status de ${nome}...`, "info");
        await api.atualizarStatusUsuario(id, 'rejeitado', '', motivo);
        mostrarToast(`Solicitação de ${nome} recusada.`, "warning");
        await carregarUsuarios();
    } catch (e) {
        mostrarToast(e.message || "Erro ao atualizar status.", "erro");
    }
}

window.aprovarUsuario = aprovarUsuario;
window.rejeitarUsuario = rejeitarUsuario;
