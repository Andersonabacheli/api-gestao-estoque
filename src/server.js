
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Dados temporários: serão perdidos ao reiniciar a API.

let produtos = [
  {
    id: 1,
    codigo: "PROD001",
    nome: "Shampoo Hidratante",
    estoque: 150,
    estoqueMinimo: 30,
  },
  {
    id: 2,
    codigo: "PROD002",
    nome: "Condicionador",
    estoque: 120,
    estoqueMinimo: 25,
  },
  {
    id: 3,
    codigo: "PROD003",
    nome: "Creme Hidratante",
    estoque: 80,
    estoqueMinimo: 20,
  },
  {
    id: 4,
    codigo: "PROD004",
    nome: "Perfume",
    estoque: 60,
    estoqueMinimo: 15,
  },
  {
    id: 5,
    codigo: "PROD005",
    nome: "Sabonete Líquido",
    estoque: 200,
    estoqueMinimo: 40,
  },
  {
    id: 6,
    codigo: "PROD006",
    nome: "Álcool 70%",
    estoque: 90,
    estoqueMinimo: 20,
  },
  {
    id: 7,
    codigo: "PROD007",
    nome: "Matéria-prima Cosmética",
    estoque: 45,
    estoqueMinimo: 10,
  },
  {
    id: 8,
    codigo: "PROD008",
    nome: "Óleo Essencial",
    estoque: 35,
    estoqueMinimo: 10,
  },
  {
    id: 9,
    codigo: "PROD009",
    nome: "Embalagem Plástica",
    estoque: 500,
    estoqueMinimo: 100,
  },
  {
    id: 10,
    codigo: "PROD010",
    nome: "Caixa de Papelão",
    estoque: 250,
    estoqueMinimo: 50,
  },
  {
    id: 11,
    codigo: "PROD011",
    nome: "Fragrância Floral",
    estoque: 12,
    estoqueMinimo: 20,
  },
  {
    id: 12,
    codigo: "PROD012",
    nome: "Base para Creme",
    estoque: 70,
    estoqueMinimo: 15,
  },
];

let proximoId = 13;
let movimentacoes = [];


// Página inicial da API
app.get("/", (req, res) => {
  res.json({
    mensagem: "API de Gestão de Estoque",
    versao: "1.0.0",
    status: "online",
    endpoints: [
      "GET /health",
      "GET /api/produtos",
      "GET /api/produtos/:id",
      "POST /api/produtos",
      "PUT /api/produtos/:id",
      "DELETE /api/produtos/:id",
      "POST /api/movimentacoes",
      "GET /api/movimentacoes",
    ],
  });
});

// Verificar se a API está funcionando
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    servico: "api-gestao-estoque",
    horario: new Date().toISOString(),
  });
});

// Listar produtos e pesquisar pelo nome
app.get("/api/produtos", (req, res) => {
  const busca = String(req.query.busca || "").toLowerCase();

  const resultado = produtos.filter((produto) =>
    produto.nome.toLowerCase().includes(busca)
  );

  res.json({
    total: resultado.length,
    dados: resultado,
  });
});

// Consultar produto por ID
app.get("/api/produtos/:id", (req, res) => {
  const produto = produtos.find(
    (item) => item.id === Number(req.params.id)
  );

  if (!produto) {
    return res.status(404).json({
      erro: "Produto não encontrado",
    });
  }

  res.json(produto);
});

// Cadastrar produto
app.post("/api/produtos", (req, res) => {
  const { codigo, nome, estoque, estoqueMinimo } = req.body;

  if (
    typeof codigo !== "string" ||
    !codigo.trim() ||
    typeof nome !== "string" ||
    !nome.trim() ||
    !Number.isInteger(estoque) ||
    estoque < 0 ||
    (estoqueMinimo !== undefined &&
      (!Number.isInteger(estoqueMinimo) || estoqueMinimo < 0))
  ) {
    return res.status(400).json({
      erro: "Informe código, nome e quantidades inteiras válidas.",
    });
  }

  if (
    produtos.some(
      (item) => item.codigo.toLowerCase() === codigo.trim().toLowerCase()
    )
  ) {
    return res.status(409).json({
      erro: "Já existe um produto com esse código.",
    });
  }

  const novoProduto = {
    id: proximoId++,
    codigo: codigo.trim(),
    nome: nome.trim(),
    estoque,
    estoqueMinimo: estoqueMinimo ?? 0,
  };

  produtos.push(novoProduto);

  res.status(201).json({
    mensagem: "Produto cadastrado com sucesso",
    dados: novoProduto,
  });
});

// Atualizar dados do produto
app.put("/api/produtos/:id", (req, res) => {
  const produto = produtos.find(
    (item) => item.id === Number(req.params.id)
  );

  if (!produto) {
    return res.status(404).json({
      erro: "Produto não encontrado",
    });
  }

  const { codigo, nome, estoqueMinimo } = req.body;

  if (
    (codigo !== undefined &&
      (typeof codigo !== "string" || !codigo.trim())) ||
    (nome !== undefined &&
      (typeof nome !== "string" || !nome.trim())) ||
    (estoqueMinimo !== undefined &&
      (!Number.isInteger(estoqueMinimo) || estoqueMinimo < 0))
  ) {
    return res.status(400).json({
      erro: "Dados inválidos para atualização.",
    });
  }

  if (
    codigo !== undefined &&
    produtos.some(
      (item) =>
        item.id !== produto.id &&
        item.codigo.toLowerCase() === codigo.trim().toLowerCase()
    )
  ) {
    return res.status(409).json({
      erro: "Esse código já está cadastrado.",
    });
  }

  if (codigo !== undefined) produto.codigo = codigo.trim();
  if (nome !== undefined) produto.nome = nome.trim();
  if (estoqueMinimo !== undefined) {
    produto.estoqueMinimo = estoqueMinimo;
  }

  res.json({
    mensagem: "Produto atualizado",
    dados: produto,
  });
});

// Excluir produto sem histórico de movimentações
app.delete("/api/produtos/:id", (req, res) => {
  const id = Number(req.params.id);
  const produto = produtos.find((item) => item.id === id);

  if (!produto) {
    return res.status(404).json({
      erro: "Produto não encontrado",
    });
  }

  if (movimentacoes.some((item) => item.produtoId === id)) {
    return res.status(409).json({
      erro: "Produto com histórico não pode ser excluído.",
    });
  }

  produtos = produtos.filter((item) => item.id !== id);

  res.json({ mensagem: "Produto excluído com sucesso" });
});

// Registrar entrada ou saída do estoque
app.post("/api/movimentacoes", (req, res) => {
  const { produtoId, tipo, quantidade } = req.body;

  if (
    !Number.isInteger(produtoId) ||
    !["entrada", "saida"].includes(tipo) ||
    !Number.isInteger(quantidade) ||
    quantidade <= 0
  ) {
    return res.status(400).json({
      erro: "Informe produtoId, tipo entrada/saida e quantidade positiva.",
    });
  }

  const produto = produtos.find((item) => item.id === produtoId);

  if (!produto) {
    return res.status(404).json({
      erro: "Produto não encontrado",
    });
  }

  if (tipo === "saida" && produto.estoque < quantidade) {
    return res.status(409).json({
      erro: "Estoque insuficiente",
      estoqueAtual: produto.estoque,
    });
  }

  produto.estoque += tipo === "entrada" ? quantidade : -quantidade;

  const movimentacao = {
    id: movimentacoes.length + 1,
    produtoId,
    tipo,
    quantidade,
    estoqueFinal: produto.estoque,
    data: new Date().toISOString(),
  };

  movimentacoes.push(movimentacao);

  res.status(201).json({
    mensagem: "Movimentação registrada",
    dados: movimentacao,
  });
});

// Consultar histórico de movimentações
app.get("/api/movimentacoes", (req, res) => {
  res.json({
    total: movimentacoes.length,
    dados: movimentacoes,
  });
});

// Tratar rotas inexistentes
app.use((req, res) => {
  res.status(404).json({
    erro: "Rota não encontrada",
  });
});

app.listen(PORT, () => {
  console.log(`API rodando em http://localhost:${PORT}`);
});
