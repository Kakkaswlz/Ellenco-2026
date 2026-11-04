-- ====================================================================
-- ELLENCO - DADOS INICIAIS REALÍSTICOS (SEED)
-- ====================================================================

-- 1. USUÁRIOS
INSERT INTO usuarios (id, nome, re, email, telefone, cargo, cargo_label, nivel, obra, status, aprovado_por, senha) VALUES
(1, 'Carlos Silva', 'RE-8842', 'carlos.silva@ellenco.com.br', '(15) 99711-2233', 'operacional', 'Encarregado de Equipe', 1, 'SP-270 Rodovia Raposo Tavares', 'aprovado', 'Diretoria de Obras', '123'),
(2, 'Eng. Ricardo Viana', 'RE-1005', 'ricardo.viana@ellenco.com.br', '(15) 99822-4455', 'gestor', 'Diretor de Operações', 4, 'Matriz / Todas as Obras', 'aprovado', 'Administração Geral', '123'),
(3, 'Marcos Souza', 'RE-7510', 'marcos.souza@ellenco.com.br', '(15) 99655-1122', 'operacional', 'Encarregado de Terraplanagem', 1, 'SP-270 Rodovia Raposo Tavares', 'aprovado', 'Eng. Ricardo Viana', '123'),
(4, 'Eng. Gabriel Martins', 'RE-3021', 'gabriel.martins@ellenco.com.br', '(15) 99788-3344', 'engenheiro', 'Engenheiro de Produção', 3, 'SP-270 Rodovia Raposo Tavares', 'aprovado', 'Diretor de Operações', '123'),
(5, 'Lucas Medeiros', 'RE-9920', 'lucas.medeiros@ellenco.com.br', '(15) 99123-4567', 'apontador', 'Apontador de Campo', 1, 'Loteamento Jardim Ellenco', 'pendente', NULL, '123')
ON CONFLICT (re) DO NOTHING;

-- 2. OBRAS
INSERT INTO obras (id, nome, local, eng, volume_total, progresso, status) VALUES
(1, 'SP-270 Rodovia Raposo Tavares', 'Sorocaba - SP (km 98 ao 115)', 'Eng. Gabriel Martins', '45.000 ton', 68.5, 'Em Andamento'),
(2, 'Loteamento Jardim Ellenco', 'Votorantim - SP', 'Eng. Rodrigo Alencar', '18.500 m³', 42.0, 'Em Andamento'),
(3, 'Pavimentação Industrial', 'Campinas - SP (Distrito Industrial)', 'Engª. Amanda Costa', '12.000 m³', 85.0, 'Em Fase Final'),
(4, 'Aeroporto Estadual', 'Ribeirão Preto - SP', 'Eng. Fernando Prado', '35.000 m²', 28.0, 'Recém Iniciada')
ON CONFLICT (nome) DO NOTHING;

-- 3. EQUIPES
INSERT INTO equipes (id, nome, encarregado, atividade, obra, integrantes, meta_acumulada, realizado_acumulado, produtividade_media, status) VALUES
(1, 'Equipe Pavimentação 01', 'Carlos Silva (RE-8842)', 'Pavimentação CBUQ', 'SP-270 Rodovia Raposo Tavares', 14, 3500, 3620, '56.1 ton/h', 'Acima da Meta'),
(2, 'Equipe Terraplanagem 02', 'Marcos Souza (RE-7510)', 'Corte e Aterro', 'SP-270 Rodovia Raposo Tavares', 12, 8500, 8750, '135.0 m³/h', 'Acima da Meta'),
(3, 'Equipe Drenagem 01', 'José Santos (RE-6420)', 'Galerias e Tubos', 'Loteamento Jardim Ellenco', 8, 600, 560, '9.3 m/h', 'Abaixo da Meta'),
(4, 'Equipe Base 03', 'Antônio Ferreira (RE-5128)', 'Base Brita Graduada (BGS)', 'Pavimentação Industrial', 10, 2500, 2350, '38.8 m³/h', 'Na Meta'),
(5, 'Equipe Fresagem 01', 'Paulo Lima (RE-4301)', 'Fresagem Asfáltica', 'Aeroporto Estadual', 11, 15000, 15800, '305.9 m²/h', 'Acima da Meta')
ON CONFLICT (nome) DO NOTHING;

-- 4. EQUIPAMENTOS
INSERT INTO equipamentos (id, codigo, tipo, modelo, horimetro, consumo_medio, local, status, ultima_manutencao) VALUES
(1, 'VIB-01', 'Vibroacabadora de Asfalto', 'Vögele Super 1800-3', 1420.5, '22.5 L/h', 'SP-270 Raposo Tavares', 'Operacional', '18/08/2026'),
(2, 'ROL-03', 'Rolo Compactador Tandem', 'Hamm HD 90 VT', 890.0, '14.0 L/h', 'SP-270 Raposo Tavares', 'Operacional', '15/08/2026'),
(3, 'ROL-07', 'Rolo Pneumático 26t', 'Dynapac CP275', 2140.2, '16.5 L/h', 'SP-270 Raposo Tavares', 'Operacional', '10/08/2026'),
(4, 'MOT-02', 'Motoniveladora Pesada', 'Caterpillar 140K', 3250.8, '24.0 L/h', 'Jardim Ellenco', 'Operacional', '12/08/2026'),
(5, 'ESC-04', 'Escavadeira Hidráulica 22t', 'Komatsu PC200-8', 1980.0, '20.0 L/h', 'Jardim Ellenco', 'Operacional', '19/08/2026'),
(6, 'FRE-01', 'Fresadora de Pavimento', 'Wirtgen W 200 F', 1120.4, '45.0 L/h', 'Aeroporto Estadual', 'Operacional', '14/08/2026'),
(7, 'CAM-12', 'Caminhão Basculante 6x4', 'Volvo FMX 460', 4850.0, '2.8 km/L', 'Pavimentação Industrial', 'Em Manutenção', '20/08/2026')
ON CONFLICT (codigo) DO NOTHING;

-- 5. APONTAMENTOS DE PRODUÇÃO (BDP)
INSERT INTO apontamentos (id, protocolo, data, turno, obra, equipe, encarregado, atividade, unidade, planejado, realizado, horas, efetivo, desvio, eficiencia, produtividade, clima, parada, obs, status, assinado_por) VALUES
(101, 'BDP-2026-8842', '2026-08-13', 'Diurno', 'SP-270 Rodovia Raposo Tavares', 'Equipe Pavimentação 01', 'Carlos Silva', 'Pavimentação CBUQ - Capa Asfáltica', 'ton', 450, 462, 8.5, 14, 2.67, 102.67, 54.4, 'Ensolarado', 'Nenhum', 'Produção transcorreu normalmente com excelente compactação.', 'Concluído', 'Carlos Silva'),
(102, 'BDP-2026-7510', '2026-08-14', 'Diurno', 'SP-270 Rodovia Raposo Tavares', 'Equipe Terraplanagem 02', 'Marcos Souza', 'Terraplanagem - Corte e Aterro', 'm3', 1200, 1250, 9.0, 12, 4.17, 104.17, 138.9, 'Nublado', 'Nenhum', 'Avanço no subleito do km 104.', 'Concluído', 'Marcos Souza'),
(103, 'BDP-2026-6420', '2026-08-15', 'Diurno', 'Loteamento Jardim Ellenco', 'Equipe Drenagem 01', 'José Santos', 'Assentamento de Tubos e Galerias', 'm', 80, 74, 8.0, 8, -7.50, 92.50, 9.3, 'Chuva Leve', 'Chuva / Clima', 'Chuva intermitente no período da tarde reduziu o ritmo da vala.', 'Concluído', 'José Santos'),
(104, 'BDP-2026-5128', '2026-08-16', 'Diurno', 'Pavimentação Industrial', 'Equipe Base 03', 'Antônio Ferreira', 'Aplicação de Brita Graduada (BGS)', 'm3', 350, 310, 8.0, 10, -11.43, 88.57, 38.8, 'Ensolarado', 'Manutenção de Equipamento', 'Rolo compactador parou 1h para troca de mangueira hidráulica.', 'Concluído', 'Antônio Ferreira'),
(105, 'BDP-2026-4301', '2026-08-17', 'Diurno', 'Aeroporto Estadual', 'Equipe Fresagem 01', 'Paulo Lima', 'Fresagem de Pavimento Asfáltico', 'm2', 2500, 2600, 8.5, 11, 4.00, 104.00, 305.9, 'Ensolarado', 'Nenhum', 'Liberação rápida de pista pela concessionária.', 'Concluído', 'Paulo Lima'),
(106, 'BDP-2026-8843', '2026-08-18', 'Diurno', 'SP-270 Rodovia Raposo Tavares', 'Equipe Pavimentação 01', 'Carlos Silva', 'Pavimentação CBUQ - Capa Asfáltica', 'ton', 500, 520, 9.0, 14, 4.00, 104.00, 57.8, 'Ensolarado', 'Nenhum', 'Entrega contínua de massa asfáltica pela Usina 02.', 'Concluído', 'Carlos Silva'),
(107, 'BDP-2026-9104', '2026-08-19', 'Noturno', 'SP-270 Rodovia Raposo Tavares', 'Equipe Sinalização Noturna', 'Roberto Dias', 'Pintura Termoplástica e Tachas', 'm2', 1800, 1850, 7.5, 9, 2.78, 102.78, 246.7, 'Bom Tempo', 'Nenhum', 'Execução noturna sem interferência de tráfego.', 'Concluído', 'Roberto Dias'),
(108, 'BDP-2026-8844', '2026-08-20', 'Diurno', 'SP-270 Rodovia Raposo Tavares', 'Equipe Pavimentação 01', 'Carlos Silva', 'Pavimentação CBUQ - Capa Asfáltica', 'ton', 480, 495, 8.5, 14, 3.12, 103.12, 58.2, 'Ensolarado', 'Nenhum', 'Excelente rendimento na faixa da direita.', 'Concluído', 'Carlos Silva')
ON CONFLICT (protocolo) DO NOTHING;

-- 6. NOTIFICAÇÕES
INSERT INTO notificacoes (id, titulo, mensagem, tipo, lida) VALUES
(1, 'Alerta de Desvio Crítico (-11.4%)', 'Equipe Base 03 na Pavimentação Industrial apontou produção abaixo de 90% da meta por parada mecânica.', 'alerta', FALSE),
(2, 'Solicitação de Acesso Pendente', 'Novo colaborador Lucas Medeiros (RE-9920) aguardando aprovação de cadastro.', 'aviso', FALSE),
(3, 'Meta Superada em Pavimentação', 'Equipe Pavimentação 01 superou a meta diária com 520 ton aplicadas na SP-270.', 'sucesso', FALSE);
