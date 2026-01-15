let miGrafica = null;

async function enviarAlBackend(mensaje) {
    const divRespuesta = document.getElementById('respuesta-texto');
    divRespuesta.innerText = "Sincronizando con satélites...";

    try {
        const response = await fetch('http://127.0.0.1:5000/procesar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mensaje: mensaje })
        });
        const data = await response.json();
        
        divRespuesta.innerText = data.respuesta;
        hablar(data.respuesta);

        if (data.tipo === "grafica") {
            dibujarGrafica(data.datos);
        }
    } catch (e) {
        divRespuesta.innerText = "ERROR: Servidor fuera de línea.";
    }
}

function enviarTexto() {
    const input = document.getElementById('usuario-input');
    if (input.value.trim() !== "") {
        enviarAlBackend(input.value);
        input.value = "";
    }
}

function handleKey(e) { if (e.key === 'Enter') enviarTexto(); }

function hablar(texto) {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(texto);
    u.lang = 'es-ES';
    window.speechSynthesis.speak(u);
}

function activarVoz() {
    const Reco = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new Reco();
    recognition.lang = 'es-ES';
    recognition.onstart = () => document.getElementById('btn-voz').innerText = "🔴 ESCUCHANDO...";
    recognition.onresult = (e) => enviarAlBackend(e.results[0][0].transcript);
    recognition.onend = () => document.getElementById('btn-voz').innerText = "🎤 HABLAR CON LA IA";
    recognition.start();
}

function dibujarGrafica(info) {
    const ctx = document.getElementById('canvasGeo').getContext('2d');
    if (miGrafica) miGrafica.destroy();
    miGrafica = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: info.labels,
            datasets: [{ 
                label: info.label, 
                data: info.valores, 
                backgroundColor: ['#e94560', '#4ecca3', '#3498db'] 
            }]
        },
        options: { responsive: true }
    });
}