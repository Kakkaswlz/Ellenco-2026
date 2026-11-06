/* ==================================================================== */
/* ELLENCO - API.JS                                                     */
/* Camada Central de Dados com SQLite REST API e Fallback Inteligente   */
/* ==================================================================== */

const API_BASE_URL = (window.location.protocol === 'http:' || window.location.protocol === 'https:')
    ? '/api'
    : 'http://localhost:3000/api';

// Armazenamento Local de Fallback (caso o servidor esteja offline)
const DADOS_INICIAIS_APONTAMENTOS = [
    {
        id: 101,
        protocolo: "BDP-2026-8842",
        data: "2026-08-13",
        turno: "Diurno",
        obra: "SP-270 Rodovia Raposo Tavares",
        equipe: "Equipe Pavimentação 01",
        encarregado: "Carlos Silva",
        atividade: "Pavimentação CBUQ - Capa Asfáltica",
        unidade: "ton",
        planejado: 450,
        realizado: 462,
        horas: 8.5,
        efetivo: 14,
        desvio: 2.67,
        eficiencia: 102.67,
        produtividade: 54.4,
        clima: "Ensolarado",
        parada: "Nenhum",
        obs: "Produção transcorreu normalmente com excelente compactação.",
        status: "Concluído"
    },
    {
        id: 102,
        protocolo: "BDP-2026-7510",
        data: "2026-08-14",
        turno: "Diurno",
        obra: "SP-270 Rodovia Raposo Tavares",
        equipe: "Equipe Terraplanagem 02",
        encarregado: "Marcos Souza",
        atividade: "Terraplanagem - Corte e Aterro",
        unidade: "m3",
        planejado: 1200,
        realizado: 1250,
        horas: 9.0,
        efetivo: 12,
        desvio: 4.17,
        eficiencia: 104.17,
        produtividade: 138.9,
        clima: "Nublado",
        parada: "Nenhum",
        obs: "Avanço no subleito do km 104.",
        status: "Concluído"
    },
    {
        id: 103,
        protocolo: "BDP-2026-6420",
        data: "2026-08-15",
        turno: "Diurno",
        obra: "Loteamento Jardim Ellenco",
        equipe: "Equipe Drenagem 01",
        encarregado: "José Santos",
        atividade: "Assentamento de Tubos e Galerias",
        unidade: "m",
        planejado: 80,
        realizado: 74,
        horas: 8.0,
        efetivo: 8,
        desvio: -7.50,
        eficiencia: 92.50,
        produtividade: 9.3,
        clima: "Chuva Leve",
        parada: "Chuva / Clima",
        obs: "Chuva intermitente no período da tarde reduziu o ritmo da vala.",
        status: "Concluído"
    },
    {
        id: 104,
        protocolo: "BDP-2026-5128",
        data: "2026-08-16",
        turno: "Diurno",
        obra: "Pavimentação Industrial",
        equipe: "Equipe Base 03",
        encarregado: "Antônio Ferreira",
        atividade: "Aplicação de Brita Graduada (BGS)",
        unidade: "m3",
        planejado: 350,
        realizado: 310,
        horas: 8.0,
        efetivo: 10,
        desvio: -11.43,
        eficiencia: 88.57,
        produtividade: 38.8,
        clima: "Ensolarado",
        parada: "Manutenção de Equipamento",
        obs: "Rolo compactador parou 1h para troca de mangueira hidráulica.",
        status: "Concluído"
    },
    {
        id: 105,
        protocolo: "BDP-2026-4301",
        data: "2026-08-17",
        turno: "Diurno",
        obra: "Aeroporto Estadual",
        equipe: "Equipe Fresagem 01",
        encarregado: "Paulo Lima",
        atividade: "Fresagem de Pavimento Asfáltico",
        unidade: "m2",
        planejado: 2500,
        realizado: 2600,
        horas: 8.5,
        efetivo: 11,
        desvio: 4.00,
        eficiencia: 104.00,
        produtividade: 305.9,
        clima: "Ensolarado",
        parada: "Nenhum",
        obs: "Liberação rápida de pista pela concessionária.",
        status: "Concluído"
    },
    {
        id: 106,
        protocolo: "BDP-2026-8843",
        data: "2026-08-18",
        turno: "Diurno",
        obra: "SP-270 Rodovia Raposo Tavares",
        equipe: "Equipe Pavimentação 01",
        encarregado: "Carlos Silva",
        atividade: "Pavimentação CBUQ - Capa Asfáltica",
        unidade: "ton",
        planejado: 500,
        realizado: 520,
        horas: 9.0,
        efetivo: 14,
        desvio: 4.00,
        eficiencia: 104.00,
        produtividade: 57.8,
        clima: "Ensolarado",
        parada: "Nenhum",
        obs: "Entrega contínua de massa asfáltica pela Usina 02.",
        status: "Concluído"
    },
    {
        id: 107,
        protocolo: "BDP-2026-9104",
        data: "2026-08-19",
        turno: "Noturno",
        obra: "SP-270 Rodovia Raposo Tavares",
        equipe: "Equipe Sinalização Noturna",
        encarregado: "Roberto Dias",
        atividade: "Pintura Termoplástica e Tachas",
        unidade: "m2",
        planejado: 1800,
        realizado: 1850,
        horas: 7.5,
        efetivo: 9,
        desvio: 2.78,
        eficiencia: 102.78,
        produtividade: 246.7,
        clima: "Bom Tempo",
        parada: "Nenhum",
        obs: "Execução noturna sem interferência de tráfego.",
        status: "Concluído"
    },
    {
        id: 108,
        protocolo: "BDP-2026-8844",
        data: "2026-08-20",
        turno: "Diurno",
        obra: "SP-270 Rodovia Raposo Tavares",
        equipe: "Equipe Pavimentação 01",
        encarregado: "Carlos Silva",
        atividade: "Pavimentação CBUQ - Capa Asfáltica",
        unidade: "ton",
        planejado: 480,
        realizado: 495,
        horas: 8.5,
        efetivo: 14,
        desvio: 3.12,
        eficiencia: 103.12,
        produtividade: 58.2,
        clima: "Ensolarado",
        parada: "Nenhum",
        obs: "Excelente rendimento na faixa da direita.",
        status: "Concluído"
    }
];

const DADOS_INICIAIS_EQUIPES = [
    { id: 1, nome: "Equipe Pavimentação 01", encarregado: "Carlos Silva (RE-8842)", atividade: "Pavimentação CBUQ", obra: "SP-270 Rodovia Raposo Tavares", integrantes: 14, meta_acumulada: 3500, realizado_acumulado: 3620, produtividade_media: "56.1 ton/h", status: "Acima da Meta" },
    { id: 2, nome: "Equipe Terraplanagem 02", encarregado: "Marcos Souza (RE-7510)", atividade: "Corte e Aterro", obra: "SP-270 Rodovia Raposo Tavares", integrantes: 12, meta_acumulada: 8500, realizado_acumulado: 8750, produtividade_media: "135.0 m³/h", status: "Acima da Meta" },
    { id: 3, nome: "Equipe Drenagem 01", encarregado: "José Santos (RE-6420)", atividade: "Galerias e Tubos", obra: "Loteamento Jardim Ellenco", integrantes: 8, meta_acumulada: 600, realizado_acumulado: 560, produtividade_media: "9.3 m/h", status: "Abaixo da Meta" },
    { id: 4, nome: "Equipe Base 03", encarregado: "Antônio Ferreira (RE-5128)", atividade: "Base Brita Graduada (BGS)", obra: "Pavimentação Industrial", integrantes: 10, meta_acumulada: 2500, realizado_acumulado: 2350, produtividade_media: "38.8 m³/h", status: "Na Meta" },
    { id: 5, nome: "Equipe Fresagem 01", encarregado: "Paulo Lima (RE-4301)", atividade: "Fresagem Asfáltica", obra: "Aeroporto Estadual", integrantes: 11, meta_acumulada: 15000, realizado_acumulado: 15800, produtividade_media: "305.9 m²/h", status: "Acima da Meta" }
];

const DADOS_INICIAIS_OBRAS = [
    { id: 1, nome: "SP-270 Rodovia Raposo Tavares", local: "Sorocaba - SP (km 98 ao 115)", eng: "Eng. Gabriel Martins", volume_total: "45.000 ton", progresso: 68.5, status: "Em Andamento" },
    { id: 2, nome: "Loteamento Jardim Ellenco", local: "Votorantim - SP", eng: "Eng. Rodrigo Alencar", volume_total: "18.500 m³", progresso: 42.0, status: "Em Andamento" },
    { id: 3, nome: "Pavimentação Industrial", local: "Campinas - SP (Distrito Industrial)", eng: "Engª. Amanda Costa", volume_total: "12.000 m³", progresso: 85.0, status: "Em Fase Final" },
    { id: 4, nome: "Aeroporto Estadual", local: "Ribeirão Preto - SP", eng: "Eng. Fernando Prado", volume_total: "35.000 m²", progresso: 28.0, status: "Recém Iniciada" }
];

const DADOS_INICIAIS_EQUIPAMENTOS = [
    { id: 1, codigo: "VIB-01", tipo: "Vibroacabadora de Asfalto", modelo: "Vögele Super 1800-3", horimetro: 1420.5, consumo_medio: "22.5 L/h", local: "SP-270 Raposo Tavares", status: "Operacional", ultima_manutencao: "18/08/2026" },
    { id: 2, codigo: "ROL-03", tipo: "Rolo Compactador Tandem", modelo: "Hamm HD 90 VT", horimetro: 890.0, consumo_medio: "14.0 L/h", local: "SP-270 Raposo Tavares", status: "Operacional", ultima_manutencao: "15/08/2026" },
    { id: 3, codigo: "ROL-07", tipo: "Rolo Pneumático 26t", modelo: "Dynapac CP275", horimetro: 2140.2, consumo_medio: "16.5 L/h", local: "SP-270 Raposo Tavares", status: "Operacional", ultima_manutencao: "10/08/2026" },
    { id: 4, codigo: "MOT-02", tipo: "Motoniveladora Pesada", modelo: "Caterpillar 140K", horimetro: 3250.8, consumo_medio: "24.0 L/h", local: "Jardim Ellenco", status: "Operacional", ultima_manutencao: "12/08/2026" },
    { id: 5, codigo: "ESC-04", tipo: "Escavadeira Hidráulica 22t", modelo: "Komatsu PC200-8", horimetro: 1980.0, consumo_medio: "20.0 L/h", local: "Jardim Ellenco", status: "Operacional", ultima_manutencao: "19/08/2026" },
    { id: 6, codigo: "FRE-01", tipo: "Fresadora de Pavimento", modelo: "Wirtgen W 200 F", horimetro: 1120.4, consumo_medio: "45.0 L/h", local: "Aeroporto Estadual", status: "Operacional", ultima_manutencao: "14/08/2026" },
    { id: 7, codigo: "CAM-12", tipo: "Caminhão Basculante 6x4", modelo: "Volvo FMX 460", horimetro: 4850.0, consumo_medio: "2.8 km/L", local: "Pavimentação Industrial", status: "Em Manutenção", ultima_manutencao: "20/08/2026" }
];

let servidorOnline = null;

async function testarServidor() {
    if (servidorOnline !== null) return servidorOnline;
    try {
        const res = await fetch(`${API_BASE_URL}/status`, { signal: AbortSignal.timeout(1500) });
        servidorOnline = res.ok;
    } catch (e) {
        servidorOnline = false;
    }
    return servidorOnline;
}

// Envia uma gravação (POST/PUT/DELETE) ao servidor.
// Se o servidor responder com erro, LANÇA o erro (nunca finge que salvou).
async function enviar(caminho, metodo, corpo) {
    let res;
    try {
        res = await fetch(`${API_BASE_URL}${caminho}`, {
            method: metodo,
            headers: { 'Content-Type': 'application/json' },
            body: corpo !== undefined ? JSON.stringify(corpo) : undefined
        });
    } catch (e) {
        throw new Error("Não foi possível conectar ao servidor. Verifique a conexão e tente novamente.");
    }

    let dados = null;
    try { dados = await res.json(); } catch (e) {}

    if (!res.ok) {
        console.error(`Erro ${res.status} em ${metodo} ${caminho}:`, dados);
        if (res.status >= 500) {
            throw new Error("O servidor não conseguiu salvar. Tente novamente em instantes.");
        }
        throw new Error((dados && (dados.error || dados.message)) || `Não foi possível concluir a operação (erro ${res.status}).`);
    }
    return dados;
}

const api = {
    // ==========================================
    // STATUS DO BANCO DE DADOS
    // ==========================================
    async isOnline() {
        return await testarServidor();
    },

    // ==========================================
    // APONTAMENTOS & KPIS
    // ==========================================
    async getApontamentos(filtros = {}) {
        if (await testarServidor()) {
            try {
                const params = new URLSearchParams();
                if (filtros.obra && filtros.obra !== 'todas') params.append('obra', filtros.obra);
                if (filtros.equipe && filtros.equipe !== 'todas') params.append('equipe', filtros.equipe);
                const res = await fetch(`${API_BASE_URL}/apontamentos?${params.toString()}`);
                if (res.ok) return await res.json();
            } catch (e) {
                console.warn("Falha na API, usando base local:", e);
            }
        }

        let lista = JSON.parse(localStorage.getItem("ellenco_apontamentos")) || DADOS_INICIAIS_APONTAMENTOS;
        if (filtros.obra && filtros.obra !== "todas") {
            lista = lista.filter(i => i.obra === filtros.obra);
        }
        if (filtros.equipe && filtros.equipe !== "todas") {
            lista = lista.filter(i => i.equipe === filtros.equipe);
        }
        return lista;
    },

    async postApontamento(dados) {
        if (await testarServidor()) {
            return await enviar('/apontamentos', 'POST', dados);
        }

        const lista = JSON.parse(localStorage.getItem("ellenco_apontamentos")) || DADOS_INICIAIS_APONTAMENTOS;
        const desvio = dados.planejado > 0 ? ((dados.realizado - dados.planejado) / dados.planejado) * 100 : 0;
        const eficiencia = dados.planejado > 0 ? (dados.realizado / dados.planejado) * 100 : 100;
        const produtividade = dados.horas > 0 ? (dados.realizado / dados.horas) : 0;

        const novo = {
            id: Date.now(),
            protocolo: `BDP-2026-${Math.floor(1000 + Math.random() * 9000)}`,
            desvio: parseFloat(desvio.toFixed(2)),
            eficiencia: parseFloat(eficiencia.toFixed(2)),
            produtividade: parseFloat(produtividade.toFixed(1)),
            status: "Concluído",
            ...dados
        };

        lista.unshift(novo);
        localStorage.setItem("ellenco_apontamentos", JSON.stringify(lista));
        return novo;
    },

    async deleteApontamento(id) {
        if (await testarServidor()) {
            await enviar(`/apontamentos/${id}`, 'DELETE');
            return true;
        }

        let lista = JSON.parse(localStorage.getItem("ellenco_apontamentos")) || DADOS_INICIAIS_APONTAMENTOS;
        lista = lista.filter(i => i.id !== id);
        localStorage.setItem("ellenco_apontamentos", JSON.stringify(lista));
        return true;
    },

    async getKPIs(filtros = {}) {
        if (await testarServidor()) {
            try {
                const params = new URLSearchParams();
                if (filtros.obra && filtros.obra !== 'todas') params.append('obra', filtros.obra);
                const res = await fetch(`${API_BASE_URL}/kpis?${params.toString()}`);
                if (res.ok) return await res.json();
            } catch (e) {
                console.warn("Falha no getKPIs da API:", e);
            }
        }

        const lista = await this.getApontamentos(filtros);
        let totalPlanejado = 0, totalRealizado = 0, totalHoras = 0;
        let acima = 0, naMeta = 0, abaixo = 0;

        lista.forEach(i => {
            totalPlanejado += (parseFloat(i.planejado) || 0);
            totalRealizado += (parseFloat(i.realizado) || 0);
            totalHoras += (parseFloat(i.horas) || 0);

            const ef = (parseFloat(i.realizado) / (parseFloat(i.planejado) || 1)) * 100;
            if (ef >= 100) acima++;
            else if (ef >= 90) naMeta++;
            else abaixo++;
        });

        const desvioGeral = totalPlanejado > 0 ? ((totalRealizado - totalPlanejado) / totalPlanejado) * 100 : 0;
        const eficienciaGeral = totalPlanejado > 0 ? (totalRealizado / totalPlanejado) * 100 : 100;
        const prodMedia = totalHoras > 0 ? (totalRealizado / totalHoras).toFixed(1) : '0.0';

        return {
            totalRegistros: lista.length,
            totalMeta: Math.round(totalPlanejado),
            totalRealizado: Math.round(totalRealizado),
            desvio: desvioGeral.toFixed(1),
            eficiencia: Math.round(eficienciaGeral),
            produtividadeMedia: prodMedia,
            totalHoras: totalHoras.toFixed(1),
            acima, naMeta, abaixo
        };
    },

    // ==========================================
    // OBRAS
    // ==========================================
    async getObras() {
        if (await testarServidor()) {
            try {
                const res = await fetch(`${API_BASE_URL}/obras`);
                if (res.ok) return await res.json();
            } catch (e) {}
        }
        return JSON.parse(localStorage.getItem("ellenco_obras")) || DADOS_INICIAIS_OBRAS;
    },

    async postObra(dados) {
        if (await testarServidor()) {
            return await enviar('/obras', 'POST', dados);
        }
        const lista = await this.getObras();
        const nova = { id: Date.now(), ...dados };
        lista.push(nova);
        localStorage.setItem("ellenco_obras", JSON.stringify(lista));
        return nova;
    },

    // ==========================================
    // EQUIPES
    // ==========================================
    async getEquipes() {
        if (await testarServidor()) {
            try {
                const res = await fetch(`${API_BASE_URL}/equipes`);
                if (res.ok) return await res.json();
            } catch (e) {}
        }
        return JSON.parse(localStorage.getItem("ellenco_equipes")) || DADOS_INICIAIS_EQUIPES;
    },

    async postEquipe(dados) {
        if (await testarServidor()) {
            return await enviar('/equipes', 'POST', dados);
        }
        const lista = await this.getEquipes();
        const nova = { id: Date.now(), ...dados };
        lista.push(nova);
        localStorage.setItem("ellenco_equipes", JSON.stringify(lista));
        return nova;
    },

    // ==========================================
    // ATIVIDADES (catálogo)
    // ==========================================
    async getAtividades() {
        if (await testarServidor()) {
            try {
                const res = await fetch(`${API_BASE_URL}/atividades`);
                if (res.ok) return await res.json();
            } catch (e) {}
        }
        return null; // servidor indisponível
    },

    async postAtividade(dados) {
        if (await testarServidor()) {
            return await enviar('/atividades', 'POST', dados);
        }
        return null; // servidor indisponível
    },

    // ==========================================
    // EQUIPAMENTOS
    // ==========================================
    async getEquipamentos() {
        if (await testarServidor()) {
            try {
                const res = await fetch(`${API_BASE_URL}/equipamentos`);
                if (res.ok) return await res.json();
            } catch (e) {}
        }
        return JSON.parse(localStorage.getItem("ellenco_equipamentos")) || DADOS_INICIAIS_EQUIPAMENTOS;
    },

    async postEquipamento(dados) {
        if (await testarServidor()) {
            return await enviar('/equipamentos', 'POST', dados);
        }
        const lista = await this.getEquipamentos();
        const novo = { id: Date.now(), ...dados };
        lista.push(novo);
        localStorage.setItem("ellenco_equipamentos", JSON.stringify(lista));
        return novo;
    },

    // ==========================================
    // USUÁRIOS & AUTENTICAÇÃO
    // ==========================================
    async loginUsuario(termo, senha) {
        if (await testarServidor()) {
            const res = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ re: termo, email: termo, senha })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Falha na autenticação");
            return data.usuario;
        }

        // Fallback local
        if (termo.toLowerCase().includes("carlos") || termo.includes("8842")) {
            return { nome: "Carlos Silva", re: "RE-8842", cargo: "operacional", cargoLabel: "Encarregado de Equipe", obra: "SP-270 Rodovia Raposo Tavares", nivel: 1 };
        }
        return { nome: "Eng. Ricardo Viana", re: "RE-1005", cargo: "gestor", cargoLabel: "Diretor de Operações", obra: "Matriz / Todas as Obras", nivel: 4 };
    },

    async cadastrarUsuario(dados) {
        if (await testarServidor()) {
            const res = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dados)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Erro no cadastro");
            return data.usuario;
        }
        return { id: Date.now(), ...dados, status: 'pendente' };
    },

    async consultarStatusUsuario(termo) {
        if (await testarServidor()) {
            const res = await fetch(`${API_BASE_URL}/auth/status?termo=${encodeURIComponent(termo)}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Nenhuma solicitação encontrada");
            return data;
        }
        return {
            nome: "Solicitante",
            re: termo,
            cargoLabel: "Colaborador",
            obra: "SP-270 Raposo Tavares",
            status: "pendente",
            dataSolicitacao: new Date().toLocaleDateString("pt-BR")
        };
    },

    async getUsuarios() {
        if (await testarServidor()) {
            const res = await fetch(`${API_BASE_URL}/auth/usuarios`);
            if (res.ok) return await res.json();
        }
        return [];
    },

    async atualizarStatusUsuario(id, status, aprovadoPor = '', motivo = '') {
        if (await testarServidor()) {
            return await enviar(`/auth/usuarios/${id}`, 'PUT', { status, aprovadoPor, motivo });
        }
        return { id, status };
    },

    // ==========================================
    // CLIMA EM TEMPO REAL (OPEN-METEO)
    // ==========================================
    async consultarClima(cidade = "Sorocaba") {
        const coords = {
            "Sorocaba": { lat: -23.5015, lon: -47.4526 },
            "Campinas": { lat: -22.9056, lon: -47.0608 },
            "São Paulo": { lat: -23.5505, lon: -46.6333 },
            "Ribeirão Preto": { lat: -21.1775, lon: -47.8103 },
            "Votorantim": { lat: -23.5422, lon: -47.4419 }
        };

        const loc = coords[cidade] || coords["Sorocaba"];

        try {
            const urlClima = `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=precipitation_probability_max&timezone=America%2FSao_Paulo`;
            const res = await fetch(urlClima);
            if (!res.ok) throw new Error("Erro na API Meteorológica");
            const data = await res.json();

            const temp = Math.round(data.current?.temperature_2m || 24);
            const umidade = data.current?.relative_humidity_2m || 60;
            const vento = data.current?.wind_speed_10m || 12;
            const probChuva = data.daily?.precipitation_probability_max?.[0] || 10;
            const code = data.current?.weather_code || 0;

            let condicaoTexto = "Ensolarado / Bom Tempo";
            let condicaoIcone = "fa-solid fa-sun text-amber-400";
            let recomendacao = "Condições ideais para aplicação de CBUQ e compactação.";

            if (code >= 51 && code <= 67) {
                condicaoTexto = "Chuva Leve";
                condicaoIcone = "fa-solid fa-cloud-rain text-blue-400";
                recomendacao = "Atenção com umidade do solo na terraplanagem.";
            } else if (code >= 71) {
                condicaoTexto = "Chuva Forte / Temporal";
                condicaoIcone = "fa-solid fa-cloud-bolt text-red-400";
                recomendacao = "Paralisação recomendada em serviços asfálticos.";
            } else if (code >= 1 && code <= 3) {
                condicaoTexto = "Parcialmente Nublado";
                condicaoIcone = "fa-solid fa-cloud-sun text-slate-300";
                recomendacao = "Clima favorável para todas as frentes de produção.";
            }

            return {
                cidade,
                temperatura: temp,
                umidade,
                vento,
                probChuva,
                condicaoTexto,
                condicaoIcone,
                recomendacao
            };
        } catch (e) {
            return {
                cidade,
                temperatura: 26,
                umidade: 55,
                vento: 14,
                probChuva: 10,
                condicaoTexto: "Ensolarado",
                condicaoIcone: "fa-solid fa-sun text-amber-400",
                recomendacao: "Condições ideais para pavimentação e compactação."
            };
        }
    }
};

window.api = api;
