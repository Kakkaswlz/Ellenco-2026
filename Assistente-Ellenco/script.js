// =====================================================
// ASSISTENTE ELLENCO - VERSÃO COMPLETA
// Integração com o layout moderno
// =====================================================

// =====================================================
// ELEMENTOS HTML (Layout Moderno)
// =====================================================
const chat = document.getElementById("chat");
const input = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const clearBtn = document.getElementById("clearBtn");
const charCounter = document.getElementById("charCounter");
const typingIndicator = document.getElementById("typingIndicator");
const menuToggle = document.getElementById("menuToggle");
const sidebar = document.getElementById("sidebar");
const logoutBtn = document.getElementById("logoutBtn");
const exportBtn = document.getElementById("exportBtn");
const helpBtn = document.getElementById("helpBtn");
const attachBtn = document.getElementById("attachBtn");
const emojiBtn = document.getElementById("emojiBtn");
const quickCmdBtn = document.getElementById("quickCmdBtn");

// =====================================================
// HISTÓRICO
// =====================================================
let history = [];
let charts = [];
let isProcessing = false;

// =====================================================
// BASE DE CONHECIMENTO LOCAL (Fallback)
// =====================================================
const localKnowledge = {
    'apontamento': 'Para fazer um apontamento, acesse o módulo "Produção" > "Apontamentos" e clique em "Novo Apontamento". Preencha os dados da atividade, tempo e recursos utilizados.',
    'produção planejada': 'Produção planejada é a quantidade de itens que a empresa espera produzir em um período, baseado na demanda, capacidade e recursos disponíveis.',
    'desempenho equipe': 'O desempenho da equipe pode ser visualizado no módulo "Equipes" > "Desempenho". Lá você encontra métricas como produtividade, eficiência e qualidade.',
    'kpi': 'KPI (Key Performance Indicator) é um indicador-chave de desempenho. Na Ellenco, usamos KPIs como OEE (Eficiência Geral), Produtividade e Qualidade.',
    'indicador': 'Indicadores são métricas usadas para medir o desempenho. Na Ellenco, temos indicadores de produção, qualidade, eficiência e equipes.',
    'equipe': 'As equipes podem ser gerenciadas no módulo "Equipes". Lá você pode ver membros, escala e desempenho de cada equipe.',
    'planejamento': 'O planejamento é feito no módulo "Planejamento" onde você define metas, aloca recursos e programa a produção.',
};

function getLocalResponse(message) {
    const msg = message.toLowerCase().trim();
    for (const [key, response] of Object.entries(localKnowledge)) {
        if (msg.includes(key)) {
            return response;
        }
    }
    return null;
}

// =====================================================
// TOAST NOTIFICATION
// =====================================================
function showToast(message, icon = 'fa-check-circle', type = 'info') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<i class="fas ${icon}"></i> ${message}`;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// =====================================================
// BOTÕES DE SUGESTÃO (Quick Actions)
// =====================================================
function configurarSugestoes() {
    document.querySelectorAll(".quick-action").forEach(button => {
        button.addEventListener("click", () => {
            const question = button.dataset.question || button.textContent.trim();
            input.value = question;
            autoResize();
            enviarMensagem();
        });
    });

    // History items
    document.querySelectorAll(".history-list li").forEach(item => {
        item.addEventListener("click", () => {
            const text = item.querySelector(".history-text")?.textContent || "";
            if (text) {
                input.value = text;
                autoResize();
                enviarMensagem();
            }
        });
    });

    // Tags
    document.querySelectorAll(".tag").forEach(tag => {
        tag.addEventListener("click", () => {
            const tagText = tag.dataset.tag || tag.textContent;
            input.value = `Fale sobre ${tagText}`;
            autoResize();
            enviarMensagem();
        });
    });
}

configurarSugestoes();

// =====================================================
// TEXTAREA
// =====================================================
input.addEventListener("input", () => {
    autoResize();
    updateCharCounter();
});

function autoResize() {
    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 130) + "px";
}

function updateCharCounter() {
    const length = input.value.length;
    if (charCounter) {
        charCounter.textContent = `${length}/500`;
        charCounter.style.color = length > 450 ? '#e21d2f' : '';
    }
}

// =====================================================
// ENTER
// =====================================================
input.addEventListener("keydown", event => {
    if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        enviarMensagem();
    }
});

// =====================================================
// BOTÃO ENVIAR
// =====================================================
sendBtn.addEventListener("click", enviarMensagem);

// =====================================================
// BOTÃO LIMPAR
// =====================================================
clearBtn.addEventListener("click", limparConversa);

// =====================================================
// BOTÃO EXPORTAR
// =====================================================
exportBtn.addEventListener("click", exportarConversa);

// =====================================================
// BOTÃO AJUDA
// =====================================================
helpBtn.addEventListener("click", () => {
    showToast('Digite sua dúvida ou clique nas sugestões!', 'fa-question-circle');
});

// =====================================================
// BOTÃO SAIR
// =====================================================
logoutBtn.addEventListener("click", () => {
    showToast('Saindo... Até logo! 👋', 'fa-sign-out-alt');
    setTimeout(() => location.reload(), 1500);
});

// =====================================================
// MENU TOGGLE (Mobile)
// =====================================================
menuToggle.addEventListener("click", () => {
    sidebar.classList.toggle("open");
});

// =====================================================
// ANEXAR ARQUIVO
// =====================================================
attachBtn.addEventListener("click", () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.pdf,.doc,.docx,.txt,.png,.jpg,.jpeg';
    fileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            showToast(`Arquivo anexado: ${file.name}`, 'fa-paperclip', 'success');
        }
    };
    fileInput.click();
});

// =====================================================
// EMOJI
// =====================================================
emojiBtn.addEventListener("click", () => {
    const emojis = ['😊', '👍', '🔥', '💡', '📊', '✅', '⭐', '🎯', '🚀', '💪', '🤖', '📈'];
    const random = emojis[Math.floor(Math.random() * emojis.length)];
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const text = input.value;
    input.value = text.substring(0, start) + random + text.substring(end);
    input.focus();
    input.selectionStart = input.selectionEnd = start + random.length;
    updateCharCounter();
    autoResize();
});

// =====================================================
// COMANDO RÁPIDO
// =====================================================
quickCmdBtn.addEventListener("click", () => {
    const commands = [
        '/apontamento',
        '/produção',
        '/equipe',
        '/kpi',
        '/indicador',
        '/planejamento',
        '/produtividade',
        '/qualidade',
        '/relatório',
        '/dashboard'
    ];
    const random = commands[Math.floor(Math.random() * commands.length)];
    input.value = random;
    input.focus();
    updateCharCounter();
    autoResize();
    showToast(`Comando rápido: ${random}`, 'fa-bolt', 'info');
});

// =====================================================
// NAVEGAÇÃO SIDEBAR
// =====================================================
document.querySelectorAll(".nav-item").forEach(item => {
    item.addEventListener("click", (e) => {
        e.preventDefault();
        document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));
        item.classList.add("active");

        const page = item.dataset.page;
        if (page === 'chat') {
            // Já estamos no chat
        } else {
            showToast(`Navegando para: ${item.textContent.trim()}`, 'fa-arrow-right', 'info');
        }

        if (window.innerWidth <= 992) {
            sidebar.classList.remove("open");
        }
    });
});

// =====================================================
// LIMPAR CONVERSA
// =====================================================
function limparConversa() {
    history = [];

    // Destruir gráficos existentes
    charts.forEach(chart => {
        try { chart.destroy(); } catch (error) { console.log("Erro ao limpar gráfico:", error); }
    });
    charts = [];

    // Remover mensagens
    const messages = chat.querySelectorAll('.message');
    messages.forEach(msg => msg.remove());

    // Mostrar tela de boas-vindas
    const welcomeHTML = `
        <div class="welcome-screen" id="welcome">
            <div class="welcome-icon">
                <i class="fas fa-robot"></i>
            </div>
            <h2>Olá! Como posso ajudar?</h2>
            <p>
                Sou o Assistente Ellenco. Estou aqui para tirar dúvidas sobre o sistema,
                apontamentos, produção, equipes e indicadores de desempenho.
            </p>
            <div class="quick-actions">
                <button class="quick-action" data-question="Como faço um apontamento?">
                    <i class="fas fa-clock"></i> Como faço um apontamento?
                </button>
                <button class="quick-action" data-question="O que é produção planejada?">
                    <i class="fas fa-chart-pie"></i> O que é produção planejada?
                </button>
                <button class="quick-action" data-question="Como vejo o desempenho de uma equipe?">
                    <i class="fas fa-medal"></i> Desempenho de equipe
                </button>
                <button class="quick-action" data-question="O que significa um KPI?">
                    <i class="fas fa-bullseye"></i> O que significa KPI?
                </button>
            </div>
            <div class="features-highlight">
                <div class="feature-item">
                    <i class="fas fa-bolt" style="color: #0b63ce;"></i>
                    <span>Respostas rápidas</span>
                </div>
                <div class="feature-item">
                    <i class="fas fa-database" style="color: #e21d2f;"></i>
                    <span>Base de conhecimento</span>
                </div>
                <div class="feature-item">
                    <i class="fas fa-shield-alt" style="color: #071a35;"></i>
                    <span>Dados seguros</span>
                </div>
            </div>
        </div>
    `;

    chat.innerHTML = welcomeHTML;

    // Reconfigurar sugestões
    configurarSugestoes();

    input.focus();
    showToast('Conversa limpa!', 'fa-trash-alt', 'success');
}

// =====================================================
// EXPORTAR CONVERSA
// =====================================================
function exportarConversa() {
    const messages = chat.querySelectorAll('.message');
    if (messages.length === 0) {
        showToast('Nenhuma mensagem para exportar.', 'fa-info-circle', 'warning');
        return;
    }

    let text = '=== ELLENCO ASSISTANT - CONVERSA ===\n';
    text += `Data: ${new Date().toLocaleString()}\n\n`;

    messages.forEach(msg => {
        const sender = msg.classList.contains('user') ? 'Você' : 'Ellenco';
        const bubble = msg.querySelector('.message-bubble');
        if (bubble && !bubble.querySelector('canvas')) {
            text += `[${sender}] ${bubble.textContent}\n\n`;
        }
    });

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversa_ellenco_${new Date().toISOString().slice(0,10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);

    showToast('Conversa exportada com sucesso!', 'fa-download', 'success');
}

// =====================================================
// ADICIONAR MENSAGEM
// =====================================================
function adicionarMensagem(texto, tipo) {
    const welcome = document.getElementById("welcome");
    if (welcome) welcome.remove();

    const wrapper = document.createElement("div");
    wrapper.className = `message ${tipo}`;

    const avatar = document.createElement("div");
    avatar.className = "message-avatar";
    avatar.textContent = tipo === "user" ? "U" : "E";

    const bubble = document.createElement("div");
    bubble.className = "message-bubble";
    bubble.style.whiteSpace = "pre-wrap";
    bubble.textContent = texto;

    wrapper.appendChild(avatar);
    wrapper.appendChild(bubble);
    chat.appendChild(wrapper);

    chat.scrollTop = chat.scrollHeight;
    return wrapper;
}

// =====================================================
// MOSTRAR IA DIGITANDO
// =====================================================
function mostrarDigitando() {
    const wrapper = document.createElement("div");
    wrapper.className = "message assistant";
    wrapper.id = "typing";

    const avatar = document.createElement("div");
    avatar.className = "message-avatar";
    avatar.textContent = "E";

    const bubble = document.createElement("div");
    bubble.className = "message-bubble typing-dots";
    bubble.innerHTML = "<span></span><span></span><span></span>";

    wrapper.appendChild(avatar);
    wrapper.appendChild(bubble);
    chat.appendChild(wrapper);

    chat.scrollTop = chat.scrollHeight;
}

function removerDigitando() {
    const typing = document.getElementById("typing");
    if (typing) typing.remove();
}

// =====================================================
// ENVIAR MENSAGEM
// =====================================================
async function enviarMensagem() {
    const mensagem = input.value.trim();

    if (!mensagem || isProcessing || sendBtn.disabled) return;

    // Mostrar mensagem do usuário
    adicionarMensagem(mensagem, "user");

    // Limpar campo
    input.value = "";
    autoResize();
    updateCharCounter();

    // Desativar botão
    isProcessing = true;
    sendBtn.disabled = true;

    // Mostrar animação
    mostrarDigitando();

    try {
        // Tentar resposta local primeiro
        const localResponse = getLocalResponse(mensagem);
        
        if (localResponse) {
            // Pequeno delay para simular processamento
            await new Promise(resolve => setTimeout(resolve, 500));
            removerDigitando();
            processarResposta(localResponse);
        } else {
            // Tentar chamar o backend Node.js
            try {
                const resposta = await chamarIA(mensagem);
                removerDigitando();
                processarResposta(resposta);
            } catch (error) {
                removerDigitando();
                console.error("Erro na IA:", error);
                
                // Fallback final
                const fallbackResponse = getLocalResponse(mensagem);
                if (fallbackResponse) {
                    processarResposta(fallbackResponse);
                } else {
                    adicionarMensagem(
                        "Não consegui conectar ao Assistente Ellenco. Verifique se o servidor Node.js está rodando.\n\nDica: Use 'npm start' para iniciar o servidor.",
                        "assistant"
                    );
                }
            }
        }
    } catch (error) {
        removerDigitando();
        console.error("Erro:", error);
        adicionarMensagem("Ocorreu um erro ao processar sua mensagem.", "assistant");
    } finally {
        isProcessing = false;
        sendBtn.disabled = false;
        input.focus();
    }
}

// =====================================================
// PROCESSAR RESPOSTA
// =====================================================
function processarResposta(resposta) {
    if (!resposta) {
        adicionarMensagem("A IA não retornou uma resposta.", "assistant");
        return;
    }

    // Tentar extrair gráfico
    const dadosGrafico = extrairGrafico(resposta);

    if (dadosGrafico) {
        const texto = removerJSONDaResposta(resposta);
        if (texto.trim()) {
            adicionarMensagem(texto.trim(), "assistant");
        }
        adicionarGrafico(dadosGrafico);
        return;
    }

    adicionarMensagem(resposta, "assistant");
    updateStats();
}

// =====================================================
// EXTRAIR JSON DE GRÁFICO
// =====================================================
function extrairGrafico(texto) {
    let jsonTexto = null;

    // 1. JSON dentro de bloco ```json
    const blocoJSON = texto.match(/```json\s*([\s\S]*?)\s*```/i);
    if (blocoJSON) jsonTexto = blocoJSON[1];

    // 2. JSON dentro de bloco ```
    if (!jsonTexto) {
        const bloco = texto.match(/```\s*([\s\S]*?)\s*```/);
        if (bloco) {
            const conteudo = bloco[1].trim();
            if (conteudo.startsWith("{") && conteudo.endsWith("}")) {
                jsonTexto = conteudo;
            }
        }
    }

    // 3. Procurar objeto JSON diretamente
    if (!jsonTexto) {
        const inicio = texto.indexOf("{");
        const fim = texto.lastIndexOf("}");
        if (inicio !== -1 && fim !== -1 && fim > inicio) {
            const possivelJSON = texto.substring(inicio, fim + 1);
            try {
                const objeto = JSON.parse(possivelJSON);
                if (objeto.tipo && (objeto.valores || objeto.datasets)) {
                    return objeto;
                }
            } catch (error) {}
        }
    }

    if (jsonTexto) {
        try {
            const objeto = JSON.parse(jsonTexto);
            if (objeto.tipo && (objeto.valores || objeto.datasets)) {
                return objeto;
            }
        } catch (error) {
            console.error("JSON de gráfico inválido:", error);
        }
    }

    return null;
}

// =====================================================
// REMOVER JSON DA RESPOSTA
// =====================================================
function removerJSONDaResposta(texto) {
    let resultado = texto.replace(/```json\s*[\s\S]*?\s*```/gi, "");
    resultado = resultado.replace(/```\s*[\s\S]*?\s*```/gi, "");

    const inicio = resultado.indexOf("{");
    const fim = resultado.lastIndexOf("}");
    if (inicio !== -1 && fim !== -1 && fim > inicio) {
        const possivel = resultado.substring(inicio, fim + 1);
        try {
            const objeto = JSON.parse(possivel);
            if (objeto.tipo && (objeto.valores || objeto.datasets)) {
                resultado = resultado.substring(0, inicio) + resultado.substring(fim + 1);
            }
        } catch (error) {}
    }

    return resultado.trim();
}

// =====================================================
// ADICIONAR GRÁFICO
// =====================================================
function adicionarGrafico(dados) {
    const welcome = document.getElementById("welcome");
    if (welcome) welcome.remove();

    const wrapper = document.createElement("div");
    wrapper.className = "message assistant";

    const avatar = document.createElement("div");
    avatar.className = "message-avatar";
    avatar.textContent = "E";

    const bubble = document.createElement("div");
    bubble.className = "message-bubble chart-bubble";
    bubble.style.maxWidth = "min(680px, 90%)";

    const titulo = document.createElement("h3");
    titulo.textContent = dados.titulo || "Dashboard";
    titulo.style.margin = "0 0 12px 0";
    titulo.style.fontSize = "16px";
    titulo.style.color = "#071a35";

    const canvas = document.createElement("canvas");
    canvas.style.width = "100%";
    canvas.style.height = "280px";

    bubble.appendChild(titulo);
    bubble.appendChild(canvas);

    wrapper.appendChild(avatar);
    wrapper.appendChild(bubble);
    chat.appendChild(wrapper);

    let tipo = dados.tipo || "bar";
    if (tipo === "donut") tipo = "doughnut";

    const chartData = {
        labels: dados.labels || [],
        datasets: criarDatasets(dados, tipo)
    };

    const chart = new Chart(canvas, {
        type: tipo,
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 700 },
            plugins: {
                legend: { display: true, position: "bottom" }
            },
            scales: (tipo === "pie" || tipo === "doughnut") ? {} : {
                y: { beginAtZero: true }
            }
        }
    });

    charts.push(chart);
    chat.scrollTop = chat.scrollHeight;
}

// =====================================================
// CRIAR DATASETS
// =====================================================
function criarDatasets(dados, tipo) {
    if (Array.isArray(dados.datasets)) {
        return dados.datasets.map(dataset => ({
            label: dataset.label || "Dados",
            data: dataset.data || [],
            backgroundColor: dataset.backgroundColor || [
                '#0b63ce', '#e21d2f', '#071a35', 
                '#f59e0b', '#10b981', '#8b5cf6'
            ]
        }));
    }

    return [{
        label: dados.unidade || "Valor",
        data: dados.valores || [],
        backgroundColor: [
            '#0b63ce', '#e21d2f', '#071a35', 
            '#f59e0b', '#10b981', '#8b5cf6'
        ]
    }];
}

// =====================================================
// ATUALIZAR STATS
// =====================================================
function updateStats() {
    const prodToday = document.getElementById('prodToday');
    const recordsCount = document.getElementById('recordsCount');

    if (prodToday) {
        const current = parseInt(prodToday.textContent.replace(/[,.]/g, ''));
        if (!isNaN(current)) {
            const increase = Math.floor(Math.random() * 50) + 1;
            prodToday.textContent = (current + increase).toLocaleString();
        }
    }

    if (recordsCount) {
        const current = parseInt(recordsCount.textContent);
        if (!isNaN(current)) {
            recordsCount.textContent = current + Math.floor(Math.random() * 5) + 1;
        }
    }
}

// =====================================================
// CONVERSAR COM NODE.JS
// =====================================================
async function chamarIA(mensagem) {
    const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mensagem: mensagem })
    });

    if (!response.ok) {
        if (response.status === 500) throw new Error("API");
        throw new Error("SERVIDOR");
    }

    const data = await response.json();
    if (data.erro) throw new Error("API");
    return data.resposta;
}

// =====================================================
// INICIALIZAÇÃO
// =====================================================
input.focus();
updateCharCounter();

console.log('🤖 Assistente Ellenco carregado com sucesso!');
console.log('💡 Digite sua dúvida ou clique nas sugestões.');
console.log('📊 O sistema suporta gráficos via Chart.js');
console.log('🔗 Conecte ao backend Node.js para IA completa');