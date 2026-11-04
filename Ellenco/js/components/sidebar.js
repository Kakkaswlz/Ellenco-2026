/* ==================================================================== */
/* ELLENCO - SIDEBAR.JS                                                 */
/* Componente Reutilizável de Barra Lateral de Navegação                */
/* ==================================================================== */

function renderSidebar(activePage = "dashboard") {
    const aside = document.getElementById("sidebar");
    if (!aside) return;

    const usuario = (typeof getUsuarioLogado === "function") ? getUsuarioLogado() : {
        nome: "Carlos Silva",
        cargoLabel: "Encarregado de Equipe",
        nivel: 1
    };

    const iniciais = usuario.nome
        ? usuario.nome.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()
        : "CS";

    const menuItems = [
        {
            id: "dashboard",
            url: "dashboard.html",
            icon: "fa-solid fa-chart-pie",
            label: "Dashboard & KPIs"
        },
        {
            id: "apontamento",
            url: "novo-apontamento.html",
            icon: "fa-solid fa-clipboard-check",
            label: "Novo Apontamento",
            badge: "BDP"
        },
        {
            id: "historico",
            url: "historico-auditoria.html",
            icon: "fa-solid fa-clock-rotate-left",
            label: "Histórico & Auditoria"
        },
        {
            id: "equipes",
            url: "equipes-campo.html",
            icon: "fa-solid fa-users-gear",
            label: "Equipes de Campo"
        },
        {
            id: "obras",
            url: "obras-frentes.html",
            icon: "fa-solid fa-road-bridge",
            label: "Obras & Frentes"
        },
        {
            id: "equipamentos",
            url: "equipamentos-frota.html",
            icon: "fa-solid fa-truck-monster",
            label: "Equipamentos & Frota"
        },
        {
            id: "aprovacoes",
            url: "aprovacoes-usuarios.html",
            icon: "fa-solid fa-user-shield",
            label: "Gestão de Acessos",
            badge: "Gestão",
            restrito: true
        }
    ];

    let navHtml = menuItems.map(item => {
        const isActive = activePage === item.id;
        const activeClasses = isActive
            ? "menu-item active w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-left"
            : "menu-item w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-left";

        const restritoClass = item.restrito ? "menu-item-aprovacoes" : "";

        return `
            <a href="${item.url}" class="${activeClasses} ${restritoClass}">
                <i class="${item.icon} text-base w-5 text-center"></i>
                <span class="text-xs font-semibold">${item.label}</span>
                ${item.badge ? `<span class="ml-auto bg-white/10 text-white text-[10px] font-bold px-2 py-0.5 rounded-full border border-white/10">${item.badge}</span>` : ''}
            </a>
        `;
    }).join("");

    aside.className = "sidebar-transition fixed inset-y-0 left-0 z-50 w-64 gradient-brand text-white flex flex-col justify-between -translate-x-full md:translate-x-0 shadow-2xl border-r border-white/10";
    aside.innerHTML = `
        <div>
            <!-- BRANDING / LOGO CONTAINER -->
            <div class="p-5 border-b border-white/10 flex flex-col items-center justify-center">
                <a href="dashboard.html" class="brand-logo-box w-full flex items-center justify-center bg-white rounded-xl p-3 shadow-md group cursor-pointer">
                    <img src="../IMG/logo.png" alt="Ellenco" class="brand-logo" onerror="this.onerror=null; this.src='logo.png';">
                </a>
                <div class="mt-3 flex items-center gap-2">
                    <span class="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span class="text-[10px] font-bold tracking-widest text-slate-300 uppercase">Gestão Digital de Obras</span>
                </div>
            </div>

            <!-- NAV MENU -->
            <nav class="p-4 space-y-1 font-medium">
                ${navHtml}
            </nav>
        </div>

        <!-- USER PROFILE & SYSTEM STATUS -->
        <div class="p-4 border-t border-white/10 bg-black/20">
            <div class="flex items-center justify-between gap-3">
                <div class="flex items-center gap-3 overflow-hidden">
                    <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#E51920] to-orange-500 flex items-center justify-center text-white font-black text-sm shadow-md shrink-0">
                        ${iniciais}
                    </div>
                    <div class="flex flex-col justify-center overflow-hidden">
                        <p id="userNomeLabel" class="font-bold text-xs truncate text-white leading-tight">${usuario.nome}</p>
                        <p id="userCargoLabel" class="text-[10px] text-slate-300 truncate leading-tight mt-0.5">${usuario.cargoLabel || 'Ellenco Construções'}</p>
                    </div>
                </div>
                <button onclick="efetuarLogout()" title="Sair do Sistema" class="p-2 rounded-lg bg-white/10 hover:bg-red-500/30 text-white transition-colors cursor-pointer shrink-0">
                    <i class="fa-solid fa-power-off text-red-400 text-sm"></i>
                </button>
            </div>
            <div class="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-300">
                <span class="flex items-center gap-1.5"><i class="fa-solid fa-database text-emerald-400"></i> SQLite Ativo</span>
                <span class="bg-white/10 px-2 py-0.5 rounded font-mono font-bold">v2.5 Digital</span>
            </div>
        </div>
    `;

    // Garante existência do backdrop mobile
    let backdrop = document.getElementById("sidebarBackdrop");
    if (!backdrop) {
        backdrop = document.createElement("div");
        backdrop.id = "sidebarBackdrop";
        backdrop.onclick = toggleSidebar;
        backdrop.className = "fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 hidden md:hidden";
        document.body.appendChild(backdrop);
    }
}

function toggleSidebar() {
    const sb = document.getElementById("sidebar");
    const bd = document.getElementById("sidebarBackdrop");
    if (sb) {
        sb.classList.toggle("-translate-x-full");
    }
    if (bd) {
        bd.classList.toggle("hidden");
    }
}

window.renderSidebar = renderSidebar;
window.toggleSidebar = toggleSidebar;
