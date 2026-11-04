-- ====================================================================
-- ELLENCO - SISTEMA DIGITAL DE APONTAMENTO DE PRODUÇÃO
-- Esquema do Banco de Dados Relacional (SQLite / PostgreSQL)
-- ====================================================================

-- 1. TABELA DE USUÁRIOS E ACESSOS
CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    re TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    telefone TEXT,
    cargo TEXT NOT NULL,
    cargo_label TEXT NOT NULL,
    nivel INTEGER DEFAULT 1,
    obra TEXT DEFAULT 'Matriz / Todas as Obras',
    status TEXT DEFAULT 'pendente',
    aprovado_por TEXT,
    motivo_rejeicao TEXT,
    senha TEXT NOT NULL,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. TABELA DE OBRAS E FRENTES DE SERVIÇO
CREATE TABLE IF NOT EXISTS obras (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL UNIQUE,
    local TEXT NOT NULL,
    eng TEXT NOT NULL,
    volume_total TEXT,
    progresso REAL DEFAULT 0,
    status TEXT DEFAULT 'Em Andamento',
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. TABELA DE EQUIPES DE CAMPO
CREATE TABLE IF NOT EXISTS equipes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL UNIQUE,
    encarregado TEXT NOT NULL,
    atividade TEXT NOT NULL,
    obra TEXT NOT NULL,
    integrantes INTEGER DEFAULT 10,
    meta_acumulada REAL DEFAULT 0,
    realizado_acumulado REAL DEFAULT 0,
    produtividade_media TEXT DEFAULT '0 un/h',
    status TEXT DEFAULT 'Na Meta',
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. TABELA DE EQUIPAMENTOS E FROTA
CREATE TABLE IF NOT EXISTS equipamentos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo TEXT NOT NULL UNIQUE,
    tipo TEXT NOT NULL,
    modelo TEXT NOT NULL,
    horimetro REAL DEFAULT 0,
    consumo_medio TEXT DEFAULT '18 L/h',
    local TEXT NOT NULL,
    status TEXT DEFAULT 'Operacional',
    ultima_manutencao TEXT,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 5. TABELA DE APONTAMENTOS DE PRODUÇÃO (BDP - BOLETIM DIÁRIO)
CREATE TABLE IF NOT EXISTS apontamentos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    protocolo TEXT UNIQUE,
    data TEXT NOT NULL,
    turno TEXT DEFAULT 'Diurno',
    obra TEXT NOT NULL,
    equipe TEXT NOT NULL,
    encarregado TEXT NOT NULL,
    atividade TEXT NOT NULL,
    unidade TEXT NOT NULL,
    planejado REAL NOT NULL,
    realizado REAL NOT NULL,
    horas REAL DEFAULT 8.0,
    efetivo INTEGER DEFAULT 10,
    desvio REAL DEFAULT 0,
    eficiencia REAL DEFAULT 100,
    produtividade REAL DEFAULT 0,
    clima TEXT DEFAULT 'Ensolarado',
    parada TEXT DEFAULT 'Nenhum',
    obs TEXT,
    status TEXT DEFAULT 'Concluído',
    assinado_por TEXT,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 6. TABELA DE NOTIFICAÇÕES & ALERTAS OPERACIONAIS
CREATE TABLE IF NOT EXISTS notificacoes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo TEXT NOT NULL,
    mensagem TEXT NOT NULL,
    tipo TEXT DEFAULT 'info',
    lida INTEGER DEFAULT 0,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 7. TABELA DE LOGS DE AUDITORIA
CREATE TABLE IF NOT EXISTS logs_auditoria (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario TEXT NOT NULL,
    acao TEXT NOT NULL,
    detalhes TEXT,
    data_hora DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ÍNDICES PARA ALTA PERFORMANCE DE CONSULTA
CREATE INDEX IF NOT EXISTS idx_apontamentos_data ON apontamentos(data);
CREATE INDEX IF NOT EXISTS idx_apontamentos_obra ON apontamentos(obra);
CREATE INDEX IF NOT EXISTS idx_apontamentos_equipe ON apontamentos(equipe);
CREATE INDEX IF NOT EXISTS idx_usuarios_re ON usuarios(re);
