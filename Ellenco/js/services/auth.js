/* ==================================================================== */
/* ELLENCO - AUTH.JS                                                    */
/* Gerenciamento de Sessão, Permissões por Cargo & Notificações Toasts */
/* ==================================================================== */

// 1. GESTÃO DE SESSÃO DO USUÁRIO
function getUsuarioLogado() {
    const sessao = localStorage.getItem("ellenco_usuario_sessao");
    if (sessao) {
        try {
            return JSON.parse(sessao);
        } catch (e) {
            console.error("Erro ao carregar sessão:", e);
        }
    }
    return {
        nome: "Carlos Silva",
        re: "RE-8842",
        cargo: "operacional",
        cargoLabel: "Encarregado de Equipe",
        obra: "SP-270 Rodovia Raposo Tavares",
        nivel: 1
    };
}

function salvarSessao(usuario) {
    localStorage.setItem("ellenco_usuario_sessao", JSON.stringify(usuario));
}

function efetuarLogout() {
    localStorage.removeItem("ellenco_usuario_sessao");
    mostrarToast("Sessão finalizada com sucesso.", "info");
    setTimeout(() => {
        window.location.href = "index.html";
    }, 400);
}

function isUsuarioCampo(usuario = getUsuarioLogado()) {
    if (!usuario) return true;
    const cargo = String(usuario.cargo || "").toLowerCase().trim();
    const nivel = Number(usuario.nivel) || 1;
    return cargo === "operacional" || cargo === "apontador" || cargo === "encarregado" || nivel <= 1;
}

function isUsuarioEngenhariaOuDiretoria(usuario = getUsuarioLogado()) {
    return !isUsuarioCampo(usuario);
}

function verificarAutenticacao() {
    const usuario = getUsuarioLogado();
    const nomeEl = document.getElementById("userNomeLabel");
    const cargoEl = document.getElementById("userCargoLabel");

    if (nomeEl) nomeEl.textContent = usuario.nome || "Colaborador";
    if (cargoEl) cargoEl.textContent = usuario.cargoLabel || usuario.obra || "Ellenco Construções";
}

function aplicarPermissoesCargo() {
    const usuario = getUsuarioLogado();
    const paginaAtual = window.location.pathname.split("/").pop() || "";

    // Páginas restritas para a Engenharia / Diretoria
    const paginasRestritasCampo = [
        "historico-auditoria.html",
        "atividades.html",
        "equipes-campo.html",
        "obras-frentes.html",
        "equipamentos-frota.html",
        "aprovacoes-usuarios.html"
    ];

    // Se usuário for do Campo / Apontamento e tentar abrir página restrita via URL direta
    if (isUsuarioCampo(usuario) && paginasRestritasCampo.includes(paginaAtual)) {
        mostrarToast("Acesso restrito à Engenharia e Diretoria.", "warning");
        setTimeout(() => {
            window.location.href = "novo-apontamento.html";
        }, 300);
        return;
    }

    // Gestão de Acessos é exclusiva para Gestores / Diretoria (nível >= 3)
    if (paginaAtual === "aprovacoes-usuarios.html" && usuario.nivel < 3 && usuario.cargo !== "gestor") {
        mostrarToast("Acesso exclusivo para Gestores e Diretoria.", "warning");
        setTimeout(() => {
            window.location.href = "dashboard.html";
        }, 300);
    }
}

// 2. SISTEMA GLOBAL DE NOTIFICAÇÕES (TOAST)
function mostrarToast(mensagem, tipo = "info") {
    let container = document.getElementById("toastContainer");
    if (!container) {
        container = document.createElement("div");
        container.id = "toastContainer";
        container.className = "fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none";
        document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    
    const cores = {
        sucesso: "bg-emerald-600 text-white border-emerald-500 shadow-emerald-900/20",
        success: "bg-emerald-600 text-white border-emerald-500 shadow-emerald-900/20",
        erro: "bg-red-600 text-white border-red-700 shadow-red-900/20",
        error: "bg-red-600 text-white border-red-700 shadow-red-900/20",
        warning: "bg-amber-500 text-white border-amber-600 shadow-amber-900/20",
        aviso: "bg-amber-500 text-white border-amber-600 shadow-amber-900/20",
        info: "bg-[#0A2342] text-white border-[#123F70] shadow-black/20"
    };

    const icones = {
        sucesso: "fa-solid fa-circle-check text-emerald-200",
        success: "fa-solid fa-circle-check text-emerald-200",
        erro: "fa-solid fa-circle-xmark text-red-200",
        error: "fa-solid fa-circle-xmark text-red-200",
        warning: "fa-solid fa-triangle-exclamation text-amber-200",
        aviso: "fa-solid fa-triangle-exclamation text-amber-200",
        info: "fa-solid fa-circle-info text-blue-200"
    };

    toast.className = `flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl text-xs font-bold animate-fade-in-up transition-all duration-300 pointer-events-auto ${cores[tipo] || cores.info}`;
    toast.innerHTML = `<i class="${icones[tipo] || icones.info} text-base shrink-0"></i> <span class="leading-tight">${mensagem}</span>`;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateY(8px)";
        setTimeout(() => toast.remove(), 250);
    }, 3500);
}

// 3. MODAL DE NOTIFICAÇÕES
function abrirNotificacoes() {
    const modal = document.getElementById("modalNotificacoes");
    if (modal) {
        modal.classList.remove("hidden");
        modal.classList.add("flex");
    }
}

function fecharNotificacoes() {
    const modal = document.getElementById("modalNotificacoes");
    if (modal) {
        modal.classList.add("hidden");
        modal.classList.remove("flex");
    }
}

window.getUsuarioLogado = getUsuarioLogado;
window.salvarSessao = salvarSessao;
window.efetuarLogout = efetuarLogout;
window.isUsuarioCampo = isUsuarioCampo;
window.isUsuarioEngenhariaOuDiretoria = isUsuarioEngenhariaOuDiretoria;
window.verificarAutenticacao = verificarAutenticacao;
window.aplicarPermissoesCargo = aplicarPermissoesCargo;
window.mostrarToast = mostrarToast;
window.abrirNotificacoes = abrirNotificacoes;
window.fecharNotificacoes = fecharNotificacoes;