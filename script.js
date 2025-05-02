const firebaseURL = 'https://cardosoborracharia-a8854-default-rtdb.firebaseio.com/passageiros';
const geoapifyKey = '6d5858a5a2b143618a05523338f5a0aa';
let mapa, marcadorA, marcadorB;
let mapaCorrida;
let wakeLock = null;
window.onload = verificarSessao;


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

    if (!nome || !cpf || !senha) {
        return alert('Preencha os campos obrigatórios (Nome, CPF e Senha).');
    }

    if (!validarCPF(cpf)) {
        return alert('CPF inválido. Verifique e tente novamente.');
    }

    if (senha.length < 4) {
        return alert('Senha deve ter pelo menos 4 caracteres.');
    }

    fetch(`${firebaseURL}/${cpf}.json`)
        .then(res => res.json())
        .then(data => {
            if (data) {
                return alert('Este CPF já está cadastrado.');
            }

            fetch(`${firebaseURL}/${cpf}.json`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome, senha, telefone, bairro })
            })
            .then(() => {
                alert('Cadastro realizado com sucesso!');
                mostrarLogin();
            })
            .catch(err => {
                console.error(err);
                alert('Erro ao cadastrar.');
            });
        })
        .catch(err => {
            console.error(err);
            alert('Erro ao verificar CPF.');
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
            if (!data) return alert("CPF não cadastrado.");
            if (data.senha !== senha) return alert("Senha incorreta.");

            // Salvar dados no LocalStorage
            localStorage.setItem('usuarioLogado', JSON.stringify({
                cpf: cpf,
                nome: data.nome,
                telefone: data.telefone
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

    document.getElementById('infoMotorista').style.display = 'none';
    document.querySelector('button[onclick="finalizarCorrida()"]').style.display = 'none';

    document.getElementById('infoMotorista').style.display = 'none';
    const botaoSolicitar = document.querySelector('button[onclick="solicitarCorrida()"]');
    if (botaoSolicitar) botaoSolicitar.style.display = 'none';

    document.getElementById("loginSection").classList.add("hidden");
    document.getElementById("infoUsuario").classList.remove("hidden");
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
const valor = input.value;
const sugestoes = document.getElementById(sugestaoId);
if (valor.length < 3) return sugestoes.innerHTML = '', sugestoes.classList.add('hidden');

fetch(`https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(valor)}&limit=5&lang=pt&filter=countrycode:br&apiKey=${geoapifyKey}`)
.then(res => res.json())
.then(data => {
  sugestoes.innerHTML = '';
  data.features.forEach(feature => {
    const div = document.createElement('div');
    div.textContent = feature.properties.formatted;
    div.onclick = () => {
      input.value = feature.properties.formatted;
      sugestoes.innerHTML = '';
      sugestoes.classList.add('hidden');
    };
    sugestoes.appendChild(div);
  });
  sugestoes.classList.remove('hidden');
});
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
return alert("Não foi possível obter as coordenadas. Verifique os endereços.");
}

// Exibir o mapa utilizando a função de mostrarMapa
mostrarMapa(partida, destino);

// Chamada à API do Geoapify para calcular a rota
fetch(`https://api.geoapify.com/v1/routing?waypoints=${coordPartida.join(',')}|${coordDestino.join(',')}&mode=drive&apiKey=${geoapifyKey}`)
.then(res => res.json())
.then(data => {
  // Verificar se a API retornou um resultado válido
  if (!data.features || data.features.length === 0) {
  console.error('Não foi possível calcular a rota.'); // apenas registra no console
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
  alert("Ocorreu um erro ao calcular a rota.");
});
}

async function mostrarMapa(partida, destino) {
const coords = await Promise.all([getCoords(partida), getCoords(destino)]);

// Verificar se as coordenadas foram obtidas corretamente
if (!coords[0] || !coords[1]) {
return alert("Não foi possível obter as coordenadas de partida ou destino.");
}

// Inicializar o mapa
const mapa = L.map('mapaResumo').setView(coords[0], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapa);

// Adicionar marcadores de partida e destino
L.marker(coords[0]).addTo(mapa).bindPopup("Partida").openPopup();
L.marker(coords[1]).addTo(mapa).bindPopup("Destino");

// Chamada à API do Geoapify para calcular a rota
fetch(`https://api.geoapify.com/v1/routing?waypoints=${coords[0][1]},${coords[0][0]}|${coords[1][1]},${coords[1][0]}&mode=drive&apiKey=${geoapifyKey}`)
.then(res => res.json())
.then(data => {
  // Verificar se a API retornou a rota corretamente
  if (!data.features || data.features.length === 0) {
    return alert('Não foi possível calcular a rota.');
  }

  const rota = data.features[0];
  const rotaCoords = rota.geometry.coordinates.map(c => [c[1], c[0]]);
  
  // Adicionar a linha azul da rota no mapa
  L.polyline(rotaCoords, { color: 'blue' }).addTo(mapa);
  mapa.fitBounds(rotaCoords);

  // Exibir distância e duração no UI
  document.getElementById('distanciaAceita').textContent = (rota.properties.distance / 1000).toFixed(2);
  document.getElementById('duracaoAceita').textContent = (rota.properties.time / 60).toFixed(1);

  // Animação do marcador percorrendo a rota
  let latlngs = rotaCoords;
  let i = 0;
  const marcadorAnimado = L.marker(latlngs[i]).addTo(mapa);
  
  // Função de animação
  const intervalo = setInterval(() => {
    if (i < latlngs.length - 1) {
      i++;
      marcadorAnimado.setLatLng(latlngs[i]);
    } else {
      clearInterval(intervalo);  // Para a animação quando chegar ao destino
    }
  }, 100);  // Intervalo de animação, você pode ajustar a velocidade aqui
})
.catch(err => {
  console.error(err);
  alert("Ocorreu um erro ao carregar a rota no mapa.");
});
}

async function getCoords(endereco) {
const res = await fetch(`https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(endereco)}&apiKey=${geoapifyKey}`);
const data = await res.json();
if (data.features.length === 0) {
alert('Endereço não encontrado: ' + endereco);
return null;
}
return [data.features[0].geometry.coordinates[1], data.features[0].geometry.coordinates[0]];
}

function solicitarCorrida() {
const cpfPassageiro = window.cpfLogado;
if (!cpfPassageiro) {
alert('Usuário não identificado.');
return;
}

const partida = document.getElementById('partida').value;
const destino = document.getElementById('destino').value;
const distanciaKm = parseFloat(document.getElementById('distanciaTotal').textContent);
const preco = parseFloat(document.getElementById('precoEstimado').textContent);
requestWakeLock()

if (!partida || !destino || isNaN(distanciaKm) || isNaN(preco)) {
alert('Informe todos os dados necessários para solicitar a corrida.');
return;
}

const novaCorrida = {
data: new Date().toISOString(),
partida,
destino,
distancia_km: distanciaKm,
preco,
status: "pendente",
motorista: ""
};

const firebaseURLCorrida = `https://cardosoborracharia-a8854-default-rtdb.firebaseio.com/corridas/${cpfPassageiro}.json`;

fetch(firebaseURLCorrida, {
method: 'PUT',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify(novaCorrida)
})
.then(() => {
alert('Corrida solicitada com sucesso!');

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
alert('Erro ao solicitar a corrida. Tente novamente.');
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

  // Preenche o card com as informações
  document.getElementById('nomeMotorista').textContent = motorista.nome || 'Desconhecido';
  document.getElementById('carroMotorista').textContent = motorista.modelo || '-';
  document.getElementById('placaMotorista').textContent = motorista.placa || '-';
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
        alert('Sua corrida foi aceita pelo motorista!');
        document.getElementById('loadingMotorista').classList.add('hidden');
        exibirMotorista(data.motorista);
        window.motoristaExibido = true;
        window.motoristaAtual = data.motorista;
        document.querySelector('button[onclick="finalizarCorrida()"]').style.display = 'block';
        document.getElementById('infoMotorista').style.display = 'block';

      }
    } else if (data.status === 'pendente') {
      if (window.motoristaExibido) {
        limparMotorista();
        window.motoristaExibido = false;
        window.motoristaAtual = null;
        document.getElementById('loadingMotorista').classList.remove('hidden');
        document.getElementById('infoMotorista').style.display = 'none';
        document.querySelector('button[onclick="finalizarCorrida()"]').style.display = 'none';
        alert('Corrida voltou para pendente. Buscando novo motorista...');
      }
    } else if (data.status === 'cancelada') {
      limparMotorista();
      window.motoristaExibido = false;
      window.motoristaAtual = null;
      clearInterval(window.temporizadorInterval);
      document.getElementById('infoMotorista').style.display = 'none';
      document.querySelector('button[onclick="finalizarCorrida()"]').style.display = 'none';
      alert('Motorista cancelou a corrida.');
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
alert('Usuário não identificado.');
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

alert('Corrida cancelada com sucesso!');
})
.catch(error => {
console.error("Erro ao cancelar corrida:", error);
alert('Erro ao cancelar a corrida. Tente novamente.');
});
}

function limparMotorista() {
document.getElementById('nomeMotorista').textContent = '---';
document.getElementById('carroMotorista').textContent = '---';
document.getElementById('placaMotorista').textContent = '---';

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
const firebaseURLCorrida = `https://cardosoborracharia-a8854-default-rtdb.firebaseio.com/corridas/${cpfPassageiro}.json`;
releaseWakeLock()

fetch(firebaseURLCorrida, { method: 'DELETE' })
.then(() => {
  alert('Corrida finalizada!');
  window.location.reload(); // Atualiza a tela limpando tudo
})
.catch(err => console.error('Erro ao finalizar corrida:', err));
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
