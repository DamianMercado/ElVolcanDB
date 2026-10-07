import os
import oracledb
import base64
import zipfile
import io
from dotenv import load_dotenv

CARPETA = os.path.dirname(os.path.abspath(__file__))

load_dotenv(os.path.join(CARPETA, ".env"))

# ---------------------------------------------------------------
# Variables de entorno
# ---------------------------------------------------------------

# Usuario y clave con los que entras en SQL Developer
USUARIO = os.getenv("ORACLE_USER")
CLAVE = os.getenv("ORACLE_PASSWORD")

DSN = os.getenv("ORACLE_DSN")

WALLET_CLAVE = os.getenv("ORACLE_WALLET_PASSWORD")

# ---------------------------------------------------------------

# Carpeta wallet y busqueda de archivo
WALLET_DIR = os.getenv("ORACLE_WALLET_DIR", os.path.join(CARPETA, "wallet"))

# Variable ORACLE_WALLET_BASE64:
WALLET_B64 = os.getenv("ORACLE_WALLET_BASE64")
if WALLET_B64 and not os.path.isfile(os.path.join(WALLET_DIR, "tnsnames.ora")):
    os.makedirs(WALLET_DIR, exist_ok=True)
    zip_bytes = base64.b64decode(WALLET_B64)
    with zipfile.ZipFile(io.BytesIO(zip_bytes)) as z:
        for member in z.infolist():
            nombre_archivo = os.path.basename(member.filename)
            if nombre_archivo:  # Ignora nombres de carpetas vacías
                destino = os.path.join(WALLET_DIR, nombre_archivo)
                with z.open(member) as source, open(destino, "wb") as target:
                    target.write(source.read())
def usa_wallet():
    return os.path.isfile(os.path.join(WALLET_DIR, "tnsnames.ora"))

 # Conexion a base de datos
_pool = None
def conectar():
    """Abre o reutiliza una conexión del pool a la base de datos."""
    global _pool
    if _pool is None:
        params = {
            "user": USUARIO,
            "password": CLAVE,
            "dsn": DSN,
            "min": 1,
            "max": 4,
            "increment": 1,
        }
        if usa_wallet():
            params.update({
                "config_dir": WALLET_DIR,
                "wallet_location": WALLET_DIR,
                "wallet_password": WALLET_CLAVE,
            })
        _pool = oracledb.create_pool(**params)
    return _pool.acquire()

# Limpieza de codigo de error
def limpiar_mensaje(mensaje):
    texto = mensaje.split("\n")[0]
    if ":" in texto:
        texto = texto.split(":", 1)[1].strip()
    return texto
