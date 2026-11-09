/**
 * ====================================================================
 * ELLENCO - SERVIDOR HTTP, REST API & AGENTE DE IA (Node.js)
 * Servidor completo de alta performance integrado ao SQLite e Gemini
 * ====================================================================
 */

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const db = require('./database/db');

// Carrega dotenv do Assistente-Ellenco ou raiz
try {
    const dotenv = require(path.join(__dirname, 'Assistente-Ellenco', 'node_modules', 'dotenv'));
    dotenv.config({ path: path.join(__dirname, 'Assistente-Ellenco', '.env') });
    dotenv.config({ path: path.join(__dirname, '.env') });
} catch (e) {
    console.warn('Dotenv n├úo carregado, usando vari├íveis de ambiente do sistema.');
}

// Configuração dos Provedores de IA (DeepSeek / Gemini)
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
let genAI = null;
try {
    const { GoogleGenAI } = require('@google/genai');
    if (GEMINI_API_KEY) {
        genAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    }
} catch (e) {
    // SDK do Gemini opcional
}

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'Ellenco');

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf'
};

function sendJSON(res, data, statusCode = 200) {
    res.writeHead(statusCode, {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    res.end(JSON.stringify(data));
}

function parseBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
            if (body.length > 1e7) {
                req.connection.destroy();
                reject(new Error('Payload too large'));
            }
        });
        req.on('end', () => {
            if (!body) return resolve({});
            try {
                resolve(JSON.parse(body));
            } catch (err) {
                resolve({});
            }
        });
        req.on('error', reject);
    });
}

// Função auxiliar para normalizar texto (remove acentos para comparação 100% infalível)
function normalizarTexto(t) {
    return String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

/**
 * Motor Analítico Inteligente de Consulta Local ao Banco de Dados (SQLite / PostgreSQL)
 * Responde com 100% de fidelidade aos dados reais mesmo se as APIs externas de IA estiverem offline.
 */
async function processarConsultaAnaliticaLocal(mensagem, contexto, historico = []) {
    const msg = mensagem.toLowerCase().trim();
    const msgNorm = normalizarTexto(mensagem);

    const kpis = contexto.kpisGerais || { totalRegistros: 0, totalMeta: 0, totalRealizado: 0, eficiencia: 0, desvio: 0, acima: 0, naMeta: 0, abaixo: 0, totalHoras: 0, produtividadeMedia: '0' };
    const bdp = contexto.ultimosApontamentos || [];
    const obras = contexto.obras || [];
    const equipes = contexto.equipes || [];
    const frota = contexto.frota || { total: 0, operacionais: 0, emManutencao: [] };
    const ocorrencias = contexto.ocorrenciasERecorrencias || [];

    // 0. SAUDAÇÕES E MENSAGENS SOCIAIS (Bom dia, Boa tarde, Olá, etc.)
    if (msgNorm === 'bom dia' || msgNorm.startsWith('bom dia') ||
        msgNorm === 'boa tarde' || msgNorm.startsWith('boa tarde') ||
        msgNorm === 'boa noite' || msgNorm.startsWith('boa noite') ||
        msgNorm === 'ola' || msgNorm === 'oi' || msgNorm === 'opa' || msgNorm === 'ola!') {
        const saudacao = msgNorm.includes('tarde') ? 'Boa tarde' : (msgNorm.includes('noite') ? 'Boa noite' : 'Bom dia');
        return {
            resposta: `${saudacao}! Sou o **Assistente Inteligente da Ellenco**.\n\nEstou conectado em tempo real aos dados da empresa. Temos **${kpis.totalRegistros} boletins registrados**, com **${obras.length} contratos ativos** e **${equipes.length} equipes de campo** em operação.\n\nComo posso ajudar você hoje?\n- *"Gerar gráfico de produção diária"*\n- *"Qual é a situação das obras?"*\n- *"Como está o desempenho das equipes?"*\n- *"Quais máquinas estão em manutenção?"*`
        };
    }

    // 1. SOLICITAÇÃO DE GRÁFICO / DASHBOARD
    if (msgNorm.includes('grafico') || msgNorm.includes('dashboard') || msgNorm.includes('visualizacao') || msgNorm.includes('curva') || msgNorm.includes('graficos')) {
        if (msgNorm.includes('equipe') || msgNorm.includes('desempenho')) {
            const labels = equipes.map(e => e.nome);
            const realizados = equipes.map(e => e.realizadoAcumulado);
            return {
                resposta: `Aqui está o gráfico comparativo de produção acumulada por equipe de campo:\n\n- **Equipes Analisadas**: ${equipes.length} frentes ativas.\n- **Maior Volume**: ${equipes[0]?.nome || 'Equipe Principal'} com ${Number(equipes[0]?.realizadoAcumulado || 0).toLocaleString('pt-BR')} unidades.\n\n\`\`\`json\n{\n  "tipo": "bar",\n  "titulo": "Produção Acumulada por Equipe",\n  "labels": ${JSON.stringify(labels)},\n  "valores": ${JSON.stringify(realizados)},\n  "unidade": "Volume Acumulado"\n}\n\`\`\``
            };
        } else if (msgNorm.includes('obra') || msgNorm.includes('contrato') || msgNorm.includes('frente')) {
            const labels = obras.map(o => (o.nome || '').replace('Rodovia ', ''));
            const progressos = obras.map(o => parseFloat(o.progresso) || 0);
            return {
                resposta: `Aqui está o gráfico de avanço físico percentual dos contratos:\n\n- **Total de Contratos**: ${obras.length} frentes ativas.\n\n\`\`\`json\n{\n  "tipo": "bar",\n  "titulo": "Avanço Físico dos Contratos (%)",\n  "labels": ${JSON.stringify(labels)},\n  "valores": ${JSON.stringify(progressos)},\n  "unidade": "% Concluído"\n}\n\`\`\``
            };
        } else {
            // Curva diária de produção (Meta vs Realizado)
            const ordenados = [...bdp].reverse();
            const labels = ordenados.map(a => (a.data || '').split('-').slice(1).join('/'));
            const planejados = ordenados.map(a => parseFloat(a.planejado) || 0);
            const realizados = ordenados.map(a => parseFloat(a.realizado) || 0);
            return {
                resposta: `Gerando gráfico comparativo de produção diária (Meta vs Realizado):\n\n- **Total Planejado no Período**: ${Number(kpis.totalMeta || 0).toLocaleString('pt-BR')} un\n- **Total Realizado no Período**: ${Number(kpis.totalRealizado || 0).toLocaleString('pt-BR')} un\n- **Eficiência Média**: ${kpis.eficiencia || 0}%\n\n\`\`\`json\n{\n  "tipo": "bar",\n  "titulo": "Meta Planejada vs Produção Realizada",\n  "labels": ${JSON.stringify(labels)},\n  "datasets": [\n    {\n      "label": "Meta Programada",\n      "data": ${JSON.stringify(planejados)},\n      "backgroundColor": "#94A3B8"\n    },\n    {\n      "label": "Realizado em Campo",\n      "data": ${JSON.stringify(realizados)},\n      "backgroundColor": "#0A2342"\n    }\n  ]\n}\n\`\`\``
            };
        }
    }

    // 2. ÚLTIMOS REGISTROS / ÚLTIMO APONTAMENTO
    if (msgNorm.includes('ultimo') || msgNorm.includes('recentes') || msgNorm.includes('novos registros') || msgNorm.includes('novo registro')) {
        const ult = bdp[0];
        if (!ult) {
            return { resposta: "Não há nenhum apontamento registrado no banco de dados atualmente." };
        }
        let texto = `📋 **Último Boletim Diário de Produção (BDP) Registrado:**\n\n`;
        texto += `- **Protocolo**: \`${ult.protocolo || 'BDP-' + ult.id}\`\n`;
        texto += `- **Data & Turno**: ${ult.data} (${ult.turno || 'Diurno'})\n`;
        texto += `- **Obra**: ${ult.obra}\n`;
        texto += `- **Equipe**: ${ult.equipe} (Líder: ${ult.encarregado})\n`;
        texto += `- **Atividade**: ${ult.atividade}\n`;
        texto += `- **Meta**: ${ult.planejado} | **Realizado**: ${ult.realizado}\n`;
        texto += `- **Desvio**: **${ult.desvioPercentual || ult.desvio + '%'}** (Eficiência: ${ult.eficiencia}%)\n`;
        texto += `- **Produtividade**: ${ult.produtividadeHora || ult.produtividade}\n`;
        texto += `- **Condição Climática**: ${ult.clima || 'Ensolarado'}\n`;
        if (ult.parada && ult.parada !== 'Nenhum') {
            texto += `- **Ocorrência/Parada**: ⚠️ *${ult.parada}*\n`;
        }
        if (ult.observacao || ult.obs) {
            texto += `- **Observações**: _"${ult.observacao || ult.obs}"_\n`;
        }
        return { resposta: texto };
    }

    // 3. QUANTIDADE DE REGISTROS / CONTAGEM
    if (msgNorm.includes('quantos registros') || msgNorm.includes('total de registros') || msgNorm.includes('quantidade de registros') || msgNorm.includes('quantos apontamentos')) {
        return {
            resposta: `Atualmente temos **${kpis.totalRegistros} boletins diários de produção (BDP)** registrados no banco de dados.\n\n- **Volume Total Planejado**: ${Number(kpis.totalMeta || 0).toLocaleString('pt-BR')} un\n- **Volume Total Realizado**: ${Number(kpis.totalRealizado || 0).toLocaleString('pt-BR')} un\n- **Eficiência Geral**: ${kpis.eficiencia}%\n- **Desvio Operacional Geral**: ${parseFloat(kpis.desvio) >= 0 ? '+' : ''}${kpis.desvio}%`
        };
    }

    // 4. OCORRÊNCIAS / PROBLEMAS / PARADAS
    if (msgNorm.includes('problema') || msgNorm.includes('ocorrencia') || msgNorm.includes('parada') || msgNorm.includes('paralis') || msgNorm.includes('quebr') || msgNorm.includes('falha') || msgNorm.includes('critico')) {
        if (!ocorrencias.length) {
            return { resposta: "Não há registros de paralisações ou desvios críticos recentes no banco de dados. Todas as frentes de produção operaram normalmente." };
        }
        let texto = `⚠️ **Ocorrências e Paralisações Registradas no Banco:**\n\n`;
        ocorrencias.forEach(o => {
            texto += `• **${o.data} - ${o.obra} (${o.equipe})**:\n`;
            if (o.motivoParada && o.motivoParada !== 'Nenhum') {
                texto += `  - Motivo: **${o.motivoParada}**\n`;
            }
            if (o.detalhes) {
                texto += `  - Detalhes: _"${o.detalhes}"_\n`;
            }
            texto += `  - Variação/Desvio: **${o.desvio}**\n\n`;
        });
        return { resposta: texto };
    }

    // 5. EQUIPAMENTOS / FROTA / MANUTENÇÃO
    if (msgNorm.includes('equipamento') || msgNorm.includes('frota') || msgNorm.includes('maquina') || msgNorm.includes('caminhao') || msgNorm.includes('rolo') || msgNorm.includes('vibro') || msgNorm.includes('escavadeira') || msgNorm.includes('trator') || msgNorm.includes('manutencao')) {
        let texto = `🚜 **Status da Frota de Equipamentos:**\n\n`;
        texto += `- **Frota Total**: ${frota.total || 0} equipamentos cadastrados.\n`;
        texto += `- **Operacionais**: ${frota.operacionais || 0} equipamentos ativos em campo.\n`;
        if (frota.emManutencao && frota.emManutencao.length) {
            texto += `- **Em Manutenção**: ${frota.emManutencao.length} máquina(s):\n`;
            frota.emManutencao.forEach(m => {
                texto += `  • 🔧 ${m}\n`;
            });
        } else {
            texto += `- **Em Manutenção**: Nenhuma máquina parada no momento.\n`;
        }
        return { resposta: texto };
    }

    // 6. EQUIPES / PRODUTIVIDADE / DESEMPENHO
    if (msgNorm.includes('equipe') || msgNorm.includes('lider') || msgNorm.includes('encarregado') || msgNorm.includes('efetivo')) {
        let texto = `👥 **Desempenho das Equipes de Campo:**\n\n`;
        equipes.forEach(eq => {
            texto += `• **${eq.nome}** (Líder: ${eq.lider || eq.encarregado})\n`;
            texto += `  - Atividade: ${eq.atividade} | Obra: ${eq.obra}\n`;
            texto += `  - Efetivo: ${eq.integrantes} colaboradores | Status: **${eq.status}**\n`;
            texto += `  - Acumulado: ${Number(eq.realizadoAcumulado || 0).toLocaleString('pt-BR')} de ${Number(eq.metaAcumulada || 0).toLocaleString('pt-BR')} programadas\n\n`;
        });
        return { resposta: texto };
    }

    // 7. OBRAS / CONTRATOS / FRENTES
    if (msgNorm.includes('obra') || msgNorm.includes('contrato') || msgNorm.includes('frente') || msgNorm.includes('rodovia') || msgNorm.includes('raposo') || msgNorm.includes('aeroporto') || msgNorm.includes('industrial') || msgNorm.includes('jardim')) {
        let texto = `🏗️ **Acompanhamento de Obras & Contratos:**\n\n`;
        obras.forEach(ob => {
            texto += `• **${ob.nome}**\n`;
            texto += `  - Local: ${ob.local}\n`;
            texto += `  - Responsável: ${ob.responsavel || ob.eng}\n`;
            texto += `  - Avanço Físico: **${ob.progresso}%** (${ob.status})\n`;
            texto += `  - Volume Contratado: ${ob.volume || ob.volume_total}\n\n`;
        });
        return { resposta: texto };
    }

    // 8. KPIS GERAIS / RESUMO DA PRODUÇÃO / INDICADORES
    if (msgNorm.includes('kpi') || msgNorm.includes('indicador') || msgNorm.includes('eficiencia') || msgNorm.includes('desvio') || msgNorm.includes('resumo') || msgNorm.includes('hoje') || msgNorm.includes('producao')) {
        let texto = `📊 **Resumo Consolidado de Produção:**\n\n`;
        texto += `- **Meta Programada**: ${Number(kpis.totalMeta || 0).toLocaleString('pt-BR')} un\n`;
        texto += `- **Produção Realizada**: ${Number(kpis.totalRealizado || 0).toLocaleString('pt-BR')} un\n`;
        texto += `- **Eficiência Geral**: **${kpis.eficiencia}%**\n`;
        texto += `- **Desvio Operacional**: **${parseFloat(kpis.desvio) >= 0 ? '+' : ''}${kpis.desvio}%**\n`;
        texto += `- **Produtividade Média**: ${kpis.produtividadeMedia} /h\n`;
        texto += `- **Horas Totais Apontadas**: ${kpis.totalHoras} h\n`;
        texto += `- **Desempenho**: ${kpis.acima} equipes acima da meta, ${kpis.naMeta} na meta, ${kpis.abaixo} abaixo.\n`;
        return { resposta: texto };
    }

    // 8.5. BUSCA ESPECÍFICA / SEMÂNTICA EM REGISTROS
    const registrosEncontrados = await db.apontamentos.buscarSemantico(mensagem);
    if (registrosEncontrados && registrosEncontrados.length > 0) {
        let texto = `🔎 **Localizei ${registrosEncontrados.length} registro(s) no banco de dados relacionado(s) à sua consulta:**\n\n`;
        registrosEncontrados.forEach(r => {
            texto += `• **Protocolo \`${r.protocolo || 'BDP-' + r.id}\`** (${r.data} - ${r.obra}):\n`;
            texto += `  - Equipe: **${r.equipe}** (${r.encarregado})\n`;
            texto += `  - Atividade: ${r.atividade}\n`;
            texto += `  - Realizado: **${r.realizado} ${r.unidade}** (Meta: ${r.planejado} ${r.unidade}, Desvio: **${r.desvio}%**)\n`;
            if (r.parada && r.parada !== 'Nenhum') {
                texto += `  - Ocorrência/Parada: ⚠️ **${r.parada}**\n`;
            }
            if (r.obs) {
                texto += `  - Observações: _"${r.obs}"_\n`;
            }
            texto += `\n`;
        });
        return { resposta: texto.trim() };
    }

    // 9. RESPOSTA PADRÃO INTELIGENTE
    return {
        resposta: `Sou o **Assistente Inteligente da Ellenco**, conectado em tempo real ao banco de dados.\n\nAtualmente temos **${kpis.totalRegistros} boletins de produção** registrados, com **${Number(kpis.totalRealizado || 0).toLocaleString('pt-BR')} unidades produzidas** (${kpis.eficiencia}% de eficiência global) em **${obras.length} contratos ativos**.\n\nVocê pode me perguntar sobre:\n- *\"Quais foram os últimos apontamentos?\"*\n- *\"Existe algum equipamento em manutenção?\"*\n- *\"Quais ocorrências ou paradas foram relatadas?\"*\n- *\"Qual é o avanço físico das obras?\"*\n- *\"Gerar gráfico de produção diária\"*`
    };
}

// Valida campos obrigat├│rios (texto n├úo vazio). Retorna a lista dos que faltam.
function camposFaltando(body, campos) {
    return campos.filter(c => body[c] === undefined || body[c] === null || String(body[c]).trim() === '');
}

const server = http.createServer(async (req, res) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        });
        return res.end();
    }

    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    const query = parsedUrl.query;
    const method = req.method;

    try {
        // ====================================================================
        // API REST ENDPOINTS (/api/...)
        // ====================================================================
        if (pathname.startsWith('/api/')) {

            // 1. CHATBOT COM AGENTE IA INTEGRADO (GEMINI + SQLITE RAG)
            if (pathname === '/api/chat' && method === 'POST') {
                const body = await parseBody(req);
                const mensagem = (body.mensagem || body.message || '').trim();
                const historico = body.historico || body.history || [];
                const usuarioLogado = body.usuarioLogado || body.user || { nome: 'Carlos Silva', cargo: 'Encarregado de Equipe' };

                if (!mensagem) {
                    return sendJSON(res, { erro: 'Mensagem n├úo informada.' }, 400);
                }

                // 1. Coleta Snapshot em tempo real do SQLite
                const contextoCompleto = await db.obterContextoParaIA(usuarioLogado);
                const buscaSemantica = await db.apontamentos.buscarSemantico(mensagem);

                const promptSistema = `Você é o Assistente Inteligente Oficial da plataforma Ellenco Construções e Pavimentação.
Sua função é ajudar os colaboradores e gestores a compreender, consultar e analisar as informações operacionais de campo.

REGRAS DE CONFIABILIDADE:
- Você possui acesso direto aos dados reais da empresa fornecidos abaixo.
- NUNCA invente números, datas, obras, equipes ou registros fictícios.
- Sempre responda em português brasileiro de forma direta, clara e profissional.
- Se o usuário pedir gráficos, gere um bloco com formato JSON contendo {"tipo": "bar"|"doughnut", "titulo": "...", "labels": [...], "valores": [...]} para que a interface renderize o Chart.js.

SNAPSHOT EM TEMPO REAL DO BANCO DE DADOS (ELLENCO):
${JSON.stringify(contextoCompleto, null, 2)}

REGISTROS RELEVANTES ENCONTRADOS PARA A CONSULTA:
${JSON.stringify(buscaSemantica, null, 2)}`;

                // 2a. Tenta DeepSeek se DEEPSEEK_API_KEY estiver configurada
                const deepseekKey = (process.env.DEEPSEEK_API_KEY || '').trim();
                if (deepseekKey) {
                    try {
                        const resDeep = await fetch('https://api.deepseek.com/chat/completions', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${deepseekKey}`
                            },
                            body: JSON.stringify({
                                model: 'deepseek-chat',
                                messages: [
                                    { role: 'system', content: promptSistema },
                                    { role: 'user', content: mensagem }
                                ],
                                temperature: 0.3
                            })
                        });

                        if (resDeep.ok) {
                            const dataDeep = await resDeep.json();
                            const textoIA = dataDeep.choices && dataDeep.choices[0] && dataDeep.choices[0].message && dataDeep.choices[0].message.content;
                            if (textoIA) {
                                return sendJSON(res, {
                                    resposta: textoIA,
                                    fonte: 'DeepSeek-V3 + ' + (db.USE_POSTGRES ? 'PostgreSQL' : 'SQLite'),
                                    timestamp: new Date().toISOString()
                                });
                            }
                        } else {
                            const erroTxt = await resDeep.text();
                            console.warn('DeepSeek retornou status', resDeep.status, erroTxt);
                        }
                    } catch (deepseekErr) {
                        console.warn('Fallback DeepSeek:', deepseekErr.message);
                    }
                }

                // 2b. Tenta Gemini com modelos válidos (gemini-2.0-flash ou gemini-1.5-flash)
                if (genAI && process.env.GEMINI_API_KEY) {
                    try {
                        let response = null;
                        try {
                            response = await genAI.models.generateContent({
                                model: 'gemini-2.0-flash',
                                contents: mensagem,
                                config: { systemInstruction: promptSistema }
                            });
                        } catch (eG1) {
                            response = await genAI.models.generateContent({
                                model: 'gemini-1.5-flash',
                                contents: mensagem,
                                config: { systemInstruction: promptSistema }
                            });
                        }

                        if (response && response.text) {
                            return sendJSON(res, {
                                resposta: response.text,
                                fonte: 'Gemini Flash + ' + (db.USE_POSTGRES ? 'PostgreSQL' : 'SQLite'),
                                timestamp: new Date().toISOString()
                            });
                        }
                    } catch (genAiError) {
                        console.warn('Fallback Gemini falhou:', genAiError.message);
                    }
                }

                // 3. Motor Analítico Local Nativo (Fallback definitivo e 100% determinístico)
                const resultadoLocal = await processarConsultaAnaliticaLocal(mensagem, contextoCompleto, historico);
                return sendJSON(res, {
                    resposta: resultadoLocal.resposta,
                    fonte: 'Motor Analítico Ellenco (' + (db.USE_POSTGRES ? 'PostgreSQL' : 'SQLite') + ')',
                    timestamp: new Date().toISOString()
                });
            }

            // 2. STATUS DO BANCO DE DADOS
            if (pathname === '/api/status' && method === 'GET') {
                return sendJSON(res, {
                    status: 'online',
                    banco: db.USE_POSTGRES ? 'PostgreSQL (Supabase)' : 'SQLite 3 (WAL mode)',
                    versao: '2.5 Digital + Assistente IA',
                    iaDisponivel: true,
                    timestamp: new Date().toISOString()
                });
            }

            // 3. APONTAMENTOS & KPIS
            if (pathname === '/api/kpis' && method === 'GET') {
                const kpis = await db.apontamentos.calcularKPIs(query);
                return sendJSON(res, kpis);
            }

            if (pathname === '/api/apontamentos') {
                if (method === 'GET') {
                    const dados = await db.apontamentos.listar(query);
                    return sendJSON(res, dados);
                }
                if (method === 'POST') {
                    const body = await parseBody(req);
                    if (!body.obra || !body.equipe || !body.planejado || !body.realizado) {
                        return sendJSON(res, { error: 'Campos obrigat├│rios ausentes.' }, 400);
                    }
                    const novo = await db.apontamentos.criar(body);
                    return sendJSON(res, novo, 201);
                }
            }

            if (pathname.startsWith('/api/apontamentos/')) {
                const id = parseInt(pathname.split('/')[3], 10);
                if (method === 'GET') {
                    const item = await db.apontamentos.buscarPorId(id);
                    if (!item) return sendJSON(res, { error: 'Apontamento n├úo encontrado' }, 404);
                    return sendJSON(res, item);
                }
                if (method === 'PUT') {
                    const body = await parseBody(req);
                    const atualizado = await db.apontamentos.atualizar(id, body);
                    return sendJSON(res, atualizado);
                }
                if (method === 'DELETE') {
                    await db.apontamentos.remover(id);
                    return sendJSON(res, { success: true, message: 'Apontamento removido' });
                }
            }

            // 3b. ATIVIDADES (cat├ílogo)
            if (pathname === '/api/atividades') {
                if (method === 'GET') {
                    return sendJSON(res, await db.atividades.listar());
                }
                if (method === 'POST') {
                    const body = await parseBody(req);
                    const nome = String(body.nome || '').trim().slice(0, 80);
                    const unidade = String(body.unidade || '').trim().slice(0, 10);
                    if (!nome || !unidade) {
                        return sendJSON(res, { error: 'Nome e unidade s├úo obrigat├│rios.' }, 400);
                    }
                    const nova = await db.atividades.criar({ nome, unidade });
                    return sendJSON(res, nova, nova.jaExistia ? 200 : 201);
                }
            }

            // 4. OBRAS & FRENTES
            if (pathname === '/api/obras') {
                if (method === 'GET') {
                    return sendJSON(res, await db.obras.listar());
                }
                if (method === 'POST') {
                    const body = await parseBody(req);
                    const faltando = camposFaltando(body, ['nome', 'local', 'eng']);
                    if (faltando.length) {
                        return sendJSON(res, { error: 'Preencha os campos obrigat├│rios: ' + faltando.join(', ') + '.' }, 400);
                    }
                    const nova = await db.obras.criar(body);
                    return sendJSON(res, nova, 201);
                }
            }

            if (pathname.startsWith('/api/obras/')) {
                const id = parseInt(pathname.split('/')[3], 10);
                if (method === 'PUT') {
                    const body = await parseBody(req);
                    return sendJSON(res, await db.obras.atualizar(id, body));
                }
                if (method === 'DELETE') {
                    await db.obras.remover(id);
                    return sendJSON(res, { success: true });
                }
            }

            // 5. EQUIPES
            if (pathname === '/api/equipes') {
                if (method === 'GET') {
                    return sendJSON(res, await db.equipes.listar());
                }
                if (method === 'POST') {
                    const body = await parseBody(req);
                    const faltando = camposFaltando(body, ['nome', 'encarregado', 'atividade']);
                    if (faltando.length) {
                        return sendJSON(res, { error: 'Preencha os campos obrigat├│rios: ' + faltando.join(', ') + '.' }, 400);
                    }
                    const nova = await db.equipes.criar(body);
                    return sendJSON(res, nova, 201);
                }
            }

            if (pathname.startsWith('/api/equipes/')) {
                const id = parseInt(pathname.split('/')[3], 10);
                if (method === 'PUT') {
                    const body = await parseBody(req);
                    return sendJSON(res, await db.equipes.atualizar(id, body));
                }
                if (method === 'DELETE') {
                    await db.equipes.remover(id);
                    return sendJSON(res, { success: true });
                }
            }

            // 6. EQUIPAMENTOS
            if (pathname === '/api/equipamentos') {
                if (method === 'GET') {
                    return sendJSON(res, await db.equipamentos.listar());
                }
                if (method === 'POST') {
                    const body = await parseBody(req);
                    const faltando = camposFaltando(body, ['codigo', 'tipo', 'modelo', 'local']);
                    if (faltando.length) {
                        return sendJSON(res, { error: 'Preencha os campos obrigat├│rios: ' + faltando.join(', ') + '.' }, 400);
                    }
                    const novo = await db.equipamentos.criar(body);
                    return sendJSON(res, novo, 201);
                }
            }

            if (pathname.startsWith('/api/equipamentos/')) {
                const id = parseInt(pathname.split('/')[3], 10);
                if (method === 'PUT') {
                    const body = await parseBody(req);
                    return sendJSON(res, await db.equipamentos.atualizar(id, body));
                }
                if (method === 'DELETE') {
                    await db.equipamentos.remover(id);
                    return sendJSON(res, { success: true });
                }
            }

            // 7. AUTENTICA├ç├âO & GEST├âO DE USU├üRIOS
            if (pathname === '/api/auth/login' && method === 'POST') {
                const body = await parseBody(req);
                const usuario = await db.usuarios.autenticar(body.re || body.email, body.senha);
                if (!usuario) {
                    return sendJSON(res, { error: 'Credenciais inv├ílidas. Verifique seu RE/E-mail e senha.' }, 401);
                }
                if (usuario.status === 'pendente') {
                    return sendJSON(res, { error: 'Cadastro aguardando aprova├º├úo do cargo superior.', status: 'pendente' }, 403);
                }
                if (usuario.status === 'rejeitado') {
                    return sendJSON(res, { error: 'Solicita├º├úo de acesso recusada pela diretoria.', status: 'rejeitado' }, 403);
                }
                return sendJSON(res, { success: true, usuario });
            }

            if (pathname === '/api/auth/register' && method === 'POST') {
                const body = await parseBody(req);
                const existente = await db.usuarios.buscarPorREouEmail(body.re || body.email);
                if (existente) {
                    return sendJSON(res, { error: 'J├í existe uma solicita├º├úo ou conta com este RE ou E-mail.' }, 409);
                }
                const novo = await db.usuarios.cadastrar(body);
                try {
                    await db.notificacoes.criar('Nova Solicita├º├úo de Cadastro', `${body.nome} (${body.re}) solicitou acesso como ${body.cargo_label}.`, 'aviso');
                } catch (errNotificacao) {
                    // O cadastro j├í foi salvo: falha na notifica├º├úo n├úo pode reportar erro ao usu├írio
                    console.warn('Aviso: cadastro salvo, mas a notifica├º├úo falhou:', errNotificacao.message);
                }
                return sendJSON(res, { success: true, usuario: novo }, 201);
            }

            if (pathname === '/api/auth/status' && method === 'GET') {
                const termo = query.termo || '';
                const usuario = await db.usuarios.buscarPorREouEmail(termo);
                if (!usuario) {
                    return sendJSON(res, { error: 'Nenhuma solicita├º├úo encontrada com os dados informados.' }, 404);
                }
                return sendJSON(res, {
                    nome: usuario.nome,
                    re: usuario.re,
                    cargoLabel: usuario.cargo_label,
                    obra: usuario.obra,
                    status: usuario.status,
                    dataSolicitacao: usuario.criado_em,
                    aprovadoPor: usuario.aprovado_por,
                    motivoRejeicao: usuario.motivo_rejeicao
                });
            }

            if (pathname === '/api/auth/usuarios' && method === 'GET') {
                return sendJSON(res, await db.usuarios.listar());
            }

            if (pathname.startsWith('/api/auth/usuarios/') && method === 'PUT') {
                const id = parseInt(pathname.split('/')[4], 10);
                const body = await parseBody(req);
                const atualizado = await db.usuarios.atualizarStatus(id, body.status, body.aprovadoPor, body.motivo);
                if (!atualizado) {
                    return sendJSON(res, { error: 'Usu├írio n├úo encontrado.' }, 404);
                }
                return sendJSON(res, atualizado);
            }

            // 8. NOTIFICA├ç├òES
            if (pathname === '/api/notificacoes' && method === 'GET') {
                return sendJSON(res, await db.notificacoes.listar());
            }

            return sendJSON(res, { error: 'Endpoint n├úo encontrado' }, 404);
        }

        // ====================================================================
        // SERVI├çO DE ARQUIVOS EST├üTICOS (HTML, CSS, JS, IMAGENS)
        // ====================================================================
        let safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
        if (safePath === '/' || safePath === '\\') {
            safePath = '/HTML/index.html';
        } else if (!path.extname(safePath) && !safePath.includes('/HTML/')) {
            safePath = `/HTML${safePath}.html`;
        }

        let filePath = path.join(PUBLIC_DIR, safePath);

        if (!fs.existsSync(filePath)) {
            const alternatePath = path.join(PUBLIC_DIR, 'HTML', path.basename(safePath));
            if (fs.existsSync(alternatePath)) {
                filePath = alternatePath;
            }
        }

        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
            const ext = path.extname(filePath).toLowerCase();
            const contentType = MIME_TYPES[ext] || 'application/octet-stream';
            res.writeHead(200, { 'Content-Type': contentType });
            fs.createReadStream(filePath).pipe(res);
        } else {
            const indexPath = path.join(PUBLIC_DIR, 'HTML', 'index.html');
            if (fs.existsSync(indexPath)) {
                res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                fs.createReadStream(indexPath).pipe(res);
            } else {
                res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
                res.end('P├ígina n├úo encontrada.');
            }
        }
    } catch (err) {
        console.error('Erro no servidor:', err);
        const msg = String((err && err.message) || '');
        if ((err && err.code === '23505') || /UNIQUE constraint failed/i.test(msg)) {
            return sendJSON(res, { error: 'J├í existe um registro com este nome ou c├│digo. Use outro.' }, 409);
        }
        if ((err && err.code === '23502') || /NOT NULL constraint failed/i.test(msg)) {
            return sendJSON(res, { error: 'Preencha todos os campos obrigat├│rios.' }, 400);
        }
        if (err && err.code === '22P02') {
            return sendJSON(res, { error: 'Algum campo foi preenchido com um formato inv├ílido.' }, 400);
        }
        sendJSON(res, { error: 'Erro interno no servidor', message: err.message }, 500);
    }
});

// ====================================================================
// INICIALIZA├ç├âO ASS├ìNCRONA (PostgreSQL precisa de await)
// ====================================================================
(async () => {
    try {
        await db.initDatabase();
        console.log('Ô£à Banco de dados inicializado com sucesso.');
    } catch (err) {
        console.error('ÔØî Erro ao inicializar banco:', err);
    }

    server.listen(PORT, () => {
        const dbType = db.USE_POSTGRES ? 'PostgreSQL (Supabase)' : 'SQLite local';
        console.log(`
ÔòöÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòù
Ôòæ                   ­ƒÅù´©Å ELLENCO CONSTRU├ç├òES 2026                   Ôòæ
Ôòæ             SISTEMA DIGITAL DE APONTAMENTO DE PRODU├ç├âO           Ôòæ
Ôòæ               + ASSISTENTE DE INTELIG├èNCIA ARTIFICIAL            Ôòæ
ÔòáÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòú
Ôòæ                                                                  Ôòæ
Ôòæ  ­ƒîÉ Servidor Ativo:  http://localhost:${PORT}                       Ôòæ
Ôòæ  ­ƒùä´©Å  Banco de Dados:  ${dbType.padEnd(40)}Ôòæ
Ôòæ  ­ƒñû Agente de IA:    http://localhost:${PORT}/api/chat               Ôòæ
Ôòæ  ÔÜí REST API:        http://localhost:${PORT}/api/status             Ôòæ
Ôòæ                                                                  Ôòæ
ÔòÜÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòØ
        `);
    });
})();
