/**
 * ====================================================================
 * ELLENCO - GERENCIADOR DO BANCO DE DADOS RELACIONAL (PostgreSQL)
 * Utiliza o driver 'pg' com connection pool para Supabase/PostgreSQL
 * Inclui motor de análise e recuperação de contexto para o Agente IA
 * ====================================================================
 * Fallback: se DATABASE_URL não estiver definido, usa SQLite local.
 */

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// ============================================================
// DETECÇÃO AUTOMÁTICA: PostgreSQL (produção) ou SQLite (local)
// ============================================================
const DATABASE_URL = process.env.DATABASE_URL;
const USE_POSTGRES = !!DATABASE_URL;

let pool = null;
let sqliteDb = null;

if (USE_POSTGRES) {
    const { Pool } = require('pg');
    
    // Remove sslmode da query string para evitar que o pg sobrescreva o objeto ssl
    let cleanUrl = DATABASE_URL;
    try {
        const parsed = new URL(DATABASE_URL);
        parsed.searchParams.delete('sslmode');
        cleanUrl = parsed.toString();
    } catch (e) {
        cleanUrl = DATABASE_URL.replace(/[?&]sslmode=[^&]+/g, '');
    }

    pool = new Pool({
        connectionString: cleanUrl,
        ssl: {
            rejectUnauthorized: true
        },
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 8000
    });
    pool.on('error', (err) => {
        console.error('Erro inesperado no pool PostgreSQL:', err);
    });
    console.log('🐘 Conectado ao PostgreSQL (Supabase Pooler)');
} else {
    try {
        const { DatabaseSync } = require('node:sqlite');
        const DB_PATH = path.join(__dirname, 'ellenco.db');
        sqliteDb = new DatabaseSync(DB_PATH);
        sqliteDb.exec('PRAGMA journal_mode = WAL;');
        sqliteDb.exec('PRAGMA foreign_keys = ON;');
        console.log('📦 Usando SQLite local (desenvolvimento)');
    } catch (e) {
        console.error('❌ Nem PostgreSQL nem SQLite disponíveis:', e.message);
    }
}

// ============================================================
// HELPERS — Abstração para rodar queries em ambos os bancos
// ============================================================

/**
 * Executa uma query e retorna todas as linhas.
 * @param {string} sql - Query SQL (use $1, $2... para PostgreSQL)
 * @param {Array} params - Parâmetros da query
 * @returns {Promise<Array>}
 */
async function queryAll(sql, params = []) {
    if (USE_POSTGRES) {
        const result = await pool.query(sql, params);
        return result.rows;
    } else {
        // SQLite usa ? como placeholder — converter $1, $2... para ?
        const sqliteSql = sql.replace(/\$\d+/g, '?');
        return sqliteDb.prepare(sqliteSql).all(...params);
    }
}

/**
 * Executa uma query e retorna a primeira linha.
 * @param {string} sql
 * @param {Array} params
 * @returns {Promise<Object|null>}
 */
async function queryOne(sql, params = []) {
    if (USE_POSTGRES) {
        const result = await pool.query(sql, params);
        return result.rows[0] || null;
    } else {
        const sqliteSql = sql.replace(/\$\d+/g, '?');
        return sqliteDb.prepare(sqliteSql).get(...params) || null;
    }
}

/**
 * Executa uma query de escrita (INSERT/UPDATE/DELETE).
 * Para INSERTs com RETURNING id, retorna o id inserido.
 * @param {string} sql
 * @param {Array} params
 * @returns {Promise<{rowCount: number, insertedId: number|null}>}
 */
async function queryRun(sql, params = []) {
    if (USE_POSTGRES) {
        const result = await pool.query(sql, params);
        return {
            rowCount: result.rowCount,
            insertedId: result.rows?.[0]?.id || null
        };
    } else {
        const sqliteSql = sql.replace(/\$\d+/g, '?');
        // Remove RETURNING clause for SQLite
        const sqliteClean = sqliteSql.replace(/\s+RETURNING\s+\w+/gi, '');
        const res = sqliteDb.prepare(sqliteClean).run(...params);
        return {
            rowCount: res.changes,
            insertedId: Number(res.lastInsertRowid) || null
        };
    }
}

/**
 * Executa SQL bruto (para schema/seed).
 */
async function execSQL(sql) {
    if (USE_POSTGRES) {
        await pool.query(sql);
    } else {
        sqliteDb.exec(sql);
    }
}

async function sincronizarAcumuladosEquipes() {
    await queryRun(`UPDATE equipes SET
        meta_acumulada = COALESCE((SELECT SUM(a.planejado) FROM apontamentos a WHERE a.equipe = equipes.nome), 0),
        realizado_acumulado = COALESCE((SELECT SUM(a.realizado) FROM apontamentos a WHERE a.equipe = equipes.nome), 0)`);
}

// ============================================================
// INICIALIZAÇÃO DO BANCO
// ============================================================
async function initDatabase() {
    try {
        if (USE_POSTGRES) {
            const SCHEMA_PATH = path.join(__dirname, 'schema.postgres.sql');
            if (fs.existsSync(SCHEMA_PATH)) {
                const schemaSql = fs.readFileSync(SCHEMA_PATH, 'utf8');
                await execSQL(schemaSql);
            }
            // Verificar se o banco precisa de seed
            const row = await queryOne('SELECT COUNT(*) as total FROM apontamentos');
            if (row && parseInt(row.total) === 0) {
                const SEED_PATH = path.join(__dirname, 'seed.postgres.sql');
                if (fs.existsSync(SEED_PATH)) {
                    console.log('🌱 Executando carga inicial de dados (Seed PostgreSQL)...');
                    const seedSql = fs.readFileSync(SEED_PATH, 'utf8');
                    await execSQL(seedSql);
                    console.log('✅ Banco de dados PostgreSQL populado com sucesso!');
                }
            }
            // O seed insere registros com ID fixo: sincroniza os contadores de ID
            // para que novos cadastros não colidam com os IDs já existentes.
            const TABELAS_COM_ID = ['usuarios', 'obras', 'equipes', 'equipamentos', 'apontamentos', 'notificacoes', 'logs_auditoria', 'atividades'];
            for (const tabela of TABELAS_COM_ID) {
                try {
                    await execSQL(`SELECT setval(pg_get_serial_sequence('${tabela}', 'id'), COALESCE((SELECT MAX(id) FROM ${tabela}), 0) + 1, false)`);
                } catch (e) {
                    console.warn(`Aviso: não foi possível sincronizar o contador de ID de ${tabela}:`, e.message);
                }
            }
        } else {
            // SQLite initialization
            const SCHEMA_PATH = path.join(__dirname, 'schema.sql');
            const SEED_PATH = path.join(__dirname, 'seed.sql');
            if (fs.existsSync(SCHEMA_PATH)) {
                const schemaSql = fs.readFileSync(SCHEMA_PATH, 'utf8');
                sqliteDb.exec(schemaSql);
            }
            const row = sqliteDb.prepare('SELECT COUNT(*) as total FROM apontamentos').get();
            if (row && row.total === 0 && fs.existsSync(SEED_PATH)) {
                console.log('🌱 Executando carga inicial de dados (Seed SQLite)...');
                const seedSql = fs.readFileSync(SEED_PATH, 'utf8');
                sqliteDb.exec(seedSql);
                console.log('✅ Banco de dados SQLite populado com sucesso!');
            }
        }
    } catch (err) {
        console.error('Database initialization failed:', err);
        throw err;
    }
}

// ============================================================
// API PÚBLICA DO MÓDULO (mesma interface para server.js)
// ============================================================
module.exports = {
    // Referência ao pool/db para uso direto se necessário
    pool,
    sqliteDb,
    USE_POSTGRES,

    // Inicialização assíncrona — deve ser chamada no startup do server
    initDatabase,

    // ==========================================
    // USUÁRIOS & AUTENTICAÇÃO
    // ==========================================
    usuarios: {
        async listar() {
            return await queryAll('SELECT id, nome, re, email, telefone, cargo, cargo_label, nivel, obra, status, aprovado_por, criado_em FROM usuarios ORDER BY id DESC');
        },
        async buscarPorId(id) {
            return await queryOne('SELECT id, nome, re, email, telefone, cargo, cargo_label, nivel, obra, status, aprovado_por, criado_em FROM usuarios WHERE id = $1', [id]);
        },
        async buscarPorREouEmail(termo) {
            return await queryOne('SELECT * FROM usuarios WHERE LOWER(re) = LOWER($1) OR LOWER(email) = LOWER($2)', [termo, termo]);
        },
        async autenticar(termo, senha) {
            return await queryOne('SELECT id, nome, re, email, cargo, cargo_label, nivel, obra, status FROM usuarios WHERE (LOWER(re) = LOWER($1) OR LOWER(email) = LOWER($2)) AND senha = $3', [termo, termo, senha]);
        },
        async cadastrar(dados) {
            const result = await queryRun(
                `INSERT INTO usuarios (nome, re, email, telefone, cargo, cargo_label, nivel, obra, status, senha)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
                [
                    dados.nome,
                    dados.re,
                    dados.email,
                    dados.telefone || '',
                    dados.cargo,
                    dados.cargo_label,
                    dados.nivel || 1,
                    dados.obra || 'Matriz / Todas as Obras',
                    dados.status || 'pendente',
                    dados.senha
                ]
            );
            const { senha, ...publicData } = dados;
            return { id: result.insertedId, ...publicData };
        },
        async atualizarSenha(id, senha) {
            await queryRun('UPDATE usuarios SET senha = $1 WHERE id = $2', [senha, id]);
        },
        async atualizarStatus(id, status, aprovadoPor = '', motivo = '') {
            await queryRun('UPDATE usuarios SET status = $1, aprovado_por = $2, motivo_rejeicao = $3 WHERE id = $4', [status, aprovadoPor, motivo, id]);
            return this.buscarPorId(id);
        },
        async remover(id) {
            return await queryRun('DELETE FROM usuarios WHERE id = $1', [id]);
        }
    },

    // ==========================================
    // APONTAMENTOS DE PRODUÇÃO (BDP)
    // ==========================================
    apontamentos: {
        async listar(filtros = {}) {
            let sql = 'SELECT * FROM apontamentos WHERE 1=1';
            const params = [];
            let paramIndex = 1;

            if (filtros.obra && filtros.obra !== 'todas') {
                sql += ` AND obra = $${paramIndex++}`;
                params.push(filtros.obra);
            }
            if (filtros.equipe && filtros.equipe !== 'todas') {
                sql += ` AND equipe = $${paramIndex++}`;
                params.push(filtros.equipe);
            }
            if (filtros.dataInicio) {
                sql += ` AND data >= $${paramIndex++}`;
                params.push(filtros.dataInicio);
            }
            if (filtros.dataFim) {
                sql += ` AND data <= $${paramIndex++}`;
                params.push(filtros.dataFim);
            }

            sql += ' ORDER BY data DESC, id DESC';
            return await queryAll(sql, params);
        },

        async buscarPorId(id) {
            return await queryOne('SELECT * FROM apontamentos WHERE id = $1', [id]);
        },

        async buscarSemantico(termo) {
            if (!termo || !termo.trim()) return [];

            // Palavras-chave relevantes (descartando preposições e palavras comuns)
            const stopWords = new Set(['qual', 'quais', 'quem', 'onde', 'como', 'quando', 'porque', 'por', 'que', 'com', 'para', 'pelo', 'pela', 'sobre', 'esse', 'essa', 'este', 'esta', 'isso', 'aquilo', 'foram', 'houve', 'aconteceu', 'relato', 'registrado', 'registrada', 'ocorreu', 'teve', 'esta', 'estao', 'estão', 'num', 'uma', 'uns', 'umas', 'dos', 'das', 'nas', 'nos']);
            const palavras = termo.toLowerCase()
                .replace(/[^a-zA-Z0-9áéíóúâêîôûãõç\s-]/g, ' ')
                .split(/\s+/)
                .filter(p => p.length >= 3 && !stopWords.has(p));

            if (palavras.length === 0) {
                const t = `%${termo.toLowerCase()}%`;
                return await queryAll(`
                    SELECT * FROM apontamentos 
                    WHERE LOWER(atividade) LIKE $1 
                       OR LOWER(parada) LIKE $2 
                       OR LOWER(obs) LIKE $3 
                       OR LOWER(obra) LIKE $4 
                       OR LOWER(equipe) LIKE $5 
                       OR LOWER(encarregado) LIKE $6
                       OR LOWER(protocolo) LIKE $7
                    ORDER BY data DESC, id DESC
                    LIMIT 15
                `, [t, t, t, t, t, t, t]);
            }

            // Constrói query dinâmica com as palavras relevantes
            const clausulas = [];
            const params = [];
            let paramIdx = 1;

            palavras.forEach(p => {
                const indices = [];
                for (let i = 0; i < 7; i++) {
                    params.push(`%${p}%`);
                    indices.push(`$${paramIdx++}`);
                }
                clausulas.push(`
                    (LOWER(atividade) LIKE ${indices[0]} OR LOWER(parada) LIKE ${indices[1]} OR LOWER(obs) LIKE ${indices[2]} OR LOWER(obra) LIKE ${indices[3]} OR LOWER(equipe) LIKE ${indices[4]} OR LOWER(encarregado) LIKE ${indices[5]} OR LOWER(protocolo) LIKE ${indices[6]})
                `);
            });

            return await queryAll(`
                SELECT * FROM apontamentos 
                WHERE ${clausulas.join(' OR ')}
                ORDER BY data DESC, id DESC
                LIMIT 15
            `, params);
        },

        async criar(dados) {
            const desvio = dados.planejado > 0 ? ((dados.realizado - dados.planejado) / dados.planejado) * 100 : 0;
            const eficiencia = dados.planejado > 0 ? (dados.realizado / dados.planejado) * 100 : 100;
            const produtividade = dados.horas > 0 ? (dados.realizado / dados.horas) : 0;
            const protocolo = dados.protocolo || `BDP-${new Date().getFullYear()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

            const result = await queryRun(
                `INSERT INTO apontamentos 
                (protocolo, data, turno, obra, equipe, encarregado, atividade, unidade, planejado, realizado, horas, efetivo, desvio, eficiencia, produtividade, clima, parada, obs, status, assinado_por)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20) RETURNING id`,
                [
                    protocolo,
                    dados.data,
                    dados.turno || 'Diurno',
                    dados.obra,
                    dados.equipe,
                    dados.encarregado,
                    dados.atividade,
                    dados.unidade,
                    dados.planejado,
                    dados.realizado,
                    dados.horas || 8.0,
                    dados.efetivo || 10,
                    parseFloat(desvio.toFixed(2)),
                    parseFloat(eficiencia.toFixed(2)),
                    parseFloat(produtividade.toFixed(1)),
                    dados.clima || 'Ensolarado',
                    dados.parada || 'Nenhum',
                    dados.obs || '',
                    dados.status || 'Concluído',
                    dados.assinado_por || dados.encarregado
                ]
            );

            // Vincula o apontamento ao catálogo de atividades (apenas PostgreSQL)
            if (USE_POSTGRES && result.insertedId) {
                try {
                    const ativ = await module.exports.atividades.criar({ nome: dados.atividade, unidade: dados.unidade });
                    await queryRun('UPDATE apontamentos SET atividade_id = $1 WHERE id = $2', [ativ.id, result.insertedId]);
                } catch (e) {
                    console.warn('Aviso: não foi possível vincular a atividade:', e.message);
                }
            }

            await sincronizarAcumuladosEquipes();

            return { id: result.insertedId, protocolo, ...dados, desvio, eficiencia, produtividade };
        },

        async atualizar(id, dados) {
            const desvio = dados.planejado > 0 ? ((dados.realizado - dados.planejado) / dados.planejado) * 100 : 0;
            const eficiencia = dados.planejado > 0 ? (dados.realizado / dados.planejado) * 100 : 100;
            const produtividade = dados.horas > 0 ? (dados.realizado / dados.horas) : 0;

            await queryRun(
                `UPDATE apontamentos SET 
                data = $1, turno = $2, obra = $3, equipe = $4, encarregado = $5, atividade = $6, 
                unidade = $7, planejado = $8, realizado = $9, horas = $10, efetivo = $11, 
                desvio = $12, eficiencia = $13, produtividade = $14, clima = $15, parada = $16, obs = $17, status = $18
                WHERE id = $19`,
                [
                    dados.data, dados.turno, dados.obra, dados.equipe, dados.encarregado, dados.atividade,
                    dados.unidade, dados.planejado, dados.realizado, dados.horas, dados.efetivo,
                    parseFloat(desvio.toFixed(2)), parseFloat(eficiencia.toFixed(2)), parseFloat(produtividade.toFixed(1)),
                    dados.clima, dados.parada, dados.obs, dados.status, id
                ]
            );
            await sincronizarAcumuladosEquipes();
            return this.buscarPorId(id);
        },

        async remover(id) {
            const result = await queryRun('DELETE FROM apontamentos WHERE id = $1', [id]);
            await sincronizarAcumuladosEquipes();
            return result;
        },

        async calcularKPIs(filtros = {}) {
            const lista = await this.listar(filtros);
            let totalPlanejado = 0;
            let totalRealizado = 0;
            let totalHoras = 0;
            let acima = 0, naMeta = 0, abaixo = 0;

            lista.forEach(item => {
                totalPlanejado += (parseFloat(item.planejado) || 0);
                totalRealizado += (parseFloat(item.realizado) || 0);
                totalHoras += (parseFloat(item.horas) || 0);

                const ef = item.eficiencia || (item.planejado > 0 ? (item.realizado / item.planejado) * 100 : 100);
                if (ef >= 100) acima++;
                else if (ef >= 90) naMeta++;
                else abaixo++;
            });

            const desvioGeral = totalPlanejado > 0 ? ((totalRealizado - totalPlanejado) / totalPlanejado) * 100 : 0;
            const eficienciaGeral = totalPlanejado > 0 ? (totalRealizado / totalPlanejado) * 100 : 100;
            const produtividadeMedia = totalHoras > 0 ? (totalRealizado / totalHoras).toFixed(1) : '0.0';

            return {
                totalRegistros: lista.length,
                totalMeta: Math.round(totalPlanejado),
                totalRealizado: Math.round(totalRealizado),
                desvio: desvioGeral.toFixed(1),
                eficiencia: Math.round(eficienciaGeral),
                produtividadeMedia,
                totalHoras: totalHoras.toFixed(1),
                acima,
                naMeta,
                abaixo
            };
        }
    },

    // ==========================================
    // OBRAS E FRENTES DE SERVIÇO
    // ==========================================
    obras: {
        async listar() {
            return await queryAll('SELECT * FROM obras ORDER BY id ASC');
        },
        async buscarPorId(id) {
            return await queryOne('SELECT * FROM obras WHERE id = $1', [id]);
        },
        async criar(dados) {
            const result = await queryRun(
                'INSERT INTO obras (nome, local, eng, volume_total, progresso, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
                [dados.nome, dados.local, dados.eng, dados.volume_total || '10.000 un', dados.progresso || 0, dados.status || 'Em Andamento']
            );
            return { id: result.insertedId, ...dados };
        },
        async atualizar(id, dados) {
            await queryRun(
                'UPDATE obras SET nome = $1, local = $2, eng = $3, volume_total = $4, progresso = $5, status = $6 WHERE id = $7',
                [dados.nome, dados.local, dados.eng, dados.volume_total, dados.progresso, dados.status, id]
            );
            return this.buscarPorId(id);
        },
        async remover(id) {
            return await queryRun('DELETE FROM obras WHERE id = $1', [id]);
        }
    },

    // ==========================================
    // EQUIPES DE CAMPO
    // ==========================================
    equipes: {
        async listar() {
            return await queryAll('SELECT * FROM equipes ORDER BY id ASC');
        },
        async buscarPorId(id) {
            return await queryOne('SELECT * FROM equipes WHERE id = $1', [id]);
        },
        async criar(dados) {
            const result = await queryRun(
                'INSERT INTO equipes (nome, encarregado, atividade, obra, integrantes, meta_acumulada, realizado_acumulado, produtividade_media, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id',
                [
                    dados.nome,
                    dados.encarregado,
                    dados.atividade,
                    dados.obra || 'SP-270 Rodovia Raposo Tavares',
                    dados.integrantes || 10,
                    dados.meta_acumulada || 1000,
                    dados.realizado_acumulado || 1000,
                    dados.produtividade_media || '50.0 un/h',
                    dados.status || 'Na Meta'
                ]
            );
            return { id: result.insertedId, ...dados };
        },
        async atualizar(id, dados) {
            await queryRun(
                'UPDATE equipes SET nome = $1, encarregado = $2, atividade = $3, obra = $4, integrantes = $5, meta_acumulada = $6, realizado_acumulado = $7, produtividade_media = $8, status = $9 WHERE id = $10',
                [dados.nome, dados.encarregado, dados.atividade, dados.obra, dados.integrantes, dados.meta_acumulada, dados.realizado_acumulado, dados.produtividade_media, dados.status, id]
            );
            return this.buscarPorId(id);
        },
        async remover(id) {
            return await queryRun('DELETE FROM equipes WHERE id = $1', [id]);
        }
    },

    // ==========================================
    // ATIVIDADES (catálogo de serviços + unidade técnica)
    // ==========================================
    atividades: {
        async listar() {
            return await queryAll('SELECT id, nome, unidade FROM atividades ORDER BY id ASC');
        },
        async criar(dados) {
            const nome = String(dados.nome || '').trim();
            const unidade = String(dados.unidade || '').trim();
            if (!nome || !unidade) throw new Error('Nome e unidade são obrigatórios.');
            const existente = await queryOne('SELECT id, nome, unidade FROM atividades WHERE lower(nome) = lower($1)', [nome]);
            if (existente) return { ...existente, jaExistia: true };
            const result = await queryRun(
                'INSERT INTO atividades (nome, unidade) VALUES ($1, $2) RETURNING id',
                [nome, unidade]
            );
            return { id: result.insertedId, nome, unidade };
        }
    },

    // ==========================================
    // EQUIPAMENTOS E FROTA
    // ==========================================
    equipamentos: {
        async listar() {
            return await queryAll('SELECT * FROM equipamentos ORDER BY id ASC');
        },
        async buscarPorId(id) {
            return await queryOne('SELECT * FROM equipamentos WHERE id = $1', [id]);
        },
        async criar(dados) {
            const result = await queryRun(
                'INSERT INTO equipamentos (codigo, tipo, modelo, horimetro, consumo_medio, local, status, ultima_manutencao) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id',
                [dados.codigo, dados.tipo, dados.modelo, dados.horimetro || 0, dados.consumo_medio || '18 L/h', dados.local, dados.status || 'Operacional', dados.ultima_manutencao || 'Recente']
            );
            return { id: result.insertedId, ...dados };
        },
        async atualizar(id, dados) {
            await queryRun(
                'UPDATE equipamentos SET codigo = $1, tipo = $2, modelo = $3, horimetro = $4, consumo_medio = $5, local = $6, status = $7, ultima_manutencao = $8 WHERE id = $9',
                [dados.codigo, dados.tipo, dados.modelo, dados.horimetro, dados.consumo_medio, dados.local, dados.status, dados.ultima_manutencao, id]
            );
            return this.buscarPorId(id);
        },
        async remover(id) {
            return await queryRun('DELETE FROM equipamentos WHERE id = $1', [id]);
        }
    },

    // ==========================================
    // NOTIFICAÇÕES
    // ==========================================
    notificacoes: {
        async listar() {
            return await queryAll('SELECT * FROM notificacoes ORDER BY id DESC LIMIT 20');
        },
        async criar(titulo, mensagem, tipo = 'info') {
            const result = await queryRun(
                'INSERT INTO notificacoes (titulo, mensagem, tipo) VALUES ($1, $2, $3) RETURNING id',
                [titulo, mensagem, tipo]
            );
            return { id: result.insertedId, titulo, mensagem, tipo };
        },
        async marcarLida(id) {
            return await queryRun('UPDATE notificacoes SET lida = $1 WHERE id = $2', [USE_POSTGRES ? true : 1, id]);
        }
    },

    // ==========================================
    // MOTOR DE CONTEXTO E ANÁLISE PARA O AGENTE IA
    // ==========================================
    async obterContextoParaIA(usuarioLogado = {}) {
        const kpis = await this.apontamentos.calcularKPIs();
        const ultimosApontamentos = await queryAll('SELECT * FROM apontamentos ORDER BY data DESC, id DESC LIMIT 10');
        const todasObras = await this.obras.listar();
        const todasEquipes = await this.equipes.listar();
        const frota = await this.equipamentos.listar();

        // Ocorrências / Paradas registradas
        const ocorrencias = await queryAll(`
            SELECT id, protocolo, data, obra, equipe, parada, obs, desvio 
            FROM apontamentos 
            WHERE (parada != 'Nenhum' AND parada IS NOT NULL AND parada != '') 
               OR (obs != '' AND obs IS NOT NULL)
               OR desvio < -10
            ORDER BY data DESC, id DESC 
            LIMIT 15
        `);

        // Resumo de frota
        const frotaOperacional = frota.filter(e => e.status === 'Operacional').length;
        const frotaManutencao = frota.filter(e => e.status === 'Em Manutenção');

        return {
            timestamp: new Date().toISOString(),
            usuario: {
                nome: usuarioLogado.nome || 'Colaborador',
                cargo: usuarioLogado.cargoLabel || usuarioLogado.cargo || 'Operacional',
                obra: usuarioLogado.obra || 'SP-270 Rodovia Raposo Tavares'
            },
            kpisGerais: kpis,
            ultimosApontamentos: ultimosApontamentos.map(a => ({
                id: a.id,
                protocolo: a.protocolo,
                data: a.data,
                turno: a.turno,
                obra: a.obra,
                equipe: a.equipe,
                encarregado: a.encarregado,
                atividade: a.atividade,
                planejado: `${a.planejado} ${a.unidade}`,
                realizado: `${a.realizado} ${a.unidade}`,
                desvioPercentual: `${a.desvio}%`,
                eficiencia: `${a.eficiencia}%`,
                produtividadeHora: `${a.produtividade} ${a.unidade}/h`,
                clima: a.clima,
                parada: a.parada,
                observacao: a.obs,
                status: a.status
            })),
            obras: todasObras.map(o => ({
                nome: o.nome,
                local: o.local,
                responsavel: o.eng,
                progresso: `${o.progresso}%`,
                volume: o.volume_total,
                status: o.status
            })),
            equipes: todasEquipes.map(e => ({
                nome: e.nome,
                lider: e.encarregado,
                atividade: e.atividade,
                obra: e.obra,
                integrantes: e.integrantes,
                metaAcumulada: e.meta_acumulada,
                realizadoAcumulado: e.realizado_acumulado,
                status: e.status
            })),
            frota: {
                total: frota.length,
                operando: frotaOperacional,
                emManutencao: frotaManutencao.map(m => `${m.codigo} (${m.tipo} - ${m.local})`)
            },
            ocorrenciasERecorrencias: ocorrencias.map(o => ({
                data: o.data,
                protocolo: o.protocolo,
                obra: o.obra,
                equipe: o.equipe,
                motivoParada: o.parada,
                detalhes: o.obs,
                desvio: `${o.desvio}%`
            }))
        };
    }
};
