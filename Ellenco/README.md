# 🏗️ Ellenco - Sistema Digital de Apontamento de Produção

Sistema corporativo modularizado para gestão, conferência e auditoria de produção em obras pesadas (pavimentação asfáltica, terraplanagem, drenagem e infraestrutura urbana).

---

## 📁 Estrutura de Pastas e Arquivos

```
Ellenco/
├── HTML/
│   ├── index.html                  # Autenticação (Login corporativo, Cadastro de Colaborador e Consulta de Status)
│   ├── dashboard.html              # Painel de KPIs, Curva de Produção, Donut de Status, Tabela Resumo e Clima
│   ├── novo-apontamento.html       # Formulário de BDP (Boletim Diário de Produção) com cálculos em tempo real
│   ├── historico-auditoria.html    # Auditoria de apontamentos, filtros combinados e exportações (Excel / PDF / Print)
│   ├── equipes-campo.html          # Painel e cards de produtividade das equipes de campo + modal de nova equipe
│   ├── obras-frentes.html          # Acompanhamento físico das frentes de serviço e contratos + modal de nova obra
│   └── equipamentos-frota.html     # Monitoramento da frota, horímetros acumulados e status operacional
├── css/
│   ├── base.css                    # Reset, tipografia (Inter / Plus Jakarta Sans), scrollbar, dark mode e animações
│   ├── layout.css                  # Transições da sidebar, gradientes corporativos, topbar e regras de impressão (@media print)
│   ├── components.css              # Cards estatísticos (.card-stat), badges pulsantes, tabelas, modais e toasts
│   └── dashboard.css               # Estilos específicos do dashboard e dimensionamento de containers de gráficos
├── js/
│   ├── components/
│   │   ├── sidebar.js              # Injeção dinâmica da barra lateral com marcação de página ativa e perfil do usuário
│   │   └── topbar.js               # Injeção dinâmica do cabeçalho superior com filtros globais, dark mode e alertas
│   ├── services/
│   │   ├── api.js                  # Camada unificada de CRUD assíncrono (com dados mockados e base para Supabase)
│   │   ├── charts.js               # Centralização de configurações e instâncias do Chart.js
│   │   └── auth.js                 # Gestão de sessão (localStorage), controle de permissões por cargo, tema e toasts
│   └── pages/
│       ├── login.js                # Lógica da tela de login, validação de senha e formulário de solicitação de acesso
│       ├── dashboard.js            # Controlador do dashboard, cálculo de KPIs, gráficos e estimador meteorológico
│       ├── novo-apontamento.js     # Controlador do formulário, alteração dinâmica de unidades e detecção de typos
│       ├── historico.js            # Controlador da tabela de auditoria, filtros em tempo real e exportações XLSX/PDF
│       ├── equipes.js              # Controlador da listagem de equipes e modal de cadastro
│       ├── obras.js                # Controlador da listagem de obras e modal de cadastro
│       └── equipamentos.js         # Controlador do painel de frota e horímetros
├── IMG/
│   └── logo.png                    # Logotipo institucional Ellenco
└── README.md                       # Documentação técnica e guia de integração
```

---

## 🧩 Conexão entre Páginas, Componentes e Serviços

Todas as páginas do sistema compartilham uma arquitetura padronizada:

```
[ Página HTML (ex: dashboard.html) ]
       │
       ├──> CSS: base.css + layout.css + components.css + dashboard.css
       │
       ├──> Componentes UI:
       │       ├── sidebar.js ──> Injeta menu lateral com a aba ativa destacada
       │       └── topbar.js  ──> Injeta cabeçalho com filtros globais (obra/período)
       │
       ├──> Serviços:
       │       ├── auth.js   ──> Sessão do usuário, permissões, Dark Mode e Toasts
       │       ├── api.js    ──> Consulta/grava dados no banco (localStorage / Supabase)
       │       └── charts.js ──> Renderiza e atualiza os gráficos Chart.js
       │
       └──> Controlador da Página:
               └── dashboard.js ──> Orquestra o ciclo de vida e eventos específicos da tela
```

### 1. Injeção de Componentes (`/js/components`)
- **`sidebar.js`**: A função `renderSidebar(activePage)` renderiza a barra lateral navegável e destaca a página atual (`dashboard`, `apontamento`, `historico`, `equipes`, `obras`, `equipamentos`). Também exibe o nome e cargo do usuário logado e implementa a ação de logout.
- **`topbar.js`**: A função `renderTopbar(titulo, subtitulo, showFilters)` renderiza o topo com o título da tela, botão de acesso rápido a "Novo Apontamento", alternador de tema escuro e sino de notificações.

### 2. Camada Única de API (`/js/services/api.js`)
Centraliza todas as requisições de dados da aplicação em métodos assíncronos (`async/await`):
- `api.getApontamentos(filtros)`: Retorna os apontamentos filtrados por período ou obra.
- `api.postApontamento(dados)`: Registra um novo apontamento com cálculo de desvio e produtividade.
- `api.deleteApontamento(id)`: Remove um apontamento da auditoria.
- `api.getKPIs(filtros)`: Retorna métricas consolidadas (Meta, Realizado, Eficiência %, Desvio %, Produtividade/h).
- `api.getEquipes()` e `api.postEquipe(equipe)`: Gestão das equipes de campo.
- `api.getObras()` e `api.postObra(obra)`: Gestão de contratos e frentes.
- `api.getEquipamentos()`: Listagem de maquinário e horímetros.
- `api.consultarClima(cidade)`: Consulta dados em tempo real da API meteorológica Open-Meteo.

### 3. Centralização dos Gráficos (`/js/services/charts.js`)
Isola a criação, destruição e renderização de instâncias do **Chart.js**:
- `chartsService.renderProducao(canvasId, apontamentos, isDark)`: Gráfico de linha comparativo (Planejado vs Realizado).
- `chartsService.renderStatusEquipes(canvasId, stats, isDark)`: Gráfico Donut de distribuição de desempenho (Acima da Meta / Na Meta / Abaixo da Meta).
- `chartsService.renderObras(canvasId, obras, isDark)`: Gráfico de barras de progresso por contrato.
- `chartsService.renderAtividades(canvasId, apontamentos, isDark)`: Gráfico de distribuição por tipo de serviço.

---

## 🗄️ Guia de Integração com o Backend (Supabase / PostgreSQL)

Quando você for conectar ao seu banco **Postgres via Supabase**, basta:

1. Adicionar o SDK do Supabase no `<head>` das páginas:
   ```html
   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
   ```

2. No início de [`/js/services/api.js`](file:///d:/Nova%20pasta%20%282%29/Ellenco/js/services/api.js), inicializar o cliente:
   ```javascript
   const supabaseUrl = 'https://SEU_PROJETO.supabase.co';
   const supabaseKey = 'SUA_ANON_KEY';
   const supabase = supabase.createClient(supabaseUrl, supabaseKey);
   ```

3. Substituir os métodos do `api.js` pelas chamadas diretas do Supabase já documentadas em comentários no arquivo:
   ```javascript
   // Exemplo: getApontamentos()
   async getApontamentos(filtros = {}) {
       let query = supabase.from('apontamentos').select('*').order('data', { ascending: false });
       if (filtros.obra && filtros.obra !== 'todas') {
           query = query.eq('obra', filtros.obra);
       }
       const { data, error } = await query;
       if (error) throw error;
       return data;
   }
   ```

---

## 🚀 Como Executar Localmente

1. Abra a pasta `Ellenco/HTML/index.html` diretamente no seu navegador web (Google Chrome, Microsoft Edge, Firefox).
2. Para login de demonstração rápido, utilize os botões:
   - **Operacional**: Carlos Silva (Encarregado)
   - **Superior**: Eng. Ricardo Viana (Diretoria)
3. Navegue entre as telas pelo menu lateral para registrar novos apontamentos, auditar registros e visualizar os gráficos em tempo real.
