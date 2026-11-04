const express = require("express");
const path = require("path");
require("dotenv").config();

let GoogleGenAI = null;
try {
    const genaiPkg = require("@google/genai");
    GoogleGenAI = genaiPkg.GoogleGenAI;
} catch (e) {
    console.warn("GenAI SDK não carregado:", e.message);
}

const db = require("../database/db");

const app = express();
const PORT = process.env.PORT || 3001;

// ========================================
// GEMINI SDK
// ========================================
let ai = null;
if (GoogleGenAI && process.env.GEMINI_API_KEY) {
    try {
        ai = new GoogleGenAI({
            apiKey: process.env.GEMINI_API_KEY
        });
    } catch (e) {
        console.warn("Erro ao instanciar Gemini:", e.message);
    }
}

// ========================================
// CONFIGURAÇÕES
// ========================================
app.use(express.json());
app.use(express.static(__dirname));

// ========================================
// TESTE DO SERVIDOR
// ========================================
app.get("/teste", (req, res) => {
    res.json({
        status: "OK",
        mensagem: "Node.js e Assistente Ellenco estão funcionando com SQLite!",
        banco: "SQLite 3 WAL"
    });
});

// ========================================
// API CHAT (INTEGRADA AO SQLITE)
// ========================================
app.post("/api/chat", async (req, res) => {
    try {
        const { mensagem, historico, usuarioLogado } = req.body;

        if (!mensagem || !mensagem.trim()) {
            return res.status(400).json({ erro: "Mensagem não informada." });
        }

        console.log("Mensagem recebida no Assistente:", mensagem);

        // 1. Obter snapshot em tempo real do banco de dados SQLite
        const contexto = db.obterContextoParaIA(usuarioLogado || { nome: "Carlos Silva", cargo: "Encarregado de Equipe" });
        const kpis = contexto.kpisGerais;
        const bdp = contexto.ultimosApontamentos;
        const obras = contexto.obras;
        const equipes = contexto.equipes;
        const frota = contexto.frota;
        const ocorrencias = contexto.ocorrenciasERecorrencias;

        // 2. Se Gemini estiver disponível e API key válida:
        if (ai && process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.startsWith("AQ.")) {
            try {
                const systemPrompt = `
Você é o Assistente Inteligente Oficial da plataforma Ellenco Construções e Pavimentação.
Responda em português brasileiro de forma profissional, direta e objetiva.

DADOS REAIS EM TEMPO REAL DO BANCO DE DADOS (SQLITE):
${JSON.stringify(contexto, null, 2)}
`;
                const response = await ai.models.generateContent({
                    model: "gemini-2.5-flash",
                    contents: mensagem,
                    config: { systemInstruction: systemPrompt }
                });

                if (response && response.text) {
                    return res.json({ resposta: response.text });
                }
            } catch (geminiErr) {
                console.warn("Fallback Gemini -> Motor Analítico SQLite:", geminiErr.message);
            }
        }

        // 3. Motor Analítico Baseado no SQLite
        const msg = mensagem.toLowerCase().trim();

        // Gráfico
        if (msg.includes("gráfico") || msg.includes("grafico") || msg.includes("dashboard")) {
            const labels = equipes.map(e => e.nome);
            const realizados = equipes.map(e => e.realizadoAcumulado);
            return res.json({
                resposta: `Aqui está o gráfico comparativo de produção acumulada por equipe de campo:\n\n- **Equipes Analisadas**: ${equipes.length} frentes ativas.\n\n\`\`\`json\n{\n  "tipo": "bar",\n  "titulo": "Produção Acumulada por Equipe",\n  "labels": ${JSON.stringify(labels)},\n  "valores": ${JSON.stringify(realizados)},\n  "unidade": "Volume"\n}\n\`\`\``
            });
        }

        // Últimos BDPs
        if (msg.includes("último") || msg.includes("ultimo") || msg.includes("recente") || msg.includes("novo")) {
            const ult = bdp[0];
            if (!ult) return res.json({ resposta: "Nenhum apontamento registrado no banco de dados." });
            let texto = `📋 **Último Boletim Diário de Produção (BDP) Registrado no SQLite:**\n\n`;
            texto += `- **Protocolo**: \`${ult.protocolo}\`\n`;
            texto += `- **Data**: ${ult.data} (${ult.turno})\n`;
            texto += `- **Obra**: ${ult.obra}\n`;
            texto += `- **Equipe**: ${ult.equipe} (Líder: ${ult.encarregado})\n`;
            texto += `- **Atividade**: ${ult.atividade}\n`;
            texto += `- **Meta**: ${ult.planejado} | **Realizado**: ${ult.realizado}\n`;
            texto += `- **Desvio**: **${ult.desvioPercentual}** (Eficiência: ${ult.eficiencia})\n`;
            if (ult.parada && ult.parada !== 'Nenhum') texto += `- **Ocorrência/Parada**: ⚠️ *${ult.parada}*\n`;
            if (ult.observacao) texto += `- **Observações**: _"${ult.observacao}"_\n`;
            return res.json({ resposta: texto });
        }

        // Contagem / Quantidade
        if (msg.includes("quantos") || msg.includes("total") || msg.includes("quantidade")) {
            return res.json({
                resposta: `Atualmente temos **${kpis.totalRegistros} boletins de produção (BDP)** gravados no banco de dados SQLite.\n\n- **Meta Total**: ${kpis.totalMeta.toLocaleString("pt-BR")} un\n- **Realizado Total**: ${kpis.totalRealizado.toLocaleString("pt-BR")} un\n- **Eficiência Média**: ${kpis.eficiencia}%\n- **Desvio Operacional**: ${kpis.desvio}%`
            });
        }

        // Problemas / Ocorrências
        if (msg.includes("problema") || msg.includes("ocorrencia") || msg.includes("ocorrência") || msg.includes("parada") || msg.includes("falha")) {
            if (!ocorrencias.length) {
                return res.json({ resposta: "Não constam registros de paralisações ou desvios críticos recentes no banco de dados." });
            }
            let texto = `⚠️ **Ocorrências Registradas no SQLite:**\n\n`;
            ocorrencias.forEach(o => {
                texto += `• **${o.data} - ${o.obra} (${o.equipe})**:\n`;
                if (o.motivoParada && o.motivoParada !== 'Nenhum') texto += `  - Motivo: **${o.motivoParada}**\n`;
                if (o.detalhes) texto += `  - Detalhes: _"${o.detalhes}"_\n`;
                texto += `  - Desvio: **${o.desvio}**\n\n`;
            });
            return res.json({ resposta: texto });
        }

        // Frota / Máquinas
        if (msg.includes("equipamento") || msg.includes("frota") || msg.includes("maquina") || msg.includes("máquina") || msg.includes("manutenção")) {
            let texto = `🚜 **Controle de Frota no SQLite:**\n\n`;
            texto += `- **Total de Equipamentos**: ${frota.total}\n`;
            texto += `- **Operando**: ${frota.operando}\n`;
            if (frota.emManutencao.length) {
                texto += `- **Em Manutenção**: ${frota.emManutencao.join(", ")}\n`;
            } else {
                texto += `- **Em Manutenção**: Nenhuma máquina parada.\n`;
            }
            return res.json({ resposta: texto });
        }

        // Resumo Geral / KPIs
        return res.json({
            resposta: `📊 **Resumo de Produção (Banco de Dados SQLite):**\n\n- **Boletins Registrados**: ${kpis.totalRegistros}\n- **Volume Realizado**: ${kpis.totalRealizado.toLocaleString("pt-BR")} un\n- **Eficiência Geral**: ${kpis.eficiencia}%\n- **Desvio Operacional**: ${parseFloat(kpis.desvio) >= 0 ? '+' : ''}${kpis.desvio}%\n- **Contratos Ativos**: ${obras.length}\n- **Equipes de Campo**: ${equipes.length}`
        });

    } catch (error) {
        console.error("Erro no chat:", error);
        res.status(500).json({
            erro: "Erro ao processar mensagem com a IA.",
            detalhe: error.message
        });
    }
});

// ========================================
// SERVIDOR
// ========================================
app.listen(PORT, () => {
    console.log(`Assistente Ellenco (Standalone) rodando em http://localhost:${PORT}`);
});