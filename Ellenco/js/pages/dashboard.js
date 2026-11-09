/* ==================================================================== */
/* ELLENCO - DASHBOARD.JS                                               */
/* Controlador do Painel Principal, KPIs, Gráficos e Clima              */
/* ==================================================================== */

let filtroAtual = { periodo: "hoje", obra: "todas" };

document.addEventListener("DOMContentLoaded", async () => {
    renderSidebar("dashboard");
    renderTopbar("Dashboard & KPIs", "Monitoramento em tempo real do planejado vs executado", true);
    verificarAutenticacao();
    aplicarPermissoesCargo();

    // Data de emissão para impressão
    const dataPrint = document.getElementById("printDataEmissao");
    if (dataPrint) {
        dataPrint.textContent = new Date().toLocaleDateString("pt-BR");
    }

    // Carrega dados principais
    await atualizarDashboard();

    // Carrega previsão meteorológica da cidade da obra
    await carregarClimaDashboard("Sorocaba");
});

// Listener acionado quando o usuário altera o filtro na Topbar
window.onFiltroGlobalAlterado = async function(filtros) {
    filtroAtual = filtros;
    await atualizarDashboard();

    // Atualiza cidade do clima de acordo com a obra
    let cidadeClima = "Sorocaba";
    if (filtros.obra.includes("Industrial")) cidadeClima = "Campinas";
    if (filtros.obra.includes("Jardim")) cidadeClima = "Votorantim";
    if (filtros.obra.includes("Aeroporto")) cidadeClima = "Ribeirão Preto";
    await carregarClimaDashboard(cidadeClima);
};

async function atualizarDashboard() {
    try {
        const [isDbOnline, databaseLabel] = await Promise.all([
            api.isOnline(),
            api.getDatabaseLabel()
        ]);
        const badgeDb = document.getElementById("badgeDbStatus");
        if (badgeDb) {
            if (isDbOnline) {
                badgeDb.innerHTML = `<span class="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span> ${escapeHTML(databaseLabel)} Conectado`;
                badgeDb.className = "font-mono text-xs font-black text-emerald-300 flex items-center gap-1.5 justify-end";
            } else {
                badgeDb.innerHTML = `<span class="h-2 w-2 rounded-full bg-amber-400"></span> Local Sync Ativo`;
                badgeDb.className = "font-mono text-xs font-black text-amber-300 flex items-center gap-1.5 justify-end";
            }
        }
        const databasePrintLabel = document.getElementById("databasePrintLabel");
        if (databasePrintLabel) {
            databasePrintLabel.textContent = isDbOnline ? databaseLabel : "Base local (modo demonstração)";
        }

        // Consultas assíncronas ao banco de dados / API
        const [kpis, apontamentos, obras] = await Promise.all([
            api.getKPIs(filtroAtual),
            api.getApontamentos(filtroAtual),
            api.getObras()
        ]);

        // 1. Atualizar Cards de KPIs
        const elMeta = document.getElementById("cardMeta");
        const elRealizado = document.getElementById("cardRealizado");
        const elEficiencia = document.getElementById("cardEficiencia");
        const elDesvio = document.getElementById("cardDesvio");
        const elProdutividade = document.getElementById("cardProdutividade");

        if (elMeta) elMeta.textContent = kpis.totalMeta.toLocaleString("pt-BR");
        if (elRealizado) elRealizado.textContent = kpis.totalRealizado.toLocaleString("pt-BR");
        if (elEficiencia) elEficiencia.textContent = `${kpis.eficiencia}%`;

        if (elDesvio) {
            const desvVal = parseFloat(kpis.desvio) || 0;
            elDesvio.textContent = `${desvVal >= 0 ? '+' : ''}${kpis.desvio}%`;
            if (desvVal >= 0) {
                elDesvio.className = "text-2xl font-black text-emerald-600";
            } else {
                elDesvio.className = "text-2xl font-black text-ellenco-red";
            }
        }

        if (elProdutividade) elProdutividade.textContent = `${kpis.produtividadeMedia} /h`;

        // 2. Renderizar Gráficos Chart.js
        chartsService.renderProducao("graficoProducao", apontamentos);
        chartsService.renderStatusEquipes("graficoEquipes", { acima: kpis.acima, naMeta: kpis.naMeta, abaixo: kpis.abaixo });
        chartsService.renderObras("graficoObras", obras);
        chartsService.renderAtividades("graficoAtividades", apontamentos);

        // 3. Renderizar Tabela Resumo das Equipes
        renderizarTabelaEquipesDashboard(apontamentos);

    } catch (err) {
        console.error("Erro ao atualizar dashboard:", err);
        mostrarToast("Erro ao carregar dados do dashboard.", "erro");
    }
}

function renderizarTabelaEquipesDashboard(dados) {
    const tbody = document.getElementById("tabelaEquipesDashboard");
    if (!tbody) return;

    if (!dados.length) {
        tbody.innerHTML = `<tr><td colspan="5" class="py-6 text-center text-xs text-slate-400">Nenhum apontamento localizado para o filtro selecionado.</td></tr>`;
        return;
    }

    const equipesMap = {};
    dados.forEach(i => {
        if (!equipesMap[i.equipe]) {
            equipesMap[i.equipe] = {
                nome: i.equipe,
                atividade: i.atividade,
                planejado: 0,
                realizado: 0
            };
        }
        equipesMap[i.equipe].planejado += (parseFloat(i.planejado) || 0);
        equipesMap[i.equipe].realizado += (parseFloat(i.realizado) || 0);
    });

    tbody.innerHTML = Object.values(equipesMap).map(eq => {
        const ef = eq.planejado > 0 ? (eq.realizado / eq.planejado) * 100 : 100;
        let badgeStatus = '';

        if (ef >= 100) {
            badgeStatus = `<span class="badge badge-success">Acima da Meta</span>`;
        } else if (ef >= 90) {
            badgeStatus = `<span class="badge badge-info">Na Meta</span>`;
        } else {
            badgeStatus = `<span class="badge badge-danger">Abaixo da Meta</span>`;
        }

        return `
            <tr class="hover:bg-slate-50 transition-colors">
                <td class="py-2.5 px-3 font-bold text-slate-900 text-xs">${escapeHTML(eq.nome)}</td>
                <td class="py-2.5 px-3 text-slate-600 text-xs truncate max-w-[180px]">${escapeHTML(eq.atividade)}</td>
                <td class="py-2.5 px-3 text-right font-semibold text-slate-600 text-xs">${eq.planejado.toLocaleString("pt-BR")}</td>
                <td class="py-2.5 px-3 text-right font-black text-slate-900 text-xs">${eq.realizado.toLocaleString("pt-BR")}</td>
                <td class="py-2.5 px-3 text-center">${badgeStatus}</td>
            </tr>
        `;
    }).join("");
}

async function carregarClimaDashboard(cidade = "Sorocaba") {
    try {
        const clima = await api.consultarClima(cidade);

        const elCidade = document.getElementById("climaCidadeNome");
        const elCond = document.getElementById("climaCondicaoTexto");
        const elTemp = document.getElementById("climaTemperatura");
        const elUmid = document.getElementById("climaUmidade");
        const elVento = document.getElementById("climaVento");
        const elProb = document.getElementById("climaProbChuva");
        const elRec = document.getElementById("climaRecomendacao");
        const elIcone = document.getElementById("climaIcone");

        if (elCidade) elCidade.textContent = `${clima.cidade} - SP`;
        if (elCond) elCond.textContent = clima.condicaoTexto;
        if (elTemp) elTemp.textContent = `${clima.temperatura}°C`;
        if (elUmid) elUmid.textContent = `${clima.umidade}%`;
        if (elVento) elVento.textContent = `${clima.vento} km/h`;
        if (elProb) elProb.textContent = `${clima.probChuva}%`;
        if (elRec) elRec.textContent = clima.recomendacao;
        if (elIcone) elIcone.className = clima.condicaoIcone + " text-3xl";

    } catch (e) {
        console.warn("Clima indisponível:", e);
    }
}

window.atualizarDashboard = atualizarDashboard;
window.carregarClimaDashboard = carregarClimaDashboard;
