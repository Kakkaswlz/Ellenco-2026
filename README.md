# 🏗️ Ellenco - Sistema Digital de Apontamento de Produção

Sistema corporativo de alto padrão para gestão, conferência e auditoria de produção em obras pesadas (pavimentação asfáltica, terraplanagem, drenagem e infraestrutura urbana), com **banco de dados relacional SQLite completo e funcional** e API RESTful integrada.

---

## 🚀 Como Executar o Sistema

### Opção 1: Inicialização em 1 Clique (Recomendada)
Dê um duplo clique no arquivo **`iniciar-sistema.bat`**.
O servidor Node.js será iniciado na porta `3000`, o banco de dados SQLite será verificado/populado e a página inicial será aberta automaticamente no seu navegador padrão (`http://localhost:3000`).

### Opção 2: Linha de Comando (Node.js)
```bash
npm start
# ou
node server.js
```
Acesse: `http://localhost:3000/HTML/index.html`. Crie `.env` a partir de `.env.example`; em produção, defina `SESSION_SECRET` com valor aleatório e longo. Não compartilhe as chaves de API.

### Opção 3: Execução Estática Direta
Para usar o modo de demonstração sem banco, abra `Ellenco/HTML/index.html`. Nesse modo, os dados ficam apenas no navegador e o chatbot exige o servidor; para avaliar todos os fluxos, use `npm start` e acesse `http://localhost:3000`.

---

## 🔑 Acessos de Demonstração Rápidos

| Perfil | Colaborador | RE | Cargo | Obra | Senha |
|---|---|---|---|---|---|
| **Operacional** | Carlos Silva | RE-8842 | Encarregado de Equipe | SP-270 Rodovia Raposo Tavares | 123 |
| **Superior** | Eng. Ricardo Viana | RE-1005 | Diretor de Operações | Matriz / Todas as Obras | 123 |
| **Engenharia** | Eng. Gabriel Martins | RE-3021 | Engenheiro de Produção | SP-270 Rodovia Raposo Tavares | 123 |

---

## 📁 Estrutura de Arquivos

```
Projeto Ellenco 2026/
├── database/
│   ├── schema.sql              # Estrutura DDL das tabelas relacionais com índices
│   ├── seed.sql                # Dados iniciais realísticos (obras, equipes, frota, BDPs)
│   ├── db.js                   # Módulo de conexão SQLite nativo (node:sqlite)
│   └── ellenco.db              # Arquivo de banco de dados SQLite persistente
├── server.js                   # Servidor Node.js (REST API + Arquivos Estáticos)
├── package.json                # Configuração do projeto e scripts npm
├── iniciar-sistema.bat         # Executável Windows em 1 clique
├── Ellenco/
│   ├── HTML/
│   │   ├── index.html                  # Autenticação (Login, Cadastro e Consulta de Status)
│   │   ├── dashboard.html              # Painel de KPIs, Curva de Produção, Donut e Clima
│   │   ├── novo-apontamento.html       # Formulário de BDP com cálculos em tempo real
│   │   ├── historico-auditoria.html    # Auditoria de registros e exportações (Excel / PDF / Print)
│   │   ├── equipes-campo.html          # Painel e cards de produtividade das equipes de campo
│   │   ├── obras-frentes.html          # Acompanhamento físico das frentes de serviço e contratos
│   │   ├── equipamentos-frota.html     # Monitoramento da frota, horímetros e manutenção
│   │   └── aprovacoes-usuarios.html    # Painel de gestão e aprovação de novos colaboradores
│   ├── CSS/
│   │   ├── base.css                    # Variáveis de cor, reset, tipografia e animações
│   │   ├── layout.css                  # Transições da sidebar, topbar e regras de impressão
│   │   ├── components.css              # Cards estatísticos, badges, tabelas, modais e toasts
│   │   └── dashboard.css               # Estilos dos containers de gráficos e clima
│   ├── js/
│   │   ├── components/
│   │   │   ├── sidebar.js              # Barra lateral dinâmica com controle de acessos
│   │   │   └── topbar.js               # Cabeçalho superior com filtros globais de obra/período
│   │   ├── services/
│   │   │   ├── api.js                  # Camada unificada de CRUD (SQLite REST API + Local Sync)
│   │   │   ├── auth.js                 # Gestão de sessão, permissões por cargo e toasts
│   │   │   └── charts.js               # Instâncias e renderização de gráficos Chart.js
│   │   └── pages/
│   │       ├── login.js                # Lógica da tela de login e solicitação de acesso
│   │       ├── dashboard.js            # KPIs em tempo real e previsão meteorológica Open-Meteo
│   │       ├── novo-apontamento.js     # Validações, detecção de erros de digitação e envio ao SQLite
│   │       ├── historico.js            # Auditoria, busca instantânea e exportações XLSX/PDF
│   │       ├── equipes.js              # Listagem e cadastro de equipes
│   │       ├── obras.js                # Listagem e cadastro de contratos
│   │       ├── equipamentos.js         # Controle da frota e horímetros
│   │       └── aprovacoes.js           # Aprovação e recusa de colaboradores pendentes
│   └── IMG/
│       ├── logo.png                    # Logotipo oficial Ellenco
│       └── logo.svg                    # Versão vetorial SVG de alta nitidez
└── README.md                           # Documentação técnica completa
```

---

## 🗄️ Modelo do Banco de Dados Relacional (SQLite)

O banco de dados armazena os dados de produção de forma estruturada em tabelas normalizadas:

1. **`usuarios`**: Controle de contas, cargos (`operacional`, `supervisor`, `engenheiro`, `gestor`), status de aprovação e senhas.
2. **`obras`**: Contratos ativos, localização, engenheiro responsável, volume total e progresso físico percentual.
3. **`equipes`**: Equipes de campo, encarregados líderes, atividade principal, número de integrantes e acumulados de produção.
4. **`equipamentos`**: Frota pesada (vibroacabadoras, rolos, escavadeiras, fresadoras), horímetros acumulados, consumo e manutenções.
5. **`apontamentos`**: Boletins Diários de Produção (BDP), metas programadas, volumes realizados, desvios %, eficiência %, produtividade/h, clima e ocorrências.
6. **`notificacoes`**: Alertas de desvios críticos e avisos operacionais.

---

## ⚡ Endpoints da REST API

| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/api/status` | Verifica a integridade e status do banco de dados |
| `GET` | `/api/kpis` | Retorna KPIs consolidados (Meta, Realizado, Desvio %, Eficiência %, Produtividade/h) |
| `GET` / `POST` | `/api/apontamentos` | Lista ou cadastra novos apontamentos de produção (BDP) |
| `GET` / `PUT` / `DELETE` | `/api/apontamentos/:id` | Consulta, edita ou exclui um apontamento |
| `GET` / `POST` | `/api/obras` | Consulta e cadastro de contratos de obras |
| `GET` / `POST` | `/api/equipes` | Consulta e cadastro de equipes de campo |
| `GET` / `POST` | `/api/equipamentos` | Consulta e cadastro de equipamentos e máquinas |
| `POST` | `/api/auth/login` | Autenticação de credenciais de usuário |
| `POST` | `/api/auth/register` | Registro de solicitação de novo colaborador |
| `GET` | `/api/auth/status` | Consulta o status de liberação de um cadastro |
| `GET` / `PUT` | `/api/auth/usuarios` | Gestão e aprovação de colaboradores pela diretoria |
