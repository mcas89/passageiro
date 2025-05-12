const firebaseURL = 'https://cardosoborracharia-a8854-default-rtdb.firebaseio.com/passageiros';
const geoapifyKey = '6d5858a5a2b143618a05523338f5a0aa';
let mapa, marcadorA, marcadorB;
let mapaCorrida;
let wakeLock = null;
let debounceTimeout;

window.onload = verificarSessao;
window.addEventListener("DOMContentLoaded", preencherBairros);
localStorage.setItem("cpfPassageiro", cpf);

const bairros = {
  "Parque Continental": [
      "Continental I", "Continental II", "Continental III", "Continental IV", "Continental V",
      "Jardim Renzo (Gleba I)", "Jardim Betel (Antigo Parque Continental Gleba B)",
      "Jardim Gracinda (Gleba II)", "Jardim Cambará (Gleba III)", "Jardim Valéria (Gleba IV)",
      "Jardim Itapoã (Gleba IV)", "Jardim Adriana I (Gleba V)", "Jardim Adriana II (Gleba V)"
  ],
  "Cabuçu": [
      "Vila Cambara", "Jardim Dorali", "Jardim Palmira", "Jardim Rosana", "Jardim Renzo",
      "Recreio São Jorge", "Novo Recreio", "Chácaras Cabuçu", "Jardim Monte Alto"
  ],
  "São João": [
      "Vila Rica", "Vila São João", "Jardim São Geraldo", "Jardim Vida Nova", "Jardim São João",
      "Vila São Carlos", "Jardim Lenize", "Jardim Bondança", "Jardim Jade", "Jardim Cristina",
      "Vila Girassol", "Jardim Santa Terezinha", "Jardim Aeródromo", "Cidade Soberana",
      "Jardim Santo Expedito", "Cidade Seródio", "Jardim Novo Portugal", "Jardim Regina",
      "Conjunto Residencial Haroldo Veloso"
  ],
  "Taboão": [
      "Vila Mesquita", "Jardim Nova Taboão", "Jardim Santa Emília", "Jardim Imperial",
      "Jardim Silvia", "Jardim Paraíso", "Jardim Acácio", "Parque Mikail", "Parque Mikail II",
      "Jardim Araújo", "Vila Araújo", "Jardim Beirute", "Vila do Eden", "Jardim Odete",
      "Jardim Taboão", "Jardim Santa Inês", "Jardim Santa Rita", "Jardim Belvedere",
      "Jardim São Domingos", "Jardim Santa Lídia", "Jardim Dona Meri", "Jardim Marilena",
      "Jardim Seviolli II", "Jardim Santa Vicência", "Jardim Sueli", "Jardim São José",
      "Jardim Capri", "Jardim das Acácias", "Jardim Pereira", "Jardim Santo Eduardo",
      "Jardim Tamassia", "Parque Santo Agostinho", "Parque Industrial do Jardim São Geraldo"
  ],
  "Fortaleza": [
      "Jardim Fortaleza", "Rocinha"
  ]
  // ... (adicione os outros bairros)
};

function preencherBairros() {
  const select = document.getElementById("bairroCadastro");

  // Garante que apenas a opção padrão permaneça
  select.innerHTML = '<option value="">Selecione um bairro</option>';

  // Itera sobre os bairros pais
  Object.values(bairros).forEach(lista => {
    lista.forEach(bairroFilho => {
      const option = document.createElement("option");
      option.value = bairroFilho;
      option.textContent = bairroFilho;
      select.appendChild(option);
    });
  });
}

function mostrarCadastro() {
document.getElementById('loginSection').classList.add('hidden');
document.getElementById('cadastroSection').classList.remove('hidden');
}

function mostrarLogin() {
document.getElementById('cadastroSection').classList.add('hidden');
document.getElementById('loginSection').classList.remove('hidden');


}

function cadastrarPassageiro() {
    const nome = document.getElementById('nomeCadastro').value.trim();
    const cpf = document.getElementById('cpfCadastro').value.trim();
    const senha = document.getElementById('senhaCadastro').value;
    const telefone = document.getElementById('telefoneCadastro').value.trim();
    const bairro = document.getElementById('bairroCadastro').value.trim();
    

    if (!nome || !cpf || !senha || !telefone || !bairro) {
        return mostrarPopup('Preencha todos os campos obrigatórios.', 3000)
    }

    if (!validarCPF(cpf)) {
        return mostrarPopup('CPF inválido. Verifique e tente novamente.', 3000)
    }

    if (senha.length < 4) {
        return mostrarPopup('Senha deve ter pelo menos 4 caracteres.', 3000)
    }

    fetch(`${firebaseURL}/${cpf}.json`)
        .then(res => res.json())
        .then(data => {
            if (data) {
                return mostrarPopup('Este CPF já está cadastrado.', 3000)
            }

            fetch(`${firebaseURL}/${cpf}.json`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome, senha, telefone, bairro })
            })
            .then(() => {
                mostrarPopup('Cadastro realizado com sucesso!', 3000)
                mostrarLogin();
            })
            .catch(err => {
                console.error(err);
                mostrarPopup('Erro ao cadastrar.', 3000)
            });
        })
        .catch(err => {
            console.error(err);
            mostrarPopup('Erro ao verificar CPF.', 3000)
        });
}

function validarCPF(cpf) {
    cpf = cpf.replace(/[^\d]+/g, ''); // Remove não números
  
    if (cpf.length !== 11) return false;
    if (/^(\d)\1+$/.test(cpf)) return false; // Ex: 111.111.111-11
  
    let soma = 0;
    for (let i = 0; i < 9; i++) {
      soma += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.charAt(9))) return false;
  
    soma = 0;
    for (let i = 0; i < 10; i++) {
      soma += parseInt(cpf.charAt(i)) * (11 - i);
    }
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.charAt(10))) return false;
  
    return true;
  }

function loginPassageiro() {
    const cpf = document.getElementById('cpf').value;
    const senha = document.getElementById('senha').value;

    fetch(`${firebaseURL}/${cpf}.json`)
        .then(res => res.json())
        .then(data => {
            if (!data) return mostrarPopup('CPF não cadastrado.', 3000)
            if (data.senha !== senha) return mostrarPopup('Senha incorreta.', 3000)

            // Salvar dados no LocalStorage
            localStorage.setItem('usuarioLogado', JSON.stringify({
                cpf: cpf,
                nome: data.nome,
                telefone: data.telefone,
                bairro: data.bairro // <--- CORREÇÃO: Adicionada esta linha para incluir o bairro
            }));

            exibirInfoUsuario(data); // Função para exibir informações do usuário
            obterLocalizacaoAtual();
            window.cpfLogado = cpf;
            buscarCorridaExistente();
        })
        .catch(err => {
            console.error(err);
            alert("Erro ao conectar ao servidor.");
        });
}

function exibirInfoUsuario(data) {
    document.getElementById("nomeUsuario").textContent = data.nome;
    document.getElementById("telefoneUsuario").textContent = data.telefone;
    document.getElementById("bairroUsuarioTexto").textContent = data.bairro; // Adicionei esta linha

    document.getElementById('infoMotorista').style.display = 'none';
    document.querySelector('button[onclick="finalizarCorrida()"]').style.display = 'none';

    document.getElementById('infoMotorista').style.display = 'none';
    const botaoSolicitar = document.querySelector('button[onclick="solicitarCorrida()"]');
    if (botaoSolicitar) botaoSolicitar.style.display = 'none';

    document.getElementById("loginSection").classList.add("hidden");
    document.getElementById("infoUsuario").classList.remove("hidden");
    document.querySelector(".usuario-dados").classList.remove("hidden");
    document.querySelector(".usuario-rotas").classList.remove("hidden");
}

function verificarSessao() {
    const usuarioLogado = localStorage.getItem('usuarioLogado');
    document.getElementById('fecharcarddestino').style.display = 'none';

    if (usuarioLogado) {
        const usuario = JSON.parse(usuarioLogado);
        window.cpfLogado = usuario.cpf; // Restaurar o cpfLogado
        exibirInfoUsuario(usuario); // Exibir informações
        obterLocalizacaoAtual();
        buscarCorridaExistente();
    }
}

function logoutPassageiro() {
    localStorage.removeItem('usuarioLogado'); // Limpa os dados do usuário do LocalStorage
    window.cpfLogado = null; // Limpa o CPF logado (se você estiver usando isso globalmente)

    // Oculta a seção de informações do usuário e mostra a seção de login
    document.getElementById("infoUsuario").classList.add("hidden");
    document.getElementById("loginSection").classList.remove("hidden");
    releaseWakeLock()

    // Limpa os campos de entrada (opcional)
    document.getElementById("cpf").value = "";
    document.getElementById("senha").value = "";

    // Redireciona para a página inicial ou atualiza (opcional)
    // window.location.href = "index.html"; // Se você quiser redirecionar
    window.location.reload(); // Se você quiser apenas recarregar a página
}

const requestWakeLock = async () => {
  try {
    wakeLock = await navigator.wakeLock.request('screen');
    console.log("Wake Lock is active!");

    wakeLock.addEventListener('release', () => {
      console.log("Wake Lock was released");
    });
  } catch (err) {
    console.error(`${err.name}, ${err.message}`);
  }
};

const releaseWakeLock = () => {
  if (wakeLock) {
    wakeLock.release();
    wakeLock = null;
    console.log("Wake Lock released");
  }
};

function obterLocalizacaoAtual() {
if (navigator.geolocation) {
navigator.geolocation.getCurrentPosition(pos => {
  const { latitude, longitude } = pos.coords;
  fetch(`https://api.geoapify.com/v1/geocode/reverse?lat=${latitude}&lon=${longitude}&apiKey=${geoapifyKey}`)
    .then(res => res.json())
    .then(data => {
      const endereco = data.features[0].properties.formatted;
      document.getElementById('partida').value = endereco;
    });
});
}
}

function autocompleteEndereco(input, sugestaoId) {
  clearTimeout(debounceTimeout);

  debounceTimeout = setTimeout(() => {
    const valor = input.value.trim();
    const sugestoes = document.getElementById(sugestaoId);

    if (valor.length < 4) {
      sugestoes.innerHTML = '';
      sugestoes.classList.add('hidden');
      return;
    }

   fetch(`https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(valor)}&limit=5&lang=pt&filter=circle:-46.5333,-23.4545,5000&apiKey=${geoapifyKey}`)

      .then(res => res.json())
      .then(data => {
        sugestoes.innerHTML = '';

        if (!data.features || data.features.length === 0) {
          sugestoes.classList.add('hidden');
          return;
        }

        data.features.forEach(feature => {
          const div = document.createElement('div');
          const textoCompleto = feature.properties.formatted;

          const regex = new RegExp(`(${valor})`, 'i');
          const textoDestacado = textoCompleto.replace(regex, `<strong>$1</strong>`);
          div.innerHTML = textoDestacado;

          div.style.cursor = 'pointer';
          div.style.padding = '5px';

          div.onclick = () => {
            input.value = textoCompleto;
            sugestoes.innerHTML = '';
            sugestoes.classList.add('hidden');
          };

          sugestoes.appendChild(div);
        });

        sugestoes.classList.remove('hidden');
      })
      .catch(error => {
        console.error("Erro ao buscar sugestões:", error);
        sugestoes.classList.add('hidden');
      });
  }, 300);
}

async function calcularRota() {
document.querySelector('button[onclick="solicitarCorrida()"]').style.display = 'block';
document.getElementById('fecharcarddestino').style.display = 'block';
const partida = document.getElementById('partida').value;
const destino = document.getElementById('destino').value;
if (!partida || !destino) return alert('Informe partida e destino.');


// Verificar se as coordenadas são válidas
const coordPartida = await getCoords(partida);
const coordDestino = await getCoords(destino);

if (!coordPartida || !coordDestino) {
return mostrarPopup('Não foi possível obter as coordenadas. Verifique os endereços.', 3000)
}

// Exibir o mapa utilizando a função de mostrarMapa
mostrarMapa(partida, destino);

// Chamada à API do Geoapify para calcular a rota
fetch(`https://api.geoapify.com/v1/routing?waypoints=${coordPartida.join(',')}|${coordDestino.join(',')}&mode=drive&apiKey=${geoapifyKey}`)
.then(res => res.json())
.then(data => {
  // Verificar se a API retornou um resultado válido
  if (!data.features || data.features.length === 0) {
  console.error('Não foi possível calcular a rota.');
  return; // encerra a execução
}

  const distanciaKm = data.features[0].properties.distance / 1000;
  const preco = Math.max(5, 5 + 2 * distanciaKm);

  document.getElementById('resumoPartida').textContent = partida;
  document.getElementById('resumoDestino').textContent = destino;
  document.getElementById('distanciaTotal').textContent = distanciaKm.toFixed(2);
  document.getElementById('precoEstimado').textContent = preco.toFixed(2);
  document.getElementById('resumoCorrida').classList.remove('hidden');
  document.getElementById('botaoCancelar').style.display = 'none';
  document.querySelector('button[onclick="finalizarCorrida()"]').style.display = 'none';

    document.getElementById('partida').style.display = 'none';
    document.getElementById('destino').style.display = 'none';
    const botaoOk = document.querySelector('button[onclick="calcularRota()"]');
    if (botaoOk) botaoOk.style.display = 'none';

})
.catch(err => {
  console.error(err);
  mostrarPopup('Ocorreu um erro ao calcular a rota.', 3000)
});
}

async function mostrarMapa(partida, destino) {
  const coords = await Promise.all([getCoords(partida), getCoords(destino)]);

  if (!coords[0] || !coords[1]) {
    return mostrarPopup('Não foi possível obter as coordenadas de partida ou destino.', 3000);
  }

  // Se o mapa já existir, remova-o
  if (mapa) {
    mapa.remove();
  }

  // Criar novo mapa
  mapa = L.map('mapaResumo').setView(coords[0], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapa);

  // Marcadores
  L.marker(coords[0]).addTo(mapa).bindPopup("Partida").openPopup();
  L.marker(coords[1]).addTo(mapa).bindPopup("Destino");

  try {
    const res = await fetch(`https://api.geoapify.com/v1/routing?waypoints=${coords[0][1]},${coords[0][0]}|${coords[1][1]},${coords[1][0]}&mode=drive&apiKey=${geoapifyKey}`);
    const data = await res.json();

    if (!data.features || data.features.length === 0) {
      return mostrarPopup('Não foi possível calcular a rota.', 2000);
    }

    const rota = data.features[0];
    const rotaCoords = rota.geometry.coordinates.map(c => [c[1], c[0]]);

    L.polyline(rotaCoords, { color: 'blue' }).addTo(mapa);
    mapa.fitBounds(rotaCoords);

    document.getElementById('distanciaAceita').textContent = (rota.properties.distance / 1000).toFixed(2);
    document.getElementById('duracaoAceita').textContent = (rota.properties.time / 60).toFixed(1);

    // Animação do marcador
    let i = 0;
    const marcadorAnimado = L.marker(rotaCoords[i]).addTo(mapa);

    const intervalo = setInterval(() => {
      if (i < rotaCoords.length - 1) {
        i++;
        marcadorAnimado.setLatLng(rotaCoords[i]);
      } else {
        clearInterval(intervalo);
      }
    }, 100);
  } catch (err) {
    console.error(err);
    mostrarPopup('Ocorreu um erro ao carregar a rota no mapa.', 2000);
  }
}

async function getCoords(endereco) {
const res = await fetch(`https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(endereco)}&apiKey=${geoapifyKey}`);
const data = await res.json();
if (data.features.length === 0) {
mostrarPopup('Endereço não encontrado:'+ endereco, 3000)
return null;
}
return [data.features[0].geometry.coordinates[1], data.features[0].geometry.coordinates[0]];
}

function solicitarCorrida() {
    const cpfPassageiro = window.cpfLogado;
    if (!cpfPassageiro) {
        mostrarPopup('Usuário não identificado.', 3000)
        return;
    }

    const partida = document.getElementById('partida').value;
    const destino = document.getElementById('destino').value;
    const distanciaKm = parseFloat(document.getElementById('distanciaTotal').textContent);
    const preco = parseFloat(document.getElementById('precoEstimado').textContent);
    requestWakeLock();

    if (!partida || !destino || isNaN(distanciaKm) || isNaN(preco)) {
        mostrarPopup('Informe todos os dados necessários para solicitar a corrida.', 3000)
        return;
    }

    // Buscar o bairro do passageiro no Firebase
    fetch(`${firebaseURL}/${cpfPassageiro}.json`)
        .then(res => res.json())
        .then(data => {
            if (!data || !data.bairro) {
                console.error('Bairro do passageiro não encontrado.');
                mostrarPopup('Erro: Bairro do passageiro não encontrado. Não é possível solicitar a corrida.', 3000)
                return; // Importante: interrompe a função se o bairro não for encontrado
            }

            const bairroPassageiro = data.bairro;

            const novaCorrida = {
                data: new Date().toISOString(),
                partida,
                destino,
                distancia_km: distanciaKm,
                preco,
                status: "pendente",
                motorista: "",
                bairroPassageiro // Adicionando o bairro do passageiro
            };

            const firebaseURLCorrida = `https://cardosoborracharia-a8854-default-rtdb.firebaseio.com/corridas/${cpfPassageiro}.json`;

            fetch(firebaseURLCorrida, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(novaCorrida)
            })
            .then(() => {
                mostrarPopup('Corrida solicitada com sucesso!', 3000)

                // Ocultar campos e botões
                document.getElementById('partida').style.display = 'none';
                document.getElementById('destino').style.display = 'none';

                const botaoOk = document.querySelector('button[onclick="calcularRota()"]');
                if (botaoOk) botaoOk.style.display = 'none';
                const botaoSolicitar = document.querySelector('button[onclick="solicitarCorrida()"]');
                if (botaoSolicitar) botaoSolicitar.style.display = 'none';
                const botaoCancelar = document.getElementById('botaoCancelar');
                if (botaoCancelar) botaoCancelar.style.display = 'block';

                // Atualiza o resumo
                document.getElementById('fecharcarddestino').style.display = 'none';
                document.getElementById('resumoCorrida').classList.remove('hidden');
                document.getElementById('resumoPartida').textContent = partida;
                document.getElementById('resumoDestino').textContent = destino;
                document.getElementById('distanciaTotal').textContent = distanciaKm.toFixed(2);
                document.getElementById('precoEstimado').textContent = preco.toFixed(2);

                // Mostra loading
                document.getElementById('loadingMotorista').classList.remove('hidden');

                // Iniciar monitoramento
                verificarAceiteMotorista(cpfPassageiro);
            })
            .catch(error => {
                console.error("Erro ao solicitar corrida:", error);
                mostrarPopup('Erro ao solicitar a corrida. Tente novamente.', 3000)
            });

        })
        .catch(error => {
            console.error("Erro ao buscar dados do passageiro:", error);
            mostrarPopup('Erro ao buscar dados do passageiro. Tente novamente.', 3000)
        });
}

function preencherResumoCorrida(corrida) {
document.getElementById('resumoCorrida').classList.remove('hidden');
document.getElementById('resumoPartida').textContent = corrida.partida;
document.getElementById('resumoDestino').textContent = corrida.destino;
document.getElementById('distanciaTotal').textContent = corrida.distancia_km.toFixed(2);
document.getElementById('precoEstimado').textContent = corrida.preco.toFixed(2);
document.getElementById('partida').style.display = 'none';
document.getElementById('destino').style.display = 'none';
document.querySelector('button[onclick="calcularRota()"]').style.display = 'none';
}

function exibirMotorista(cpfMotorista) {
  fetch(`https://cardosoborracharia-a8854-default-rtdb.firebaseio.com/motoristas/${cpfMotorista}.json`)
    .then(res => res.json())
    .then(motorista => {
      if (!motorista) {
        console.warn('Motorista não encontrado.');
        return;
      }

      document.getElementById('nomeMotorista').textContent = motorista.nome || 'Desconhecido';
      document.getElementById('carroMotorista').textContent = motorista.modelo || '-';
      document.getElementById('placaMotorista').textContent = motorista.placa || '-';

      document.getElementById('statusBusca').textContent = 'Motorista encontrado!';
      document.getElementById('dadosMotorista').classList.remove('hidden');
      document.getElementById('loadingMotorista').classList.remove('hidden');
    })
    .catch(err => console.error("Erro ao buscar dados do motorista:", err));
}



function verificarAceiteMotorista(cpfPassageiro) {
  window.temporizadorInterval = setInterval(() => {
    fetch(`https://cardosoborracharia-a8854-default-rtdb.firebaseio.com/corridas/${cpfPassageiro}.json`)
      .then(res => res.json())
      .then(data => {
        if (!data) return;

        if (data.status === 'aceita' && data.motorista) {
          if (!window.motoristaExibido || window.motoristaAtual !== data.motorista) {
            mostrarPopup('Sua corrida foi aceita pelo motorista!', 3000);
            exibirMotorista(data.motorista);
            window.motoristaExibido = true;
            window.motoristaAtual = data.motorista;
            document.querySelector('button[onclick="finalizarCorrida()"]').style.display = 'block';
            document.getElementById('infoMotorista').classList.remove('hidden'); // Corrigido aqui
          }
        } else if (data.status === 'pendente') {
          if (window.motoristaExibido) {
            limparMotorista();
            window.motoristaExibido = false;
            window.motoristaAtual = null;
            document.getElementById('loadingMotorista').classList.remove('hidden');
            document.getElementById('infoMotorista').classList.add('hidden'); // Corrigido aqui
            document.querySelector('button[onclick="finalizarCorrida()"]').style.display = 'none';
            mostrarPopup('Buscando novo motorista...', 3000);
          }
        } else if (data.status === 'cancelada') {
          limparMotorista();
          window.motoristaExibido = false;
          window.motoristaAtual = null;
          clearInterval(window.temporizadorInterval);
          document.getElementById('infoMotorista').classList.add('hidden'); // Corrigido aqui
          document.querySelector('button[onclick="finalizarCorrida()"]').style.display = 'none';
          mostrarPopup('Motorista cancelou a corrida.', 3000);
        }
      })
      .catch(err => console.error("Erro ao verificar corrida:", err));
  }, 3000);
}


function listenToCorridaStatus() {
const firebaseURL = `https://cardosoborracharia-a8854-default-rtdb.firebaseio.com/corridas/${window.corridaIdCriada}/status.json`;

// Usando fetch para ler o status em tempo real
fetch(firebaseURL)
.then(response => response.json())
.then(status => {
  console.log("Status da corrida:", status); // Adicionando log para verificar o status
  if (status === 'aceita') {
    // Se o status for "aceita", busca os dados do motorista
    fetchMotoristaData();
  }
})
.catch(error => {
  console.error("Erro ao consultar status da corrida:", error);
});
}

function fetchMotoristaData() {
// Aqui vamos supor que você tenha um campo "motoristaId" armazenado na corrida
const motoristaId = "algumMotoristaId"; // Substitua isso pelo ID correto do motorista
const firebaseMotoristaURL = `https://cardosoborracharia-a8854-default-rtdb.firebaseio.com/motoristas/${motoristaId}.json`;

console.log("Buscando dados do motorista na URL:", firebaseMotoristaURL); // Log para verificar a URL

fetch(firebaseMotoristaURL)
.then(response => response.json())
.then(motoristaData => {
  console.log("Dados do motorista:", motoristaData); // Verifique os dados retornados do Firebase

  if (motoristaData) {
    document.getElementById('motoristaNome').textContent = motoristaData.nome;
    document.getElementById('motoristaCarro').textContent = motoristaData.carro;

    // Exibe o card do motorista
    document.getElementById('motoristaInfo').classList.remove('hidden');
  } else {
    console.error("Dados do motorista não encontrados.");
  }
})
.catch(error => {
  console.error("Erro ao buscar dados do motorista:", error);
});
}

function cancelarCorrida() {
if (!confirm('Tem certeza que deseja cancelar a corrida?')) {
return;
}

const cpfPassageiro = window.cpfLogado;
if (!cpfPassageiro) {
mostrarPopup('Usuário não identificado.', 3000)
return;
}

const firebaseURLCorrida = `https://cardosoborracharia-a8854-default-rtdb.firebaseio.com/corridas/${cpfPassageiro}.json`;

fetch(firebaseURLCorrida, {
method: 'DELETE'
})
.then(() => {
// Voltar a mostrar inputs e botões
document.getElementById('partida').style.display = 'block';
document.getElementById('destino').style.display = 'block';
const botaoOk = document.querySelector('button[onclick="calcularRota()"]');
if (botaoOk) botaoOk.style.display = 'block';
const botaoSolicitar = document.querySelector('button[onclick="solicitarCorrida()"]');
if (botaoSolicitar) botaoSolicitar.style.display = 'block';
const botaoCancelar = document.getElementById('botaoCancelar');
if (botaoCancelar) botaoCancelar.style.display = 'none';

releaseWakeLock()

document.getElementById('infoMotorista').style.display = 'none';
document.getElementById('resumoCorrida').classList.add('hidden');
document.getElementById('loadingMotorista').classList.add('hidden');

limparMotorista();
window.corridaIdCriada = null;

mostrarPopup('Corrida cancelada com sucesso!', 3000)
})
.catch(error => {
console.error("Erro ao cancelar corrida:", error);
mostrarPopup('Erro ao cancelar a corrida. Tente novamente.', 3000)
});
}

function limparMotorista() {
  document.getElementById('loadingMotorista').classList.add('hidden');
  document.getElementById('dadosMotorista').classList.add('hidden');
  document.getElementById('statusBusca').innerHTML = 'Procurando motorista <i class="fas fa-spinner fa-spin"></i>';
  
  document.getElementById('nomeMotorista').textContent = '-';
  document.getElementById('carroMotorista').textContent = '-';
  document.getElementById('placaMotorista').textContent = '-';
}

function buscarCorridaExistente() {
const cpfPassageiro = window.cpfLogado;
if (!cpfPassageiro) return;

const firebaseURLCorrida = `https://cardosoborracharia-a8854-default-rtdb.firebaseio.com/corridas/${cpfPassageiro}.json`;

fetch(firebaseURLCorrida)
.then(res => res.json())
.then(data => {
  if (data && (data.status === 'pendente' || data.status === 'aceita')) {
    preencherResumoCorrida(data);


    verificarAceiteMotorista(cpfPassageiro);
  }
})
.catch(err => console.error("Erro ao buscar corrida existente:", err));
}

function finalizarCorrida() {
    if (!confirm('Confirma que a corrida foi finalizada?')) return;

    const cpfPassageiro = window.cpfLogado;
    const urlCorrida = `https://cardosoborracharia-a8854-default-rtdb.firebaseio.com/corridas/${cpfPassageiro}.json`;
    const urlHistorico = `https://cardosoborracharia-a8854-default-rtdb.firebaseio.com/historico/${cpfPassageiro}.json`;

    releaseWakeLock();

    console.log("🔍 Iniciando finalização de corrida...");

    fetch(urlCorrida)
        .then(res => res.json())
        .then(corrida => {
            console.log("✅ Corrida ativa encontrada:", corrida);
            if (!corrida) {
                alert('Nenhuma corrida ativa encontrada.');
                return;
            }

            const agora = new Date();
            const agoraISO = agora.toISOString();
            const chaveHistorico = agoraISO.replace(/[:.]/g, '_');
            corrida.dataFinalizacao = agoraISO;

            // Salva dados para o resumo antes de deletar
            const resumoPartida = corrida.partida || '';
            const resumoDestino = corrida.destino || '';
            const resumoDistancia = corrida.distancia_km || 0;
            const resumoMotorista = corrida.motorista || 'Não informado';
            const resumoPreco = corrida.preco || 0;

            // URL do histórico do motorista
            const urlHistoricoMotorista = `https://cardosoborracharia-a8854-default-rtdb.firebaseio.com/historico_motorista/${corrida.motorista}.json`;

            // Atualiza histórico do passageiro
            fetch(urlHistorico)
                .then(res => res.json())
                .then(historico => {
                    console.log("📦 Histórico atual (passageiro):", historico);
                    const novoHistorico = {};
                    const historicoArray = historico ? Object.entries(historico) : [];

                    historicoArray.sort((a, b) => a[0].localeCompare(b[0]));
                    const ultimos4 = historicoArray.slice(-4);

                    for (const [chave, corridaAnterior] of ultimos4) {
                        novoHistorico[chave] = corridaAnterior;
                    }

                    novoHistorico[chaveHistorico] = corrida;

                    return fetch(urlHistorico, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(novoHistorico)
                    });
                })
                .catch(err => console.error('❌ Erro ao salvar histórico do passageiro:', err));

            // Atualiza histórico do motorista
            fetch(urlHistoricoMotorista)
                .then(res => res.json())
                .then(historicoMotorista => {
                    console.log("📦 Histórico atual (motorista):", historicoMotorista);
                    const novoHistoricoMotorista = {};
                    const historicoArrayMotorista = historicoMotorista ? Object.entries(historicoMotorista) : [];

                    historicoArrayMotorista.sort((a, b) => a[0].localeCompare(b[0]));
                    const ultimos4Motorista = historicoArrayMotorista.slice(-4);

                    for (const [chave, corridaAnterior] of ultimos4Motorista) {
                        novoHistoricoMotorista[chave] = corridaAnterior;
                    }

                    novoHistoricoMotorista[chaveHistorico] = {
                        dataFinalizacao: agoraISO,
                        partida: corrida.partida,
                        destino: corrida.destino,
                        preco: corrida.preco,
                        status: 'finalizada',
                        passageiro: corrida.nomePassageiro || 'Desconhecido',
                    };

                    return fetch(urlHistoricoMotorista, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(novoHistoricoMotorista)
                    });
                })
                .catch(err => console.error('❌ Erro ao salvar histórico do motorista:', err));

            // Apagar corrida ativa e exibir resumo
            return fetch(urlCorrida, { method: 'DELETE' })
                .then(() => {
                    document.getElementById('resumoPartidaCard').textContent = resumoPartida;
                    document.getElementById('resumoDestinoCard').textContent = resumoDestino;
                    document.getElementById('resumoDistanciaCard').textContent = resumoDistancia.toFixed(2);
                    document.getElementById('resumoMotoristaCard').textContent = resumoMotorista;
                    document.getElementById('resumoPrecoCard').textContent = resumoPreco.toFixed(2);
                    document.getElementById('cardResumoCorrida').classList.remove('hidden');
                });
        })
        .catch(err => {
            console.error('❌ Erro ao finalizar corrida:', err);
            alert('Erro ao finalizar corrida.');
        });
}

function fecharcarddestino() {
    document.getElementById('partida').style.display = 'block';
    document.getElementById('destino').style.display = 'block';

    const botaoOk = document.querySelector('button[onclick="calcularRota()"]');
    if (botaoOk) botaoOk.style.display = 'inline-block';

    document.getElementById('infoMotorista').style.display = 'none';
    document.getElementById('resumoCorrida').classList.add('hidden');
    document.getElementById('loadingMotorista').classList.add('hidden');
}

function editarPerfil() {
    const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));
    if (!usuarioLogado) {
        alert('Usuário não logado.');
        return;
    }

    document.querySelector('.usuario-dados').classList.add('hidden');
    document.querySelector('.usuario-rotas').classList.add('hidden');
    document.querySelector('button[onclick="calcularRota()"]').style.display = 'none';
    document.getElementById('editarPerfilForm').classList.remove('hidden');

    document.getElementById('editarNome').value = usuarioLogado.nome;
    document.getElementById('editarTelefone').value = usuarioLogado.telefone;

    // Preencher o select de bairros no formulário de edição
    const selectEditarBairro = document.getElementById('editarBairro');
    selectEditarBairro.innerHTML = '<option value="">Selecione o bairro</option>';

    let bairroEncontrado = false; // Flag para verificar se o bairro existe nas opções
    Object.values(bairros).forEach(lista => {
        lista.forEach(bairroFilho => {
            const option = document.createElement('option');
            option.value = bairroFilho;
            option.textContent = bairroFilho;
            selectEditarBairro.appendChild(option);
            if (document.getElementById('bairroUsuarioTexto').textContent === bairroFilho) {
                bairroEncontrado = true;
            }
        });
    });

    if (bairroEncontrado) {
        document.getElementById('editarBairro').value = document.getElementById('bairroUsuarioTexto').textContent;
    } else {
        console.warn('Bairro do usuário não encontrado na lista de bairros.');
        document.getElementById('editarBairro').value = ""; // Ou defina um valor padrão
    }
}

function cancelarEdicao() {
    document.getElementById('editarPerfilForm').classList.add('hidden');
    document.querySelector('.usuario-dados').classList.remove('hidden');
    document.querySelector('.usuario-rotas').classList.remove('hidden'); // Mostrar inputs de endereço
    document.querySelector('button[onclick="calcularRota()"]').style.display = ''; // Mostrar botão OK (ou 'block' se estava com 'display: none;')
    document.getElementById('mensagemErro').classList.add('hidden'); // Ocultar mensagem de erro ao cancelar
    document.getElementById('mensagemErro').textContent = ''; // Limpar texto da mensagem de erro
}

function salvarPerfil() {
    const cpf = window.cpfLogado;
    const nome = document.getElementById('editarNome').value.trim();
    const telefone = document.getElementById('editarTelefone').value.trim();
    const bairro = document.getElementById('editarBairro').value.trim();

    if (!nome || !telefone || !bairro) {
        mostrarMensagemErro('Preencha todos os campos.');
        return;
    }

    const url = `${firebaseURL}/${cpf}.json`; // Construa a URL corretamente!

    fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, telefone, bairro })
    })
    .then(res => {
        if (!res.ok) {
            throw new Error(`HTTP error! Status: ${res.status}`);
        }
        return res.json();
    })
    .then(data => {
        // Atualizar localStorage
        let usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));
        if (usuarioLogado) {
            usuarioLogado.nome = nome;
            usuarioLogado.telefone = telefone;
            usuarioLogado.bairro = bairro;
            localStorage.setItem('usuarioLogado', JSON.stringify(usuarioLogado));
        }

        // Atualizar a interface
        document.getElementById('nomeUsuario').textContent = nome;
        document.getElementById('telefoneUsuario').textContent = telefone;
        document.getElementById('bairroUsuarioTexto').textContent = bairro;

        cancelarEdicao();

        mostrarPopup('Perfil atualizado com sucesso!', 3000)
    })
    .catch(err => {
        console.error(err);
        mostrarMensagemErro('Erro ao atualizar perfil.');
    });
}

function mostrarMensagemErro(mensagem) {
    const popupErro = document.getElementById('popupErro');
    const popupErroTexto = document.getElementById('popupErroTexto');

    popupErroTexto.textContent = mensagem;
    popupErro.classList.remove('hidden');

    setTimeout(() => {
        popupErro.classList.add('hidden');
        popupErroTexto.textContent = '';
    }, 3000);
}

function mostrarPopup(mensagem, tempoEsconder = null) {
    const popup = document.getElementById('popupMensagem');
    const texto = document.getElementById('popupTexto');
    
    texto.textContent = mensagem;
    popup.classList.remove('hidden');

    // Se tempoEsconder for passado, fecha automaticamente
    if (tempoEsconder) {
        setTimeout(() => {
            fecharPopup();
        }, tempoEsconder);
    }
}

function fecharPopup() {
    const popup = document.getElementById('popupMensagem');
    popup.classList.add('hidden');
}

function fecharCardResumoCorrida() {
  document.getElementById('cardResumoCorrida').classList.add('hidden');
  window.location.reload();
}

function mostrarHistoricoCorridas() {
  const cpf = window.cpfLogado;
  const urlHistorico = `https://cardosoborracharia-a8854-default-rtdb.firebaseio.com/historico/${cpf}.json`;

  fetch(urlHistorico)
    .then(res => res.json())
    .then(data => {
      const lista = document.getElementById('listaHistorico');
      lista.innerHTML = ''; // Limpa antes de exibir

      if (!data) {
        lista.innerHTML = '<p>Nenhuma corrida encontrada.</p>';
      } else {
        // Ordenar por chave (data)
        const corridas = Object.entries(data)
          .sort((a, b) => b[0].localeCompare(a[0])) // Mais recentes primeiro
          .slice(0, 5); // Máximo 5

        for (const [_, corrida] of corridas) {
          const item = document.createElement('div');
          item.classList.add('corrida-item');

          const dataObj = new Date(corrida.data || corrida.dataFinalizacao || '');
          const dataFormatada = dataObj.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

          item.innerHTML = `
            <p><strong>Data:</strong> ${dataFormatada}</p>
            <p><strong>De:</strong> ${corrida.partida}</p>
            <p><strong>Para:</strong> ${corrida.destino}</p>
            <p><strong>Valor:</strong> R$ ${corrida.preco?.toFixed(2) ?? '0.00'}</p>
          `;
          lista.appendChild(item);
        }
      }

      document.getElementById('cardHistorico').classList.remove('hidden');
    })
    .catch(err => {
      console.error('Erro ao buscar histórico:', err);
      alert('Erro ao carregar histórico.');
    });
}

function fecharCardHistorico() {
  document.getElementById('cardHistorico').classList.add('hidden');
}

