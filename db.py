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


WALLET_B64 = os.getenv("ORACLE_WALLET_BASE64")
if WALLET_B64 and not os.path.exists(WALLET_DIR):
    os.makedirs(WALLET_DIR, exist_ok=True)
    zip_bytes = base64.b64decode(WALLET_B64)
    with zipfile.ZipFile(io.BytesIO(zip_bytes)) as z:
        z.extractall(WALLET_DIR)
        
def usa_wallet():
    return os.path.isfile(os.path.join(WALLET_DIR, "tnsnames.ora"))

 # Conexion a base de datos
def conectar():

    if usa_wallet():
        return oracledb.connect(
            user=USUARIO,
            password=CLAVE,
            dsn=DSN,
            config_dir=WALLET_DIR,
            wallet_location=WALLET_DIR,
            wallet_password=WALLET_CLAVE,
        )
    return oracledb.connect(user=USUARIO, password=CLAVE, dsn=DSN)

# Limpieza de codigo de error
def limpiar_mensaje(mensaje):
    texto = mensaje.split("\n")[0]
    if ":" in texto:
        texto = texto.split(":", 1)[1].strip()
    return texto
