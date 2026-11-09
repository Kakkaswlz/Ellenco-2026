/* ==================================================================== */
/* ELLENCO - LOGIN.JS                                                   */
/* Controlador da Tela de Autenticação, Cadastro e Consulta de Status   */
/* ==================================================================== */

function alternarAbaAuth(aba) {
    const boxLogin = document.getElementById("boxFormLogin");
    const boxCad = document.getElementById("boxFormCadastro");
    const boxStatus = document.getElementById("boxFormStatus");
    const btnLogin = document.getElementById("tabBtnLogin");
    const btnCad = document.getElementById("tabBtnCadastro");
    const btnStatus = document.getElementById("tabBtnStatus");

    const activeClass = "py-2 rounded-lg text-xs font-bold transition-all bg-white text-ellenco-navy shadow-xs cursor-pointer";
    const inactiveClass = "py-2 rounded-lg text-xs font-bold text-slate-500 hover:text-slate-900 transition-all cursor-pointer";

    if (!boxLogin || !boxCad || !boxStatus) return;

    boxLogin.classList.add("hidden");
    boxCad.classList.add("hidden");
    boxStatus.classList.add("hidden");

    btnLogin.className = inactiveClass;
    btnCad.className = inactiveClass;
    btnStatus.className = inactiveClass;

    if (aba === "login") {
        boxLogin.classList.remove("hidden");
        btnLogin.className = activeClass;
    } else if (aba === "cadastro") {
        boxCad.classList.remove("hidden");
        btnCad.className = activeClass;
    } else if (aba === "status") {
        boxStatus.classList.remove("hidden");
        btnStatus.className = activeClass;
    }
}

function toggleSenhaVisibilidade(inputId, btnEl) {
    const input = document.getElementById(inputId);
    if (!input) return;
    const icon = btnEl.querySelector("i");
    if (input.type === "password") {
        input.type = "text";
        if (icon) {
            icon.classList.remove("fa-eye");
            icon.classList.add("fa-eye-slash");
        }
    } else {
        input.type = "password";
        if (icon) {
            icon.classList.remove("fa-eye-slash");
            icon.classList.add("fa-eye");
        }
    }
}

function obterRotorCargo(cargoVal) {
    const mapa = {
        apontador: { label: "Apontador de Campo", nivel: 1 },
        encarregado: { label: "Encarregado de Equipe", nivel: 1 },
        supervisor: { label: "Supervisor de Campo", nivel: 2 },
        engenheiro: { label: "Engenheiro de Produção", nivel: 3 },
        gestor: { label: "Diretor / Gestor de Obras", nivel: 4 }
    };
    return mapa[cargoVal] || { label: "Colaborador", nivel: 1 };
}

async function efetuarLogin(e) {
    e.preventDefault();
    const reInput = document.getElementById("loginRE").value.trim();
    const senha = document.getElementById("loginSenha").value;
    const perfil = document.getElementById("loginPerfil").value;
    const codigoObra = document.getElementById("loginCodigoObra").value.trim() || "SP-270 Rodovia Raposo Tavares";

    try {
        mostrarToast("Verificando credenciais...", "info");
        const usuario = await api.loginUsuario(reInput, senha);
        
        // Se conectou, complementa com a obra selecionada se aplicável
        if (!usuario.obra || usuario.obra === 'Matriz / Todas as Obras') {
            usuario.obra = codigoObra;
        }

        salvarSessao(usuario);
        mostrarToast(`Bem-vindo, ${usuario.nome}! Redirecionando...`, "sucesso");
        setTimeout(() => {
            window.location.href = "dashboard.html";
        }, 600);
    } catch (err) {
        // Se falhar a autenticação restrita, mas o usuário estiver testando com demo:
        if (senha === "123" && !(await api.isOnline())) {
            const usuarioDemo = {
                nome: perfil === "operacional" ? "Carlos Silva" : "Eng. Ricardo Viana",
                re: reInput || (perfil === "operacional" ? "RE-8842" : "RE-1005"),
                cargo: perfil,
                cargoLabel: perfil === "operacional" ? "Encarregado de Equipe" : "Diretor de Operações",
                nivel: perfil === "operacional" ? 1 : 4,
                obra: codigoObra
            };
            salvarSessao(usuarioDemo);
            mostrarToast("Login efetuado com sucesso! Redirecionando...", "sucesso");
            setTimeout(() => {
                window.location.href = "dashboard.html";
            }, 500);
            return;
        }
        mostrarToast(err.message || "Erro ao efetuar login.", "erro");
    }
}

async function loginRapido(perfilTipo) {
    const credencial = perfilTipo === "operacional" ? "RE-8842" : "RE-1005";
    try {
        const usuario = await api.loginUsuario(credencial, "123");
        salvarSessao(usuario);
        mostrarToast(`Acesso rápido (${usuario.cargoLabel})! Redirecionando...`, "sucesso");
        setTimeout(() => { window.location.href = "dashboard.html"; }, 400);
    } catch (err) {
        mostrarToast(err.message || "Não foi possível entrar com a conta de demonstração.", "erro");
    }
}
async function efetuarCadastro(e) {
    e.preventDefault();
    const senha1 = document.getElementById("cadSenha").value;
    const senha2 = document.getElementById("cadSenhaConfirma").value;

    if (senha1 !== senha2) {
        mostrarToast("As senhas informadas não coincidem!", "erro");
        return;
    }

    const re = document.getElementById("cadRE").value.trim();
    const email = document.getElementById("cadEmail").value.trim().toLowerCase();
    const cargoVal = document.getElementById("cadCargo").value;
    const infoCargo = obterRotorCargo(cargoVal);

    const dados = {
        nome: document.getElementById("cadNome").value.trim(),
        re: re,
        email: email,
        telefone: document.getElementById("cadTelefone").value.trim(),
        cargo: cargoVal,
        cargo_label: infoCargo.label,
        nivel: infoCargo.nivel,
        obra: document.getElementById("cadObra").value,
        senha: senha1,
        status: "pendente"
    };

    try {
        mostrarToast("Gravando cadastro no banco de dados...", "info");
        await api.cadastrarUsuario(dados);
        mostrarToast("Cadastro enviado com sucesso! Aguarde aprovação.", "sucesso");
        document.getElementById("formCadastro").reset();
        document.getElementById("consultaStatusRE").value = re;
        alternarAbaAuth("status");
        await consultarStatusSolicitacao();
    } catch (err) {
        mostrarToast(err.message || "Erro ao cadastrar usuário.", "erro");
    }
}

async function consultarStatusSolicitacao() {
    const termo = document.getElementById("consultaStatusRE").value.trim();
    const resBox = document.getElementById("resultadoConsultaStatus");

    if (!termo) {
        mostrarToast("Informe seu RE, CPF ou E-mail para consultar.", "info");
        return;
    }

    resBox.classList.remove("hidden");

    try {
        mostrarToast("Consultando banco de dados...", "info");
        const conta = await api.consultarStatusUsuario(termo);

        let badgeStatus = '';
        let msgStatus = '';

        if (conta.status === 'pendente') {
            badgeStatus = `<span class="bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full font-bold text-[10px]"><i class="fa-solid fa-clock mr-1"></i> Aguardando Aprovação</span>`;
            msgStatus = `<p class="text-[11px] text-slate-600 mt-2">Sua solicitação está gravada no banco de dados e na fila de análise da Engenharia.</p>`;
        } else if (conta.status === 'aprovado') {
            badgeStatus = `<span class="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full font-bold text-[10px]"><i class="fa-solid fa-circle-check mr-1"></i> Acesso Aprovado</span>`;
            msgStatus = `<p class="text-[11px] text-emerald-700 mt-2 font-bold">Seu acesso foi liberado! Você já pode entrar com suas credenciais na aba Entrar.</p>`;
        } else {
            badgeStatus = `<span class="bg-red-100 text-red-800 px-2.5 py-1 rounded-full font-bold text-[10px]"><i class="fa-solid fa-ban mr-1"></i> Recusado</span>`;
            msgStatus = `<p class="text-[11px] text-red-600 mt-2">Motivo: ${escapeHTML(conta.motivoRejeicao || 'Dados inconsistentes com a obra. Procure seu gestor.')}</p>`;
        }

        resBox.innerHTML = `
            <div class="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <div class="flex items-center justify-between">
                    <div>
                        <h4 class="font-extrabold text-slate-900 text-sm">Solicitação localizada</h4>
                        <p class="text-[11px] text-slate-500 font-mono">${escapeHTML(termo)} • ${escapeHTML(conta.cargoLabel || 'Colaborador')}</p>
                    </div>
                    ${badgeStatus}
                </div>
                <div class="mt-3 pt-2 border-t border-slate-200 text-[11px] text-slate-600 grid grid-cols-2 gap-2">
                    <div><strong>Data:</strong> ${escapeHTML(conta.dataSolicitacao || '-')}</div>
                </div>
                ${msgStatus}
            </div>
        `;
    } catch (err) {
        resBox.innerHTML = `
            <div class="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                <p class="font-bold flex items-center gap-1.5"><i class="fa-solid fa-circle-xmark"></i> Registro não localizado</p>
                <p class="mt-1 text-[11px]">Nenhuma solicitação encontrada para "<strong>${escapeHTML(termo)}</strong>". Verifique os dados ou solicite seu cadastro.</p>
            </div>
        `;
    }
}

window.alternarAbaAuth = alternarAbaAuth;
window.toggleSenhaVisibilidade = toggleSenhaVisibilidade;
window.efetuarLogin = efetuarLogin;
window.loginRapido = loginRapido;
window.efetuarCadastro = efetuarCadastro;
window.consultarStatusSolicitacao = consultarStatusSolicitacao;
