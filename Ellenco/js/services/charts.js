/* ==================================================================== */
/* ELLENCO - CHARTS.JS                                                  */
/* Centralização e Renderização das Instâncias Chart.js                */
/* ==================================================================== */

const instancasGraficos = {};

function destruirGrafico(canvasId) {
    if (instancasGraficos[canvasId]) {
        instancasGraficos[canvasId].destroy();
        delete instancasGraficos[canvasId];
    }
}

const chartsService = {
    // 1. GRÁFICO DE LINHA: CURVA DE PRODUÇÃO (PLANEJADO VS REALIZADO)
    renderProducao(canvasId, apontamentos) {
        const ctx = document.getElementById(canvasId)?.getContext("2d");
        if (!ctx) return;

        destruirGrafico(canvasId);

        // Agrupa e ordena por data
        const dadosOrdenados = [...apontamentos].sort((a, b) => new Date(a.data) - new Date(b.data));
        const labels = dadosOrdenados.map(i => {
            const partes = (i.data || "").split("-");
            return partes.length === 3 ? `${partes[2]}/${partes[1]}` : i.data;
        });

        const dadosPlanejado = dadosOrdenados.map(i => parseFloat(i.planejado) || 0);
        const dadosRealizado = dadosOrdenados.map(i => parseFloat(i.realizado) || 0);

        instancasGraficos[canvasId] = new Chart(ctx, {
            type: "line",
            data: {
                labels,
                datasets: [
                    {
                        label: "Meta Planejada",
                        data: dadosPlanejado,
                        borderColor: "#94A3B8",
                        borderDash: [5, 5],
                        borderWidth: 2,
                        fill: false,
                        tension: 0.3,
                        pointRadius: 3,
                        pointBackgroundColor: "#94A3B8"
                    },
                    {
                        label: "Produção Realizada",
                        data: dadosRealizado,
                        borderColor: "#0A2342",
                        backgroundColor: "rgba(10, 35, 66, 0.08)",
                        borderWidth: 3,
                        fill: true,
                        tension: 0.3,
                        pointRadius: 5,
                        pointBackgroundColor: "#E51920",
                        pointBorderColor: "#FFFFFF",
                        pointBorderWidth: 2
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: "top",
                        labels: {
                            font: { family: "Inter", size: 11, weight: "600" },
                            usePointStyle: true,
                            boxWidth: 8
                        }
                    },
                    tooltip: {
                        backgroundColor: "#0A2342",
                        titleFont: { family: "Plus Jakarta Sans", size: 12, weight: "700" },
                        bodyFont: { family: "Inter", size: 11 },
                        padding: 10,
                        cornerRadius: 8
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { font: { family: "Inter", size: 10, weight: "500" }, color: "#64748B" }
                    },
                    y: {
                        grid: { color: "#F1F5F9" },
                        ticks: { font: { family: "Inter", size: 10, weight: "500" }, color: "#64748B" }
                    }
                }
            }
        });
    },

    // 2. GRÁFICO DONUT: STATUS DE EFICIÊNCIA DAS EQUIPES
    renderStatusEquipes(canvasId, stats) {
        const ctx = document.getElementById(canvasId)?.getContext("2d");
        if (!ctx) return;

        destruirGrafico(canvasId);

        instancasGraficos[canvasId] = new Chart(ctx, {
            type: "doughnut",
            data: {
                labels: ["Acima da Meta", "Na Meta (90-99%)", "Abaixo da Meta"],
                datasets: [
                    {
                        data: [stats.acima || 0, stats.naMeta || 0, stats.abaixo || 0],
                        backgroundColor: ["#10B981", "#3B82F6", "#E51920"],
                        borderWidth: 3,
                        borderColor: "#FFFFFF"
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: "70%",
                plugins: {
                    legend: {
                        position: "bottom",
                        labels: {
                            font: { family: "Inter", size: 10, weight: "600" },
                            usePointStyle: true,
                            boxWidth: 8,
                            padding: 12
                        }
                    },
                    tooltip: {
                        backgroundColor: "#0A2342",
                        cornerRadius: 8
                    }
                }
            }
        });
    },

    // 3. GRÁFICO DE BARRAS HORIZONTAIS: PROGRESSO DAS OBRAS
    renderObras(canvasId, obras) {
        const ctx = document.getElementById(canvasId)?.getContext("2d");
        if (!ctx) return;

        destruirGrafico(canvasId);

        const labels = obras.map(o => o.nome.length > 20 ? o.nome.substring(0, 18) + "..." : o.nome);
        const dados = obras.map(o => o.progresso || 0);

        instancasGraficos[canvasId] = new Chart(ctx, {
            type: "bar",
            data: {
                labels,
                datasets: [
                    {
                        label: "% Concluído",
                        data: dados,
                        backgroundColor: ["#0A2342", "#123F70", "#E51920", "#3B82F6"],
                        borderRadius: 6
                    }
                ]
            },
            options: {
                indexAxis: "y",
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: "#0A2342",
                        callbacks: {
                            label: (ctx) => ` Progresso: ${ctx.raw}%`
                        }
                    }
                },
                scales: {
                    x: {
                        max: 100,
                        grid: { color: "#F1F5F9" },
                        ticks: { callback: (v) => `${v}%`, font: { size: 10 } }
                    },
                    y: {
                        grid: { display: false },
                        ticks: { font: { size: 10, weight: "600" }, color: "#334155" }
                    }
                }
            }
        });
    },

    // 4. GRÁFICO DE BARRAS: VOLUME POR TIPO DE ATIVIDADE
    renderAtividades(canvasId, apontamentos) {
        const ctx = document.getElementById(canvasId)?.getContext("2d");
        if (!ctx) return;

        destruirGrafico(canvasId);

        const ativMap = {};
        apontamentos.forEach(i => {
            const ativ = i.atividade ? i.atividade.split("-")[0].trim() : "Outros";
            ativMap[ativ] = (ativMap[ativ] || 0) + (parseFloat(i.realizado) || 0);
        });

        const labels = Object.keys(ativMap);
        const dados = Object.values(ativMap);

        instancasGraficos[canvasId] = new Chart(ctx, {
            type: "bar",
            data: {
                labels,
                datasets: [
                    {
                        label: "Volume Realizado",
                        data: dados,
                        backgroundColor: "#123F70",
                        borderRadius: 6
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { backgroundColor: "#0A2342" }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { font: { size: 10, weight: "600" }, color: "#475569" }
                    },
                    y: {
                        grid: { color: "#F1F5F9" },
                        ticks: { font: { size: 10 } }
                    }
                }
            }
        });
    }
};

window.chartsService = chartsService;
