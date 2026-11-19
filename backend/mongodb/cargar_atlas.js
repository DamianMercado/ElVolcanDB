// Script para verificar conexión y cargar datos iniciales en MongoDB Atlas
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const uri = process.env.MONGO_URI;
const dbName = process.env.MONGO_DB || 'el_volcan_db';

if (!uri) {
  console.error('ERROR: No se encontró la variable MONGO_URI en el archivo .env');
  process.exit(1);
}

const coleccionesArchivos = [
  { nombre: 'zonas_despacho', archivo: '1_zonas_despacho.json' },
  { nombre: 'productos', archivo: '2_productos.json' },
  { nombre: 'clientes', archivo: '3_clientes.json' },
  { nombre: 'repartidores', archivo: '4_repartidores.json' },
  { nombre: 'pedidos', archivo: '5_pedidos.json' },
  { nombre: 'movimientos_stock', archivo: '6_movimientos_stock.json' },
];

async function ejecutar() {
  console.log('Conectando a MongoDB Atlas...');
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log(' Conexión exitosa a MongoDB Atlas!');

    const db = client.db(dbName);
    const pingRes = await db.command({ ping: 1 });
    console.log('Ping respuesta:', pingRes);

    const coleccionesExistentes = await db.listCollections().toArray();
    const nombresExistentes = coleccionesExistentes.map((c) => c.name);
    console.log('Colecciones actuales en', dbName, ':', nombresExistentes);

    for (const item of coleccionesArchivos) {
      const col = db.collection(item.nombre);
      const conteo = await col.countDocuments();
      console.log(`Colección "${item.nombre}": ${conteo} documentos actuales`);

      if (conteo === 0) {
        const rutaJson = path.join(__dirname, item.archivo);
        if (fs.existsSync(rutaJson)) {
          const raw = fs.readFileSync(rutaJson, 'utf-8');
          const datos = JSON.parse(raw);
          if (Array.isArray(datos) && datos.length > 0) {
            const res = await col.insertMany(datos);
            console.log(`   Insertados ${res.insertedCount} documentos en "${item.nombre}" desde ${item.archivo}`);
          }
        }
      }
    }

    console.log('\n Resumen final de la base de datos', dbName, 'en Atlas:');
    for (const item of coleccionesArchivos) {
      const total = await db.collection(item.nombre).countDocuments();
      console.log(` - ${item.nombre}: ${total} registros`);
    }

  } catch (error) {
    console.error('❌ Error al interactuar con MongoDB Atlas:', error);
  } finally {
    await client.close();
    console.log('Conexión cerrada.');
  }
}

ejecutar();
