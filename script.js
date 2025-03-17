document.addEventListener("DOMContentLoaded", () => {
  const formTrabajador = document.getElementById("formTrabajador");
  const formHorario = document.getElementById("formHorario");
  const selectTrabajador = document.getElementById("trabajador");
  const informeDiv = document.getElementById("informe");
  const generarInformeBtn = document.getElementById("generarInforme");
  const exportarPDFBtn = document.getElementById("exportarPDF");
  const exportarExcelBtn = document.getElementById("exportarExcel");
  const listaTrabajadores = document.getElementById("listaTrabajadores");

  let trabajadores = JSON.parse(localStorage.getItem("trabajadores")) || [];
  let horarios = JSON.parse(localStorage.getItem("horarios")) || [];

  // Función para formatear la fecha y hora a dd/mm/yyyy HH:MM
  function formatearFecha(fecha) {
    const date = new Date(fecha);
    const dia = String(date.getDate()).padStart(2, "0");
    const mes = String(date.getMonth() + 1).padStart(2, "0"); // Los meses comienzan en 0
    const anio = date.getFullYear();
    const horas = String(date.getHours()).padStart(2, "0");
    const minutos = String(date.getMinutes()).padStart(2, "0");
    return `${dia}/${mes}/${anio} ${horas}:${minutos}`;
  }

  // Cargar trabajadores en el select y en la lista
  function cargarTrabajadores() {
    // Limpiar select y lista
    selectTrabajador.innerHTML = '<option value="">Selecciona un trabajador</option>';
    listaTrabajadores.innerHTML = "";

    // Cargar en el select
    trabajadores.forEach((trabajador, index) => {
      const option = document.createElement("option");
      option.value = index;
      option.textContent = `${trabajador.nombre} ${trabajador.apellido}`;
      selectTrabajador.appendChild(option);
    });

    // Cargar en la lista
    trabajadores.forEach((trabajador, index) => {
      const li = document.createElement("li");
      li.textContent = `${trabajador.nombre} ${trabajador.apellido}`;

      // Botón de eliminar
      const botonEliminar = document.createElement("button");
      botonEliminar.textContent = "Eliminar";
      botonEliminar.addEventListener("click", () => eliminarTrabajador(index));

      li.appendChild(botonEliminar);
      listaTrabajadores.appendChild(li);
    });
  }

  // Eliminar trabajador
  function eliminarTrabajador(index) {
    trabajadores.splice(index, 1); // Eliminar el trabajador del array
    localStorage.setItem("trabajadores", JSON.stringify(trabajadores)); // Actualizar localStorage
    cargarTrabajadores(); // Recargar la lista
  }

  // Registrar Trabajador
  formTrabajador.addEventListener("submit", (e) => {
    e.preventDefault();
    const nombre = document.getElementById("nombre").value;
    const apellido = document.getElementById("apellido").value;
    trabajadores.push({ nombre, apellido });
    localStorage.setItem("trabajadores", JSON.stringify(trabajadores));
    cargarTrabajadores();
    formTrabajador.reset();
  });

  // Registrar Horario
  formHorario.addEventListener("submit", (e) => {
    e.preventDefault();
    const trabajadorIndex = document.getElementById("trabajador").value;
    const entrada = document.getElementById("entrada").value;
    const salida = document.getElementById("salida").value;
    if (trabajadorIndex === "") return alert("Selecciona un trabajador");

    // Convertir el formato de fecha y hora a dd/mm/yyyy HH:MM
    const entradaFormateada = formatearFecha(entrada);
    const salidaFormateada = formatearFecha(salida);

    // Verificar si ya existe un registro para esa fecha y trabajador
    const existeRegistro = horarios.some(
      (horario) =>
        horario.trabajadorIndex === trabajadorIndex &&
        horario.entrada === entradaFormateada
    );

    if (existeRegistro) {
      return alert("Ya existe un registro para este trabajador en la fecha seleccionada.");
    }

    horarios.push({ trabajadorIndex, entrada: entradaFormateada, salida: salidaFormateada });
    localStorage.setItem("horarios", JSON.stringify(horarios));
    formHorario.reset();
  });

  // Generar Informe Semanal
  generarInformeBtn.addEventListener("click", () => {
    informeDiv.innerHTML = "";
    const informe = {};

    // Agrupar horarios por trabajador y evitar duplicados
    horarios.forEach((horario) => {
      const trabajador = trabajadores[horario.trabajadorIndex];
      const nombreCompleto = `${trabajador.nombre} ${trabajador.apellido}`;

      if (!informe[nombreCompleto]) {
        informe[nombreCompleto] = [];
      }

      // Evitar duplicados en el informe
      const existeFecha = informe[nombreCompleto].some(
        (registro) => registro.entrada === horario.entrada
      );

      if (!existeFecha) {
        informe[nombreCompleto].push({ entrada: horario.entrada, salida: horario.salida });
      }
    });

    // Mostrar el informe en la interfaz
    for (const [nombre, registros] of Object.entries(informe)) {
      const trabajadorDiv = document.createElement("div");
      trabajadorDiv.innerHTML = `<h3>${nombre}</h3>`;
      registros.forEach((registro) => {
        trabajadorDiv.innerHTML += `<p>Entrada: ${registro.entrada} - Salida: ${registro.salida}</p>`;
      });
      informeDiv.appendChild(trabajadorDiv);
    }
  });

  // Exportar a PDF
  exportarPDFBtn.addEventListener("click", () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    let y = 10;
    doc.setFontSize(18);
    doc.text("Informe Semanal de Horarios", 10, y);
    y += 10;

    const informe = {};
    horarios.forEach((horario) => {
      const trabajador = trabajadores[horario.trabajadorIndex];
      const nombreCompleto = `${trabajador.nombre} ${trabajador.apellido}`;
      if (!informe[nombreCompleto]) informe[nombreCompleto] = [];
      informe[nombreCompleto].push({ entrada: horario.entrada, salida: horario.salida });
    });

    for (const [nombre, registros] of Object.entries(informe)) {
      doc.setFontSize(14);
      doc.text(`Trabajador: ${nombre}`, 10, y);
      y += 10;

      registros.forEach((registro) => {
        doc.setFontSize(12);
        doc.text(`Entrada: ${registro.entrada} - Salida: ${registro.salida}`, 15, y);
        y += 10;
      });
    }

    doc.save("informe_horarios.pdf");
  });

  // Exportar a Excel
  exportarExcelBtn.addEventListener("click", () => {
    const informe = [];
    horarios.forEach((horario) => {
      const trabajador = trabajadores[horario.trabajadorIndex];
      informe.push({
        Trabajador: `${trabajador.nombre} ${trabajador.apellido}`,
        Entrada: horario.entrada,
        Salida: horario.salida,
      });
    });

    const worksheet = XLSX.utils.json_to_sheet(informe);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Informe");
    XLSX.writeFile(workbook, "informe_horarios.xlsx");
  });

  // Inicializar
  cargarTrabajadores();
});