import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS
import re
import os
import sys
import requests
from bs4 import BeautifulSoup

app = Flask(__name__)
CORS(app)

# --- CONFIGURACIÓN DE RUTAS PARA EJECUTABLES ---
if getattr(sys, 'frozen', False):
    # Si es un ejecutable (.exe o binario), usa la carpeta temporal
    BASE_DIR = sys._MEIPASS
else:
    # Si es código fuente normal, usa la carpeta actual
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))

PATH_CSV = os.path.join(BASE_DIR, 'datos.csv')

def buscar_en_web(consulta):
    try:
        # Búsqueda vía Google News RSS
        url = f"https://news.google.com/rss/search?q={consulta}&hl=es-419&gl=VE&ceid=VE:es-419"
        headers = {'User-Agent': 'Mozilla/5.0'}
        response = requests.get(url, headers=headers, timeout=5)
        soup = BeautifulSoup(response.content, 'xml')
        items = soup.find_all('item')
        if items:
            respuesta = "Últimos reportes estratégicos: "
            for i in range(min(2, len(items))):
                titulo = items[i].title.text
                respuesta += f" [{i+1}] {titulo}."
            return respuesta
        return f"No se localizaron noticias recientes para '{consulta}'."
    except:
        return "Conexión con el servidor de noticias interrumpida."

def limpiar_numero(texto):
    if pd.isna(texto) or str(texto).strip() == "": return 0
    texto_limpio = str(texto).replace('.', '').replace(',', '.')
    numeros = re.findall(r"[-+]?\d*\.\d+|\d+", texto_limpio)
    return float(numeros[0]) if numeros else 0

def obtener_datos():
    try:
        # Intentar leer el CSV (prioridad al archivo físico)
        # Si no existe, usará los datos de respaldo (backup)
        df = pd.read_csv(PATH_CSV, encoding='latin1', on_bad_lines='skip')
        df.columns = df.columns.str.strip()
        def b_s(p):
            f = df[df.iloc[:, 1].str.contains(p, case=False, na=False)]
            return f.iloc[0] if not f.empty else None
        
        c, r, e = b_s("China"), b_s("Rusia"), b_s("EE.UU")
        paises = ["China", "Rusia", "EEUU"]
        
        return {
            "labels": paises,
            "pib": [limpiar_numero(c['PIB']), limpiar_numero(r['PIB']), limpiar_numero(e['PIB'])],
            "nuc": [limpiar_numero(c['Poder Nuclear']), limpiar_numero(r['Poder Nuclear']), limpiar_numero(e['Poder Nuclear'])],
            "tan": [limpiar_numero(c['Tanques']), limpiar_numero(r['Tanques']), limpiar_numero(e['Tanques'])],
            "avi": [limpiar_numero(c['Aviones de Combate']), limpiar_numero(r['Aviones de Combate']), limpiar_numero(e['Aviones de Combate'])],
            "pob": [limpiar_numero(c['Población']), limpiar_numero(r['Población']), limpiar_numero(e['Población'])],
            "oro": [limpiar_numero(c['Reservas de Oro']), limpiar_numero(r['Reservas de Oro']), limpiar_numero(e['Reservas de Oro'])]
        }
    except Exception as e:
        print(f"Usando datos de respaldo: {e}")
        return {
            "labels":["China","Rusia","EEUU"], 
            "pib":[18,2,30], "nuc":[600,5500,5000], 
            "tan":[5000,12000,8000], "avi":[3000,4000,13000], 
            "pob":[1400,145,331], "oro":[2000,2300,8000]
        }

@app.route('/procesar', methods=['POST'])
def procesar():
    msg = request.json.get("mensaje", "").lower()
    data = obtener_datos()
    
    # Comandos de gráficas (1-6)
    if "1" in msg or "pib" in msg:
        return jsonify({"respuesta": "Mostrando PIB Global.", "tipo": "grafica", "datos": {"labels": data["labels"], "valores": data["pib"], "label": "PIB (Billones USD)"}})
    if "2" in msg or "nuclear" in msg:
        return jsonify({"respuesta": "Arsenal nuclear estratégico.", "tipo": "grafica", "datos": {"labels": data["labels"], "valores": data["nuc"], "label": "Ojivas"}})
    if "3" in msg or "tanque" in msg:
        return jsonify({"respuesta": "Fuerzas blindadas terrestres.", "tipo": "grafica", "datos": {"labels": data["labels"], "valores": data["tan"], "label": "Tanques"}})
    if "4" in msg or "aviones" in msg:
        return jsonify({"respuesta": "Poderío de combate aéreo.", "tipo": "grafica", "datos": {"labels": data["labels"], "valores": data["avi"], "label": "Aviones"}})
    if "5" in msg or "población" in msg or "poblacion" in msg:
        return jsonify({"respuesta": "Estadísticas demográficas.", "tipo": "grafica", "datos": {"labels": data["labels"], "valores": data["pob"], "label": "Población (Millones)"}})
    if "6" in msg or "oro" in msg:
        return jsonify({"respuesta": "Reservas de oro estatales.", "tipo": "grafica", "datos": {"labels": data["labels"], "valores": data["oro"], "label": "Oro (Toneladas)"}})

    return jsonify({"respuesta": buscar_en_web(msg), "tipo": "texto"})

if __name__ == '__main__':
    # Puerto dinámico para Render o local 5000
    port = int(os.environ.get("PORT", 5000))
    # Host 0.0.0.0 permite acceso desde celulares en la misma red
    app.run(host='0.0.0.0', port=port, debug=True)