let miGrafica = null;

// URL de tu servidor en la nube (Render)
const API_URL = 'https://ia-geopolitica.onrender.com/procesar';

async function enviarAlBackend(mensaje) {
    const divRespuesta = document.getElementById('respuesta-texto');
    divRespuesta.innerText = "Sincronizando con satélites...";

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mensaje: mensaje })
        });
        
        const data = await response.json();
        
        // Mostrar respuesta de la IA
        divRespuesta.innerText = data.respuesta;
        hablar(data.respuesta);

        // Si la respuesta incluye datos para gráfica
        if (data.tipo === "grafica") {
            dibujarGrafica(data.datos);
        }
    } catch (e) {
        console.error("Error de conexión:", e);
        divRespuesta.innerText = "SISTEMA OFFLINE: Verifica la conexión a Internet.";
    }
}

function enviarTexto() {
    const input = document.getElementById('usuario-input');
    if (input.value.trim() !== "") {
        enviarAlBackend(input.value);
        input.value = "";
    }
}

function handleKey(e) { 
    if (e.key === 'Enter') enviarTexto(); 
}

function hablar(texto) {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(texto);
    u.lang = 'es-ES';
    u.rate = 1.0; // Velocidad normal
    window.speechSynthesis.speak(u);
}

function activarVoz() {
    const Reco = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Reco) {
        alert("Tu navegador no soporta reconocimiento de voz. Usa Chrome.");
        return;
    }
    const recognition = new Reco();
    recognition.lang = 'es-ES';
    recognition.onstart = () => {
        document.getElementById('btn-voz').innerText = "🔴 ESCUCHANDO...";
        document.getElementById('btn-voz').style.backgroundColor = "#ff4d4d";
    };
    recognition.onresult = (e) => {
        const textoEscuchado = e.results[0][0].transcript;
        enviarAlBackend(textoEscuchado);
    };
    recognition.onend = () => {
        document.getElementById('btn-voz').innerText = "🎤 HABLAR CON LA IA";
        document.getElementById('btn-voz').style.backgroundColor = ""; // Vuelve al color original
    };
    recognition.start();
}

function dibujarGrafica(info) {
    const ctx = document.getElementById('canvasGeo').getContext('2d');
    
    // Destruir gráfica anterior si existe para evitar errores visuales
    if (miGrafica) {
        miGrafica.destroy();
    }
    
    miGrafica = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: info.labels,
            datasets: [{ 
                label: info.label, 
                data: info.valores, 
                backgroundColor: [
                    'rgba(233, 69, 96, 0.7)', 
                    'rgba(78, 204, 163, 0.7)', 
                    'rgba(52, 152, 219, 0.7)',
                    'rgba(155, 89, 182, 0.7)',
                    'rgba(241, 196, 15, 0.7)'
                ],
                borderColor: '#ffffff',
                borderWidth: 1
            }]
        },
        options: { 
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.1)' } },
                x: { grid: { display: false } }
            },
            plugins: {
                legend: { labels: { color: '#ffffff' } }
            }
        }
    });
}