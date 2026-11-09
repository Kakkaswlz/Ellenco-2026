/* ==================================================================== */
/* ELLENCO - EQUIPAMENTOS.JS                                            */
/* Controlador do Painel de Frota, Horímetros & Disponibilidade         */
/* ==================================================================== */

document.addEventListener("DOMContentLoaded", async () => {
    renderSidebar("equipamentos");
    renderTopbar("Equipamentos & Frota", "Controle de horímetro, consumo e manutenção de maquinários", false);
    verificarAutenticacao();
    aplicarPermissoesCargo();

    await carregarEquipamentos();
});

async function carregarEquipamentos() {
    try {
        const equipamentos = await api.getEquipamentos();
        atualizarMetricasFrota(equipamentos);
        renderizarTabelaEquipamentos(equipamentos);
    } catch (e) {
        console.error("Erro ao carregar equipamentos:", e);
        mostrarToast("Erro ao carregar frota.", "erro");
    }
}

function atualizarMetricasFrota(lista) {
    const total = lista.length;
    let operando = 0;
    let manutencao = 0;
    let horimetroTotal = 0;

    lista.forEach(eq => {
        if (eq.status === "Operacional") operando++;
        else if (eq.status === "Em Manutenção") manutencao++;
        horimetroTotal += (parseFloat(eq.horimetro) || 0);
    });

    const elTotal = document.getElementById("statTotalFrota");
    const elOp = document.getElementById("statOperando");
    const elMan = document.getElementById("statManutencao");
    const elHor = document.getElementById("statHorimetroTotal");

    if (elTotal) elTotal.textContent = total;
    if (elOp) elOp.textContent = operando;
    if (elMan) elMan.textContent = manutencao;
    if (elHor) elHor.textContent = `${horimetroTotal.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} h`;
}

function renderizarTabelaEquipamentos(lista) {
    const tbody = document.getElementById("tabelaEquipamentos");
    if (!tbody) return;

    if (!lista.length) {
        tbody.innerHTML = `<tr><td colspan="8" class="p-8 text-center text-xs text-slate-400">Nenhum equipamento cadastrado.</td></tr>`;
        return;
    }

    tbody.innerHTML = lista.map(eq => {
        let badgeStatus = '';
        if (eq.status === "Operacional") {
            badgeStatus = `<span class="badge badge-success"><i class="fa-solid fa-circle-check"></i> Operando</span>`;
        } else if (eq.status === "Em Manutenção") {
            badgeStatus = `<span class="badge badge-danger"><i class="fa-solid fa-wrench"></i> Manutenção</span>`;
        } else {
            badgeStatus = `<span class="badge badge-warning"><i class="fa-solid fa-pause"></i> Em Espera</span>`;
        }

        const horimetro = parseFloat(eq.horimetro) || 0;
        const consumo = eq.consumo_medio || eq.consumoMedio || "18 L/h";
        const revisao = eq.ultima_manutencao || eq.ultimaManutencao || "15/08/2026";

        return `
            <tr class="hover:bg-slate-50 transition-colors">
                <td class="font-mono font-black text-slate-900 text-xs">${escapeHTML(eq.codigo)}</td>
                <td class="font-bold text-slate-800 text-xs">${escapeHTML(eq.tipo)}</td>
                <td class="text-slate-600 text-xs">${escapeHTML(eq.modelo)}</td>
                <td class="text-right font-mono font-black text-slate-900 text-xs">${horimetro.toLocaleString("pt-BR", { minimumFractionDigits: 1 })} h</td>
                <td class="text-right font-mono font-bold text-slate-600 text-xs">${escapeHTML(consumo)}</td>
                <td class="text-slate-700 text-xs">${escapeHTML(eq.local)}</td>
                <td class="text-slate-500 text-xs">${escapeHTML(revisao)}</td>
                <td class="text-center">${badgeStatus}</td>
            </tr>
        `;
    }).join("");
}

function abrirModalNovoEquipamento() {
    const modal = document.getElementById("modalNovoEquipamento");
    if (modal) {
        modal.classList.remove("hidden");
        modal.classList.add("flex");
    }
}

function fecharModalNovoEquipamento() {
    const modal = document.getElementById("modalNovoEquipamento");
    if (modal) {
        modal.classList.add("hidden");
        modal.classList.remove("flex");
    }
}

async function salvarNovoEquipamento(e) {
    e.preventDefault();
    const novo = {
        codigo: document.getElementById("novoEqCodigo").value.trim().toUpperCase(),
        tipo: document.getElementById("novoEqTipo").value.trim(),
        modelo: document.getElementById("novoEqModelo").value.trim(),
        horimetro: parseFloat(document.getElementById("novoEqHorimetro").value) || 0,
        consumo_medio: document.getElementById("novoEqConsumo").value.trim() || "18 L/h",
        local: document.getElementById("novoEqLocal").value,
        status: document.getElementById("novoEqStatus").value,
        ultima_manutencao: new Date().toLocaleDateString("pt-BR")
    };

    try {
        mostrarToast("Cadastrando equipamento no SQLite...", "info");
        await api.postEquipamento(novo);
        mostrarToast("Equipamento cadastrado com sucesso!", "sucesso");
        fecharModalNovoEquipamento();
        document.getElementById("formNovoEquipamento")?.reset();
        await carregarEquipamentos();
    } catch (err) {
        mostrarToast(err.message || "Erro ao cadastrar equipamento.", "erro");
    }
}

window.abrirModalNovoEquipamento = abrirModalNovoEquipamento;
window.fecharModalNovoEquipamento = fecharModalNovoEquipamento;
window.salvarNovoEquipamento = salvarNovoEquipamento;
