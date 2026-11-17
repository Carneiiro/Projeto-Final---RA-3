// ===== Constantes (valores fixos) =====
const API_URL = "https://www.themealdb.com/api/json/v1/1/search.php?s=";
const POST_URL = "https://jsonplaceholder.typicode.com/posts";
const TERMO_PADRAO = "chicken";
const CHAVE_FAVORITOS = "favoritosReceitas";
const CHAVE_TEMA = "tema";
const MAX_INGREDIENTES = 20;
const ATRASO_BUSCA = 400;

// ===== Estado da página =====
// Array que guarda os dados vindos da API
let listaDeReceitas = [];
// Guarda o timer da busca (usado no debounce)
let tempoBusca;

// ===== localStorage: favoritos =====
// Lê a lista de favoritos (array de objetos) salva no navegador
function lerFavoritos() {
  try {
    const salvos = JSON.parse(localStorage.getItem(CHAVE_FAVORITOS) || "[]");
    return Array.isArray(salvos) ? salvos : [];
  } catch (erro) {
    return [];
  }
}

// Salva a lista de favoritos como texto JSON
function salvarFavoritos(favoritos) {
  localStorage.setItem(CHAVE_FAVORITOS, JSON.stringify(favoritos));
}

// ===== Modo escuro =====
// Liga ou desliga a classe .escuro no body conforme o valor salvo
function aplicarTema() {
  const escuro = localStorage.getItem(CHAVE_TEMA) === "escuro";
  document.body.classList.toggle("escuro", escuro);
  document.querySelector(".tema").textContent = escuro ? "Modo claro" : "Modo escuro";
}

// Aplica o tema salvo e troca o tema a cada clique no botão
function configurarTema() {
  const botaoTema = document.querySelector(".tema");
  aplicarTema();
  botaoTema.addEventListener("click", () => {
    const novoTema = document.body.classList.contains("escuro") ? "claro" : "escuro";
    localStorage.setItem(CHAVE_TEMA, novoTema);
    aplicarTema();
  });
}

// ===== Receitas (GET na API) =====
// Conta quantos ingredientes a receita tem (campos strIngredient1 até strIngredient20)
function contarIngredientes(receita) {
  let total = 0;
  for (let i = 1; i <= MAX_INGREDIENTES; i++) {
    const ingrediente = receita["strIngredient" + i];
    if (ingrediente && ingrediente.trim()) total++;
  }
  return total;
}

// Busca receitas na TheMealDB e guarda no array listaDeReceitas
async function carregarReceitas(termo = TERMO_PADRAO) {
  const mensagem = document.getElementById("mensagem");
  mensagem.textContent = "Carregando...";
  try {
    const resposta = await fetch(API_URL + encodeURIComponent(termo));
    // Se a API respondeu com erro (404, 500...), cai no catch
    if (!resposta.ok) throw new Error("Erro na API.");
    const dados = await resposta.json();
    // A API devolve null quando não encontra nada
    listaDeReceitas = dados.meals || [];
    mensagem.textContent = listaDeReceitas.length ? "Receitas carregadas." : "Nenhuma receita encontrada.";
    filtrarFavoritos();
  } catch (erro) {
    listaDeReceitas = [];
    mostrarCartoes(listaDeReceitas);
    mensagem.textContent = "Erro ao carregar. Tente novamente mais tarde.";
  }
}

// Cria um cartão na tela para cada receita da lista
function mostrarCartoes(lista) {
  const area = document.getElementById("listaReceitas");
  const nomesFavoritos = lerFavoritos().map((favorito) => favorito.nome);
  area.textContent = "";
  lista.forEach((receita) => {
    const favorita = nomesFavoritos.includes(receita.strMeal);
    const cartao = document.createElement("article");
    cartao.className = "cartao";
    // Marca visualmente o cartão favorito
    cartao.classList.toggle("favorito", favorita);

    const imagem = document.createElement("img");
    imagem.src = receita.strMealThumb;
    imagem.alt = "Foto do prato " + receita.strMeal;

    const titulo = document.createElement("h2");
    titulo.textContent = receita.strMeal;

    const texto = document.createElement("p");
    texto.textContent = "Categoria: " + receita.strCategory + " | Origem: " + (receita.strArea || "Não informada");

    const ingredientes = document.createElement("p");
    ingredientes.textContent = "Ingredientes: " + contarIngredientes(receita);

    const botao = document.createElement("button");
    botao.className = "botao";
    botao.textContent = favorita ? "Remover favorito" : "Favoritar";
    // Função anônima no evento de clique
    botao.addEventListener("click", function () {
      alternarFavorito(receita);
      filtrarFavoritos();
    });

    cartao.append(imagem, titulo, texto, ingredientes, botao);
    area.appendChild(cartao);
  });
}

// Adiciona a receita aos favoritos, ou remove se já estava
function alternarFavorito(receita) {
  const favoritos = lerFavoritos();
  const jaFavorita = favoritos.find((favorito) => favorito.nome === receita.strMeal);
  if (jaFavorita) {
    salvarFavoritos(favoritos.filter((favorito) => favorito.nome !== receita.strMeal));
  } else {
    favoritos.push({
      nome: receita.strMeal,
      categoria: receita.strCategory,
      origem: receita.strArea || "Não informada",
      ingredientes: contarIngredientes(receita)
    });
    salvarFavoritos(favoritos);
  }
}

// Mostra todas as receitas ou só os favoritos, conforme o checkbox
function filtrarFavoritos() {
  const somenteFavoritos = document.getElementById("somenteFavoritos").checked;
  const nomesFavoritos = lerFavoritos().map((favorito) => favorito.nome);
  const filtrados = somenteFavoritos
    ? listaDeReceitas.filter((receita) => nomesFavoritos.includes(receita.strMeal))
    : listaDeReceitas;
  if (listaDeReceitas.length) {
    document.getElementById("mensagem").textContent = filtrados.length ? "Receitas carregadas." : "Nenhum favorito nesta busca.";
  }
  mostrarCartoes(filtrados);
}

// ===== TDE 01: funções da página Ferramentas =====
function somar(a, b) { return a + b; }
function subtrair(a, b) { return a - b; }
function multiplicar(a, b) { return a * b; }
// Divisão por zero devolve mensagem em vez de Infinity
function dividir(a, b) { return b === 0 ? "Não é possível dividir por zero." : a / b; }

// Callback: recebe uma função (operacao) e executa com a e b
function calcular(a, b, operacao) { return operacao(a, b); }

// Calcula a média de um array de números usando reduce
const calcularMedia = (numeros) =>
  numeros.length ? numeros.reduce((soma, numero) => soma + numero, 0) / numeros.length : 0;

// Filtra os favoritos que têm pelo menos "minimo" ingredientes
const filtrarPorIngredientes = (favoritos, minimo) =>
  favoritos.filter((favorito) => favorito.ingredientes >= minimo);

// Mostra quantidade de favoritos e a média de ingredientes
function atualizarEstatisticas() {
  const favoritos = lerFavoritos();
  document.getElementById("estatistica").textContent = "Você possui " + favoritos.length + " receita(s) favorita(s).";
  const media = calcularMedia(favoritos.map((favorito) => favorito.ingredientes));
  document.getElementById("mediaIngredientes").textContent = favoritos.length
    ? "Média de ingredientes dos favoritos: " + media.toFixed(1)
    : "Média de ingredientes dos favoritos: —";
  mostrarFiltradas();
}

// Lista os favoritos com ingredientes acima do mínimo digitado
function mostrarFiltradas() {
  const minimo = Number(document.getElementById("minimoIngredientes").value) || 0;
  const lista = document.getElementById("listaFiltrada");
  const filtradas = filtrarPorIngredientes(lerFavoritos(), minimo);
  lista.textContent = "";
  if (!filtradas.length) {
    const vazio = document.createElement("li");
    vazio.textContent = "Nenhuma receita encontrada.";
    lista.appendChild(vazio);
    return;
  }
  filtradas.forEach((favorito) => {
    const item = document.createElement("li");
    item.textContent = favorito.nome + " (" + favorito.ingredientes + " ingredientes)";
    lista.appendChild(item);
  });
}

// Liga a calculadora de porções e as estatísticas (só existe na página Ferramentas)
function configurarFerramentas() {
  const estatistica = document.getElementById("estatistica");
  if (!estatistica) return;
  atualizarEstatisticas();
  document.getElementById("minimoIngredientes").addEventListener("input", mostrarFiltradas);

  const funcoes = { somar, subtrair, multiplicar, dividir };
  const campoA = document.getElementById("numeroA");
  const campoB = document.getElementById("numeroB");
  const resultado = document.getElementById("resultado");
  document.querySelectorAll(".operacao").forEach((botao) => {
    botao.addEventListener("click", () => {
      // Marca em vermelho os campos vazios
      campoA.classList.toggle("erro", campoA.value === "");
      campoB.classList.toggle("erro", campoB.value === "");
      if (campoA.value === "" || campoB.value === "") {
        resultado.textContent = "Preencha os dois campos.";
        return;
      }
      const valor = calcular(Number(campoA.value), Number(campoB.value), funcoes[botao.dataset.operacao]);
      resultado.textContent = "Resultado: " + (typeof valor === "number" ? Number(valor.toFixed(2)) : valor);
    });
  });
}

// ===== Formulário de contato (POST) =====
function configurarFormulario() {
  const formulario = document.getElementById("formContato");
  if (!formulario) return;
  formulario.addEventListener("submit", async (evento) => {
    // Impede a página de recarregar ao enviar
    evento.preventDefault();
    const retorno = document.getElementById("retornoFormulario");
    retorno.classList.remove("erro");
    retorno.textContent = "Enviando...";
    try {
      const resposta = await fetch(POST_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(new FormData(formulario)))
      });
      if (!resposta.ok) throw new Error("Erro no envio.");
      retorno.textContent = "Mensagem enviada com status " + resposta.status + ".";
      formulario.reset();
    } catch (erro) {
      retorno.classList.add("erro");
      retorno.textContent = "Não foi possível enviar a mensagem.";
    }
  });
}

// ===== Inicialização =====
// Quando o HTML terminar de carregar, liga cada parte da página
document.addEventListener("DOMContentLoaded", () => {
  configurarTema();
  // Só na página Explorar
  if (document.getElementById("listaReceitas")) {
    // Busca em tempo real com debounce: espera o usuário parar de digitar
    document.getElementById("busca").addEventListener("input", (evento) => {
      clearTimeout(tempoBusca);
      tempoBusca = setTimeout(() => carregarReceitas(evento.target.value || TERMO_PADRAO), ATRASO_BUSCA);
    });
    document.getElementById("somenteFavoritos").addEventListener("change", filtrarFavoritos);
    carregarReceitas();
  }
  configurarFerramentas();
  configurarFormulario();
});
