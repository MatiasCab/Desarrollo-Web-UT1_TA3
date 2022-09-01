const HOST = window.location.hostname;
let ultimaTarjeta;
let tarjetasOcultas = [];
const JSON_CIUDADES = `{
"Montevideo": { "lat": "-34.8941", "long": "-56.0675" },
"Buenos Aires": { "lat": "-34.6118", "long": "-58.4173" },
"Paris": { "lat": "48.8567", "long": "2.3510" },
"Tokyo": { "lat": "35.6785", "long": "139.6823" }}`;
const CIUDADES = JSON.parse(JSON_CIUDADES);
cargarCiudades();
const clases = ["text-bg-success","text-bg-warning", "text-bg-info"];

const botonAgregarModal = document.getElementById("botonAgregarModal");
const botonEliminarModal = document.getElementById("botonEliminarSi");
const botonEditarModal = document.getElementById("botonEditarModal");
const botonModoOscuro = document.getElementById("flexSwitchCheckChecked");

botonAgregarModal.addEventListener('click', agregarTarjetas);
botonEliminarModal.addEventListener('click', eliminarTarjeta);
botonEditarModal.addEventListener('click', editarTarjeta);
botonModoOscuro.addEventListener('click', agregarClaseOscura);

const botonCartasVerdes = document.getElementById("verdes");
const botonCartasAmarrillas = document.getElementById("amarillas");
const botonCartasCielo = document.getElementById("cielo");
const botonTodas = document.getElementById("todas");

botonCartasVerdes.addEventListener('click', function () { mostrarSoloTarjetasEliminando("verde") });
botonCartasAmarrillas.addEventListener('click', function () { mostrarSoloTarjetasEliminando("amarrillo") });
botonCartasCielo.addEventListener('click', function () { mostrarSoloTarjetasEliminando("cielo") });
botonTodas.addEventListener('click', function () { mostrarSoloTarjetasEliminando("todos") });

cargarNotas();

async function cargarNotas() {
  const ciudadesArr = [];
  for (const ciudad in CIUDADES){
    ciudadesArr.push(ciudad);
  }
  const respuesta = await fetch(`http://${HOST}/notas`);
  const notas = await respuesta.json();
  let indice = 0;
  for(const nota of notas) {
    console.log(nota)
    crearTarjeta({
      cuerpo: nota.cuerpo,
      titulo: nota.title,
      ciudad: ciudadesArr[indice % 4],
      clase: clases[indice++ % 3], 
      fecha: new Date(Date.now()),
      id: nota.id
    });
  }
}

function agregarTarjetas() {
  const textoTarjeta = document.getElementById("textoAgregar");
  const titulo = document.getElementById("tituloTarjeta");
  const inputFecha = document.getElementById('fechaTarjeta');
  const inputCiudad = document.getElementById('locality');
  let clase;

  if (document.getElementById("inlineRadio1").checked) {
    clase = clases[0];
  } else if (document.getElementById("inlineRadio2").checked) {
    clase = clases[1];
  } else {
    clase = clases[2];
  }

  crearTarjeta({
    id: Math.floor(Math.random() * 1000000),
    cuerpo: textoTarjeta.value,
    titulo: titulo.value,
    ciudad: inputCiudad.value,
    fecha: inputFecha.value,
    clase
  }, true);

  textoTarjeta.value = "";
  titulo.value = "";
  inputFecha.value = "";
  inputCiudad.value = "";
}

async function crearTarjeta(card, post) {
  const fecha = card.fecha ? new Date(card.fecha) : new Date(Date.now());
  const fechaFormateada = formatearFecha(fecha);
  const temperaturaFormateada = await getClima(fecha, CIUDADES[card.ciudad]);
  card.temperatura = temperaturaFormateada ? `${temperaturaFormateada} °C` : "";
  const divTarjetas = document.getElementById("tarjetas");
  divTarjetas.innerHTML +=
                          `<div class="col-sm-4 mb-3">
                            <div id="${card.id}" class="card ${card.clase}" data-bs-toggle="modal" data-bs-target="#modalEditar" onclick="obtenerId(this.id)">
                              <div class="card-header">
                                <h5 id="${card.id}TargetTitle"class="card-title w-100 text-center">${card.titulo}</h5>
                              </div>
                              <div class="card-body">
                                  <p id="${card.id}TargetText" class="card-text">${card.cuerpo}</p>
                                  <div class="d-flex justify-content-end">
                                      <button type="button" class="btn btn-danger btn-outline-dark" data-bs-toggle="modal" data-bs-target="#modalBorrar">
                                          <i class="text-light"><img src="basura.png" alt="borrar" width="20vw" height="20vh"></i>
                                      </button>
                                  </div>
                              </div>
                              <div class="card-footer container">
                                  <div class="row">
                                      <p class="col fw-light" id="${card.id}TargetCity">${card.ciudad} - ${card.temperatura}</p>
                                      <p class="col-auto fw-light text-end" id="${card.id}TargetDate">${fechaFormateada}</p>
                                  </div>
                              </div>
                            </div>
                          </div>`;
  
  if (post) {
    postTarjeta(card);
  }
}

function cargarCiudades(){
  let dropdown = document.getElementById('locality')
  let dropdownEditar = document.getElementById('localityEditar');
  for(const ciudad in CIUDADES){
    dropdown.innerHTML += `<option>${ciudad}</option>`;
    dropdownEditar.innerHTML += `<option>${ciudad}</option>`;
  }
}


async function getClima(date, ciudad){
  try {
    let fecha = date.toISOString().split('T')[0];
    let horaParseada = date.getHours();
    let data = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${ciudad.lat}&longitude=${ciudad.long}&hourly=temperature_2m&start_date=${fecha}&end_date=${fecha}`);
    let obj = await data.json();
    return obj.hourly.temperature_2m[horaParseada];  
  } catch (e) {
    return undefined;
  }
}

function formatearFecha(fecha){
  const minutos = fecha.getMinutes() < 10 ? `0${fecha.getMinutes()}` : fecha.getMinutes();
  const tiempo = `${ fecha.getHours() }:${ minutos }`;
  return`${new Intl.DateTimeFormat('es-ES').format(fecha)} ${tiempo}`;
}

function eliminarTarjeta() {
  document.getElementById(`${ultimaTarjeta}`).parentElement.remove();
  deleteFromServer(ultimaTarjeta);
}

async function editarTarjeta() {
  const textoTarjeta = document.getElementById("textoEditar");
  const tituloTarjeta = document.getElementById("tituloTarjetaEditar");
  const ciudadTarjeta = document.getElementById("localityEditar");
  const fechaTarjeta = document.getElementById("fechaTarjetaEditar");
  const fecha = fechaTarjeta.value ? new Date(fechaTarjeta.value) : new Date(Date.now());
  const temperaturaFormateada = await getClima(fecha, CIUDADES[ciudadTarjeta.value]);

  document.getElementById(`${ultimaTarjeta}TargetDate`).textContent = `${formatearFecha(fecha)}`;
  document.getElementById(`${ultimaTarjeta}TargetText`).textContent = `${textoTarjeta.value}`;
  document.getElementById(`${ultimaTarjeta}TargetTitle`).textContent = `${tituloTarjeta.value}`;

  const temperatura = `${temperaturaFormateada} °C`;

  putTarjeta({
    cuerpo: textoTarjeta.value,
    titulo: tituloTarjeta.value,
    ciudad: ciudadTarjeta.value,
    fecha: fecha,
    id: ultimaTarjeta
  });
  document.getElementById(`${ultimaTarjeta}TargetCity`).textContent = `${ciudadTarjeta.value} - ${temperatura}`;
  textoTarjeta.value = "";
  tituloTarjeta.value = "";
}

function agregarClaseOscura() {
  document.body.classList.toggle('dark');
}

function obtenerId(id) {
  ultimaTarjeta = id;
  document.getElementById("textoEditar").value = document.getElementById(`${id}TargetText`).textContent;
}

function mostrarSoloTarjetasEliminando(color) {
  let ocultar1;
  let ocultar2;

  switch (color) {
    case "verde":
      ocultar1 = "text-bg-warning";
      ocultar2 = "text-bg-info";
      break;
    case "amarrillo":
      ocultar1 = "text-bg-info";
      ocultar2 = "text-bg-success";
      break;
    case "cielo":
      ocultar1 = "text-bg-warning";
      ocultar2 = "text-bg-success";
      break;
  }

  let cartasDocumento = Array.prototype.slice.call(document.getElementById("tarjetas").getElementsByClassName("col-sm-4 mb-3"));
  let cartas = cartasDocumento.concat(tarjetasOcultas);
  const divTarjetas = document.getElementById("tarjetas");
  tarjetasOcultas = [];

  for (let index = 0; index < cartas.length; index++) {
    let carta = cartas[index].childNodes.item(1);
    if (carta.classList.contains(ocultar1)) {
      tarjetasOcultas.push(carta.parentNode);
      carta.parentNode.remove();
    } else if (carta.classList.contains(ocultar2)) {
      tarjetasOcultas.push(carta.parentNode);
      carta.parentNode.remove();
    } else {
      if (cartasDocumento.indexOf(carta.parentNode) == -1) {
        divTarjetas.appendChild(carta.parentNode);
      }
    }
  }
}

async function deleteFromServer(idTarjeta) {
  fetch(`http://${HOST}/notas/${idTarjeta}`, {
    method: 'DELETE',
  });
  
}


async function postTarjeta(card) {
    
  fetch(`http://${HOST}/notas`, {
  method: 'POST',
  body: JSON.stringify({
    title: card.titulo,
    cuerpo: card.cuerpo,
    ciudad: card.ciudad,
    clase: card.clase,
    temperatura: card.temperatura,
    fechaFormateada: card.fecha,
    id: card.id
  }),
  headers: {
    'Content-type': 'application/json; charset=UTF-8',
  },
  })
  .then((response) => response.json())
  .then((json) => console.log(json));
}

async function putTarjeta(card) {
    
  fetch(`http://${HOST}/notas/${card.id}`, {
  method: 'PUT',
  body: JSON.stringify({
    title: card.titulo,
    cuerpo: card.cuerpo,
    ciudad: card.ciudad,
    fecha: card.fecha,
  }),
  headers: {
    'Content-type': 'application/json; charset=UTF-8',
  },
  })
  .then((response) => response.json())
  .then((json) => console.log(json));
}