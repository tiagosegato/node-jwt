const express = require('express');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 3000;

// Chave secreta para assinar o JWT. 
const JWT_SECRET = 'seu-segredo-super-secreto'; // Em um projeto real, isso DEVE estar em uma variável de ambiente (.env)!

app.use(express.json());

// Nosso "banco de dados" de usuários.
const usuarios = [
    { id: 1, usuario: 'admin', senha: '123' },
    { id: 2, usuario: 'tiago', senha: 'abc' }
];

// ===== ROTAS ======

// Rota de Login para gerar o token
app.post('/login', (req, res) => {
    const { usuario, senha } = req.body;

    // 1. Encontrar o usuário no nosso "BD"
    const user = usuarios.find(u => u.usuario === usuario);

    // 2. Verificar se o usuário existe e se a senha está correta
    if (!user || user.senha !== senha) {
        return res.status(401).json({ mensagem: 'Usuário ou senha inválidos.' });
    }

    // 3. Se as credenciais estiverem corretas, gerar o token
    const token = jwt.sign({ userId: user.id, usuario: user.usuario }, JWT_SECRET, { expiresIn: '15m' }); // Token expira em 15 minutos

    // 4. Enviar o token para o cliente
    res.json({ mensagem: 'Login bem-sucedido!', token: token });
});

// Middleware para verificar o JWT
function verificaJWT(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ mensagem: 'Token de autenticação não fornecido.' });
    }
    // O token vem no formato "Bearer <token>"
    const token = authHeader.split(' ')[1]; //dividindo a string em 2, baseado no " ", e pegando apenas a posição 1
    // Verifica se o token é válido
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            // Se o erro for de expiração, a mensagem é mais específica
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({ mensagem: 'Token expirado.' });
            }
            return res.status(401).json({ mensagem: 'Token inválido.' });
        }
        // Se o token for válido, os dados decodificados são adicionados à requisição para uso posterior.
        req.usuarioLogado = decoded;
        next(); // Permite que a requisição prossiga para a rota
    });
}

// DEMAIS ROTAS

// Rota PÚBLICA, acessível por qualquer um
app.get('/', (req, res) => {
    res.json({ mensagem: 'Bem-vindo à nossa API pública!' });
});

// Rota PROTEGIDA, só pode ser acessada com um token JWT válido
// Note como passamos o middleware `verificaJWT` antes da função da rota.
app.get('/alunos', verificaJWT, (req, res) => {
    // Graças ao middleware, temos acesso a req.usuarioLogado
    console.log('Acessado por:', req.usuarioLogado);

    res.json({
        mensagem: `Acesso permitido para o usuário: ${req.usuarioLogado.usuario}.`,
        alunos: [
            { id: 1, nome: 'João' },
            { id: 2, nome: 'Maria' }
        ]
    });
});


// SERVIDOR
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});