const express = require("express");
const path = require("path");

try {
    require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
} catch (error) {
    console.warn("dotenv ausente; usando variáveis de ambiente do sistema.");
}

const app = express();
const PORT = Number(process.env.ASSISTENTE_PORT || 3001);
const MAIN_SERVER_PORT = Number(process.env.PORT || 3000);
const MAIN_SERVER_URL = process.env.MAIN_SERVER_URL || `http://127.0.0.1:${MAIN_SERVER_PORT}`;

app.use(express.json({ limit: "1mb" }));
app.use(express.static(__dirname, { dotfiles: "deny" }));

app.get("/teste", async (_req, res) => {
    try {
        const status = await fetch(`${MAIN_SERVER_URL}/api/status`, { signal: AbortSignal.timeout(3000) });
        return res.status(status.ok ? 200 : 503).json({
            status: status.ok ? "OK" : "Indisponível",
            mensagem: "Assistente conectado ao servidor principal Ellenco.",
            servidorPrincipal: status.ok
        });
    } catch {
        return res.status(503).json({
            status: "Indisponível",
            mensagem: "Inicie o servidor principal Ellenco na porta configurada.",
            servidorPrincipal: false
        });
    }
});

app.post("/api/chat", async (req, res) => {
    try {
        const upstream = await fetch(`${MAIN_SERVER_URL}/api/chat`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...(req.headers.cookie ? { Cookie: req.headers.cookie } : {})
            },
            body: JSON.stringify(req.body || {}),
            signal: AbortSignal.timeout(45000)
        });
        const body = await upstream.text();
        res.status(upstream.status).type(upstream.headers.get("content-type") || "application/json").send(body);
    } catch (error) {
        console.error("Falha ao encaminhar chat ao servidor principal:", error.message);
        res.status(502).json({ erro: "Servidor principal Ellenco indisponível." });
    }
});

app.listen(PORT, () => {
    console.log(`Interface auxiliar disponível em http://localhost:${PORT}`);
    console.log(`Chat protegido pelo servidor principal ${MAIN_SERVER_URL}`);
});
