/* ==================================================================== */
/* ELLENCO - CHATBOT.JS                                                 */
/* Componente Reutilizável de Agente de IA com Memória e Gráficos      */
/* ==================================================================== */

(function () {
    let chatHistory = [];
    let chatInstances = [];
    let isWaitingResponse = false;

    function inicializarChatbot() {
        if (document.getElementById("ellencoChatbotTrigger")) return;

        // 1. Injetar Botão Flutuante
        const trigger = document.createElement("div");
        trigger.id = "ellencoChatbotTrigger";
        trigger.title = "Abrir Assistente Inteligente Ellenco";
        trigger.innerHTML = `
            <div class="trigger-icon"><i class="fa-solid fa-robot"></i></div>
            <span class="trigger-text hidden sm:inline">Assistente IA</span>
            <span class="trigger-badge"></span>
        `;
        trigger.onclick = toggleChatbotWindow;
        document.body.appendChild(trigger);

        // 2. Injetar Janela do Chat
        const chatWindow = document.createElement("div");
        chatWindow.id = "ellencoChatbotWindow";
        chatWindow.className = "chatbot-hidden";
        chatWindow.innerHTML = `
            <!-- HEADER -->
            <div class="chatbot-header">
                <div class="chatbot-header-info">
                    <div class="chatbot-avatar-header">
                        <i class="fa-solid fa-robot"></i>
                    </div>
                    <div>
                        <h4 class="font-extrabold text-sm tracking-tight leading-tight">Assistente Ellenco</h4>
                        <span class="text-[10px] text-emerald-300 font-bold flex items-center gap-1">
                            <span class="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Banco & IA Conectados
                        </span>
                    </div>
                </div>
                <div class="chatbot-header-actions">
                    <button onclick="window.ellencoChat.limparConversa()" class="chatbot-header-btn" title="Limpar conversa">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                    <button onclick="window.ellencoChat.exportarConversa()" class="chatbot-header-btn" title="Exportar histórico">
                        <i class="fa-solid fa-download"></i>
                    </button>
                    <button onclick="window.ellencoChat.toggle()" class="chatbot-header-btn" title="Fechar">
                        <i class="fa-solid fa-xmark text-sm"></i>
                    </button>
                </div>
            </div>

            <!-- MENSAGENS -->
            <div id="chatbotMessagesList" class="chatbot-messages">
                <!-- Boas-vindas Inicial -->
                <div class="chat-message assistant">
                    <div class="chat-avatar"><i class="fa-solid fa-robot"></i></div>
                    <div class="chat-bubble space-y-2">
                        <p><strong>Olá! Sou o Assistente Inteligente da Ellenco.</strong></p>
                        <p class="text-xs text-slate-600">Estou conectado em tempo real ao banco de dados configurado para responder dúvidas sobre produção, apontamentos, equipes, frotas e ocorrências.</p>
                        
                        <div class="pt-2">
                            <span class="text-[10px] uppercase font-bold text-slate-400 block mb-1">Perguntas Rápidas:</span>
                            <div class="chatbot-suggestions">
                                <button onclick="window.ellencoChat.enviarSugestao('Qual é o desvio geral da produção?')" class="chatbot-chip">
                                    <i class="fa-solid fa-chart-pie text-blue-600"></i> Desvio Geral
                                </button>
                                <button onclick="window.ellencoChat.enviarSugestao('Quais foram os últimos apontamentos?')" class="chatbot-chip">
                                    <i class="fa-solid fa-clock-rotate-left text-amber-600"></i> Últimos BDPs
                                </button>
                                <button onclick="window.ellencoChat.enviarSugestao('Existe algum equipamento em manutenção?')" class="chatbot-chip">
                                    <i class="fa-solid fa-wrench text-red-600"></i> Frota & Manutenção
                                </button>
                                <button onclick="window.ellencoChat.enviarSugestao('Quais ocorrências e paradas foram registradas?')" class="chatbot-chip">
                                    <i class="fa-solid fa-triangle-exclamation text-ellenco-red"></i> Ocorrências
                                </button>
                                <button onclick="window.ellencoChat.enviarSugestao('Gerar gráfico de produção diária')" class="chatbot-chip">
                                    <i class="fa-solid fa-chart-line text-emerald-600"></i> Gráfico de Produção
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- INPUT BAR -->
            <div class="chatbot-input-bar">
                <div class="chatbot-input-wrapper">
                    <textarea id="chatbotInputText" rows="1" placeholder="Pergunte sobre produção, metas, máquinas ou obras..." class="chatbot-textarea"></textarea>
                    <button id="chatbotSendBtn" onclick="window.ellencoChat.enviarMensagem()" class="chatbot-send-btn" title="Enviar Mensagem">
                        <i class="fa-solid fa-paper-plane text-xs"></i>
                    </button>
                </div>
                <div class="flex justify-between items-center px-1 pt-1 text-[10px] text-slate-400">
                    <span>Pressione <strong>Enter</strong> para enviar</span>
                    <span id="chatbotCharCounter">0/500</span>
                </div>
            </div>
        `;
        document.body.appendChild(chatWindow);

        // Listeners do textarea
        const textarea = document.getElementById("chatbotInputText");
        if (textarea) {
            textarea.addEventListener("keydown", (e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    enviarMensagem();
                }
            });
            textarea.addEventListener("input", () => {
                textarea.style.height = "auto";
                textarea.style.height = Math.min(textarea.scrollHeight, 100) + "px";
                const counter = document.getElementById("chatbotCharCounter");
                if (counter) counter.textContent = `${textarea.value.length}/500`;
            });
        }
    }

    function toggleChatbotWindow() {
        const win = document.getElementById("ellencoChatbotWindow");
        if (!win) return;
        win.classList.toggle("chatbot-hidden");
        if (!win.classList.contains("chatbot-hidden")) {
            const input = document.getElementById("chatbotInputText");
            if (input) setTimeout(() => input.focus(), 150);
        }
    }

    async function enviarMensagem() {
        const input = document.getElementById("chatbotInputText");
        const sendBtn = document.getElementById("chatbotSendBtn");
        if (!input || !sendBtn) return;

        const texto = input.value.trim();
        if (!texto || isWaitingResponse) return;

        // 1. Exibe Mensagem do Usuário
        adicionarMensagemUI(texto, "user");
        input.value = "";
        input.style.height = "auto";
        const counter = document.getElementById("chatbotCharCounter");
        if (counter) counter.textContent = "0/500";

        isWaitingResponse = true;
        sendBtn.disabled = true;

        // 2. Exibe Typing Indicator
        mostrarTypingUI();

        try {
            const usuarioLogado = (typeof getUsuarioLogado === "function") ? getUsuarioLogado() : { nome: "Carlos Silva", cargo: "Encarregado de Equipe" };
            
            // 3. Chamada ao endpoint /api/chat
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    mensagem: texto,
                    historico: chatHistory,
                    usuarioLogado
                })
            });

            removerTypingUI();

            if (!res.ok) {
                throw new Error("Erro na resposta do servidor");
            }

            const data = await res.json();
            const respostaTexto = data.resposta || "Não obtive resposta do assistente.";

            // Salva no histórico
            chatHistory.push({ role: "user", text: texto });
            chatHistory.push({ role: "model", text: respostaTexto });

            // 4. Processa e exibe resposta (com suporte a gráficos Chart.js embutidos)
            processarRespostaAssistente(respostaTexto);

        } catch (err) {
            removerTypingUI();
            console.error("Erro ao chamar chatbot:", err);
            adicionarMensagemUI("⚠️ Desculpe, ocorreu um erro ao consultar os dados. Verifique a conexão com o servidor Node.js.", "assistant");
        } finally {
            isWaitingResponse = false;
            sendBtn.disabled = false;
            input.focus();
        }
    }

    function enviarSugestao(texto) {
        const input = document.getElementById("chatbotInputText");
        if (input) {
            input.value = texto;
            enviarMensagem();
        }
    }

    function adicionarMensagemUI(conteudo, tipo) {
        const container = document.getElementById("chatbotMessagesList");
        if (!container) return;

        const wrapper = document.createElement("div");
        wrapper.className = `chat-message ${tipo}`;

        const avatar = document.createElement("div");
        avatar.className = "chat-avatar";
        avatar.innerHTML = tipo === "user" ? `<i class="fa-solid fa-user"></i>` : `<i class="fa-solid fa-robot"></i>`;

        const bubble = document.createElement("div");
        bubble.className = "chat-bubble";

        if (tipo === "user") {
            bubble.textContent = conteudo;
        } else {
            bubble.innerHTML = formatarMarkdownBasico(conteudo);
        }

        wrapper.appendChild(avatar);
        wrapper.appendChild(bubble);
        container.appendChild(wrapper);

        container.scrollTop = container.scrollHeight;
        return bubble;
    }

    function mostrarTypingUI() {
        const container = document.getElementById("chatbotMessagesList");
        if (!container || document.getElementById("chatbotTypingIndicator")) return;

        const wrapper = document.createElement("div");
        wrapper.id = "chatbotTypingIndicator";
        wrapper.className = "chat-message assistant";
        wrapper.innerHTML = `
            <div class="chat-avatar"><i class="fa-solid fa-robot"></i></div>
            <div class="chat-typing">
                <span></span><span></span><span></span>
            </div>
        `;
        container.appendChild(wrapper);
        container.scrollTop = container.scrollHeight;
    }

    function removerTypingUI() {
        const el = document.getElementById("chatbotTypingIndicator");
        if (el) el.remove();
    }

    function formatarMarkdownBasico(texto) {
        if (!texto) return "";
        let formatado = escapeHTML(texto)
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            .replace(/\n\n/g, '<br><br>')
            .replace(/\n•/g, '<br>•')
            .replace(/\n-/g, '<br>-')
            .replace(/\n/g, '<br>');
        return formatado;
    }

    function processarRespostaAssistente(resposta) {
        // Extrai JSON de gráfico se presente
        const dadosGrafico = extrairGrafico(resposta);
        const textoSemJSON = removerJSONDaResposta(resposta);

        const bubble = adicionarMensagemUI(textoSemJSON || "Gráfico gerado com base nos dados do banco:", "assistant");

        if (dadosGrafico && bubble) {
            renderizarGraficoNoChat(dadosGrafico, bubble);
        }
    }

    function extrairGrafico(texto) {
        const bloco = texto.match(/```json\s*([\s\S]*?)\s*```/i) || texto.match(/```\s*([\s\S]*?)\s*```/);
        if (bloco) {
            try {
                const obj = JSON.parse(bloco[1]);
                if (obj.tipo && (obj.valores || obj.datasets)) return obj;
            } catch (e) {}
        }
        return null;
    }

    function removerJSONDaResposta(texto) {
        return texto.replace(/```json\s*[\s\S]*?\s*```/gi, "").replace(/```\s*[\s\S]*?\s*```/gi, "").trim();
    }

    function renderizarGraficoNoChat(dados, bubbleElement) {
        const card = document.createElement("div");
        card.className = "chat-chart-card";

        const title = document.createElement("h5");
        title.className = "font-black text-xs text-slate-900 mb-2";
        title.textContent = dados.titulo || "Visualização de Produção";

        const wrapper = document.createElement("div");
        wrapper.className = "chat-chart-canvas-wrapper";

        const canvas = document.createElement("canvas");
        wrapper.appendChild(canvas);
        card.appendChild(title);
        card.appendChild(wrapper);
        bubbleElement.appendChild(card);

        const tipo = dados.tipo === "donut" ? "doughnut" : (dados.tipo || "bar");
        
        let datasets = [];
        if (Array.isArray(dados.datasets)) {
            datasets = dados.datasets;
        } else {
            datasets = [{
                label: dados.unidade || "Produção",
                data: dados.valores || [],
                backgroundColor: ["#0A2342", "#123F70", "#E51920", "#10B981", "#F59E0B"]
            }];
        }

        try {
            const chart = new Chart(canvas, {
                type: tipo,
                data: {
                    labels: dados.labels || [],
                    datasets: datasets
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: "bottom", labels: { boxWidth: 8, font: { size: 9 } } }
                    }
                }
            });
            chatInstances.push(chart);
        } catch (e) {
            console.error("Erro ao desenhar gráfico no chat:", e);
        }
    }

    function limparConversa() {
        chatHistory = [];
        chatInstances.forEach(c => { try { c.destroy(); } catch (e) {} });
        chatInstances = [];

        const container = document.getElementById("chatbotMessagesList");
        if (container) {
            container.innerHTML = `
                <div class="chat-message assistant">
                    <div class="chat-avatar"><i class="fa-solid fa-robot"></i></div>
                    <div class="chat-bubble space-y-2">
                        <p><strong>Conversa reiniciada.</strong></p>
                        <p class="text-xs text-slate-600">Como posso ajudar com os registros do banco de dados agora?</p>
                    </div>
                </div>
            `;
        }
    }

    function exportarConversa() {
        if (!chatHistory.length) {
            if (typeof mostrarToast === "function") mostrarToast("Nenhuma mensagem para exportar.", "info");
            return;
        }
        let conteudo = `=== CONVERSA ASSISTENTE ELLENCO ===\nData: ${new Date().toLocaleString('pt-BR')}\n\n`;
        chatHistory.forEach(msg => {
            conteudo += `[${msg.role === 'user' ? 'USUÁRIO' : 'ASSISTENTE'}]:\n${msg.text}\n\n`;
        });

        const blob = new Blob([conteudo], { type: "text/plain;charset=utf-8" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `Conversa_Assistente_Ellenco_${new Date().toISOString().split("T")[0]}.txt`;
        a.click();
    }

    // Exporta API pública do Chatbot
    window.ellencoChat = {
        toggle: toggleChatbotWindow,
        enviarMensagem: enviarMensagem,
        enviarSugestao: enviarSugestao,
        limparConversa: limparConversa,
        exportarConversa: exportarConversa
    };

    // Auto-inicialização ao carregar o DOM
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", inicializarChatbot);
    } else {
        inicializarChatbot();
    }
})();
