let idTarjetas = 0;
let ultimaTarjeta;
let tarjetasOcultas = [];

const CIUDADES = {
  Montevideo: { lat: -34.8941, long: -56.0675 },
  Buenos_Aires: { lat: -34.6118, long: -58.4173 },
  Paris: { lat: 48.8567, long: 2.3510 },
  Tokyo: { lat: 35.6785, long: 139.6823 }
};

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

async function agregarTarjetas() {
  const textoTarjeta = document.getElementById("textoAgregar");
  const titulo = document.getElementById("tituloTarjeta");
  const divTarjetas = document.getElementById("tarjetas");
  const inputFecha = document.getElementById('fechaTarjeta');
  const inputCiudad = document.getElementById('ubicacionTarjeta');
  const fecha = inputFecha.value ? new Date(inputFecha.value) : new Date(Date.now());
  const minutos = fecha.getMinutes() < 10 ? `0${fecha.getMinutes()}` : fecha.getMinutes();
  const tiempo = `${ fecha.getHours() }:${ minutos }`;
  const fechaFormateada = `${new Intl.DateTimeFormat('es-ES').format(fecha)} ${tiempo}`;
  const temperaturaFormateada = await getClima(fecha, CIUDADES[inputCiudad.value.replaceAll(' ', '_')]);
  const temperatura = temperaturaFormateada ? `${temperaturaFormateada} °C` : '';
  let clase;

  if (document.getElementById("inlineRadio1").checked) {
    clase = "text-bg-success";
  } else if (document.getElementById("inlineRadio2").checked) {
    clase = "text-bg-warning";
  } else {
    clase = "text-bg-info";
  }

  divTarjetas.innerHTML +=
    `<div class="col-sm-4 mb-3">
                            <div id="${idTarjetas}" class="card ${clase}" data-bs-toggle="modal" data-bs-target="#modalEditar" onclick="obtenerId(this.id)">
                              <div class="card-header">
                                <h5 id="${idTarjetas}TargetTitle"class="card-title w-100 text-center">${titulo.value}</h5>
                              </div>
                              <div class="card-body">
                                  <p id="${idTarjetas++}TargetText" class="card-text">${textoTarjeta.value}</p>
                                  <div class="d-flex justify-content-end">
                                      <button type="button" class="btn btn-danger btn-outline-dark" data-bs-toggle="modal" data-bs-target="#modalBorrar">
                                          <i class="text-light"><img src="basura.png" alt="borrar" width="20vw" height="20vh"></i>
                                      </button>
                                  </div>
                              </div>
                              <div class="card-footer container">
                                  <div class="row">
                                      <p class="col fw-light">${inputCiudad.value} - ${temperatura}</p>
                                      <p class="col-auto fw-light text-end">${fechaFormateada}</p>
                                  </div>
                              </div>
                            </div>
                          </div>`;

  textoTarjeta.value = "";
  titulo.value = "";
  inputFecha.value = "";
  inputCiudad.value = "";
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

function eliminarTarjeta() {
  document.getElementById(`${ultimaTarjeta}`).parentElement.remove();
}

function editarTarjeta() {
  const textoTarjeta = document.getElementById("textoEditar");
  const tituloTarjeta = document.getElementById("tituloTarjetaEditar");
  document.getElementById(`${ultimaTarjeta}TargetText`).textContent = `${textoTarjeta.value}`;
  document.getElementById(`${ultimaTarjeta}TargetTitle`).textContent = `${tituloTarjeta.value}`;
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