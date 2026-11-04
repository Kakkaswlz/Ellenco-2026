/* ==================================================================== */
/* ELLENCO - TOPBAR.JS                                                  */
/* Componente Reutilizável de Cabeçalho Superior                        */
/* ==================================================================== */

function renderTopbar(titulo = "Dashboard & KPIs", subtitulo = "Monitoramento em tempo real do planejado vs executado", showFilters = true) {
    const header = document.getElementById("topbar");
    if (!header) return;

    header.className = "app-topbar h-18 bg-white border-b border-slate-200/80 flex items-center justify-between px-4 md:px-8 sticky top-0 z-30 shadow-xs";
    header.innerHTML = `
        <div class="flex items-center gap-3.5">
            <button onclick="toggleSidebar()" class="md:hidden text-slate-700 hover:text-slate-900 p-2 rounded-xl bg-slate-100 cursor-pointer">
                <i class="fa-solid fa-bars text-lg"></i>
            </button>

            <div>
                <h1 id="tituloPagina" class="text-base md:text-xl font-extrabold text-slate-900 tracking-tight leading-tight">
                    ${titulo}
                </h1>
                <p id="subtituloPagina" class="text-[11px] text-slate-500 font-medium hidden sm:block">
                    ${subtitulo}
                </p>
            </div>
        </div>

        <div class="flex items-center gap-2.5 md:gap-4">
            ${showFilters ? `
            <!-- FILTROS GLOBAIS DE OBRA E PERÍODO -->
            <div class="hidden lg:flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200 text-xs">
                <i class="fa-regular fa-calendar text-slate-400 pl-1.5"></i>
                <select id="filtroGlobalPeriodo" onchange="dispararFiltroGlobal()" class="bg-transparent font-semibold text-slate-700 outline-none cursor-pointer pr-1">
                    <option value="todos">Todo o Período</option>
                    <option value="hoje" selected>Hoje</option>
                    <option value="semana">Esta Semana</option>
                    <option value="mes">Este Mês</option>
                </select>
                <span class="text-slate-300">|</span>
                <i class="fa-solid fa-helmet-safety text-slate-400"></i>
                <select id="filtroGlobalObra" onchange="dispararFiltroGlobal()" class="bg-transparent font-semibold text-slate-700 outline-none cursor-pointer max-w-[170px] truncate pr-1">
                    <option value="todas">Todas as Obras</option>
                    <option value="SP-270 Rodovia Raposo Tavares">SP-270 Raposo Tavares</option>
                    <option value="Loteamento Jardim Ellenco">Jardim Ellenco</option>
                    <option value="Pavimentação Industrial">Pavimentação Industrial</option>
                    <option value="Aeroporto Estadual">Aeroporto Estadual</option>
                </select>
            </div>
            ` : ''}

            <!-- BOTÃO DE NOVO APONTAMENTO RÁPIDO -->
            <a href="novo-apontamento.html" class="bg-[#0A2342] hover:bg-[#123F70] text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-2 transition-all shadow-md shadow-[#0A2342]/15">
                <i class="fa-solid fa-plus text-[#E51920]"></i>
                <span class="hidden sm:inline">Novo Apontamento</span>
            </a>

            <!-- SINO DE NOTIFICAÇÕES & ALERTAS -->
            <button onclick="abrirNotificacoes()" title="Notificações Operacionais" class="relative p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer">
                <i class="fa-regular fa-bell text-base"></i>
                <span id="contadorAlertas" class="absolute -top-1 -right-1 h-4 w-4 bg-[#E51920] text-white text-[9px] font-black rounded-full flex items-center justify-center badge-pulse">
                    3
                </span>
            </button>
        </div>
    `;

    // Garante existência do modal de notificações
    let modalNotif = document.getElementById("modalNotificacoes");
    if (!modalNotif) {
        modalNotif = document.createElement("div");
        modalNotif.id = "modalNotificacoes";
        modalNotif.className = "fixed inset-0 z-50 hidden items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in-up";
        modalNotif.innerHTML = `
            <div class="bg-white rounded-3xl max-w-md w-full shadow-2xl p-6 space-y-4 border border-slate-100">
                <div class="flex justify-between items-center border-b border-slate-100 pb-3">
                    <div class="flex items-center gap-2">
                        <i class="fa-solid fa-bell text-[#E51920]"></i>
                        <h3 class="font-extrabold text-slate-900 text-base">Notificações Operacionais</h3>
                    </div>
                    <button onclick="fecharNotificacoes()" class="text-slate-400 hover:text-slate-600 cursor-pointer"><i class="fa-solid fa-xmark text-lg"></i></button>
                </div>
                <div class="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                    <div class="p-3 bg-red-50 rounded-xl border border-red-100 flex gap-3 items-start">
                        <i class="fa-solid fa-triangle-exclamation text-[#E51920] mt-0.5"></i>
                        <div>
                            <p class="text-xs font-bold text-slate-900">Alerta de Desvio Crítico (-11.4%)</p>
                            <p class="text-[11px] text-slate-600">Equipe Base 03 na Pavimentação Industrial registrou parada para manutenção.</p>
                            <span class="text-[10px] text-slate-400 font-medium">Há 25 minutos</span>
                        </div>
                    </div>
                    <div class="p-3 bg-amber-50 rounded-xl border border-amber-100 flex gap-3 items-start">
                        <i class="fa-solid fa-user-plus text-amber-600 mt-0.5"></i>
                        <div>
                            <p class="text-xs font-bold text-slate-900">Nova Solicitação de Acesso</p>
                            <p class="text-[11px] text-slate-600">Colaborador Lucas Medeiros (RE-9920) aguarda validação de perfil.</p>
                            <span class="text-[10px] text-slate-400 font-medium">Há 1 hora</span>
                        </div>
                    </div>
                    <div class="p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex gap-3 items-start">
                        <i class="fa-solid fa-circle-check text-emerald-600 mt-0.5"></i>
                        <div>
                            <p class="text-xs font-bold text-slate-900">Meta Superada em Pavimentação</p>
                            <p class="text-[11px] text-slate-600">Equipe Pavimentação 01 atingiu 520 ton de CBUQ na SP-270 (+4%).</p>
                            <span class="text-[10px] text-slate-400 font-medium">Há 3 horas</span>
                        </div>
                    </div>
                </div>
                <button onclick="fecharNotificacoes()" class="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer transition-colors">
                    Fechar Notificações
                </button>
            </div>
        `;
        document.body.appendChild(modalNotif);
    }
}

function dispararFiltroGlobal() {
    const periodo = document.getElementById("filtroGlobalPeriodo")?.value || "todos";
    const obra = document.getElementById("filtroGlobalObra")?.value || "todas";

    if (typeof window.onFiltroGlobalAlterado === "function") {
        window.onFiltroGlobalAlterado({ periodo, obra });
    }
}

window.renderTopbar = renderTopbar;
window.dispararFiltroGlobal = dispararFiltroGlobal;
