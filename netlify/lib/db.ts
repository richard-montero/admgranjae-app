import mysql, { type Pool } from "mysql2/promise";

/**
 * Conexión a MySQL. Las credenciales vienen SOLO de variables de entorno
 * configuradas en Netlify; nunca llegan al navegador.
 */

export class ErrorConfiguracion extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = "ErrorConfiguracion";
  }
}

let pool: Pool | null = null;

export function obtenerPool(): Pool {
  if (pool) return pool;

  const { DB_NUBE, DB_PORT, DB_DATABASE, DB_USERNAME, DB_PASSWORD } = process.env;
  const faltantes = Object.entries({ DB_NUBE, DB_DATABASE, DB_USERNAME, DB_PASSWORD })
    .filter(([, valor]) => !valor)
    .map(([nombre]) => nombre);
  if (faltantes.length > 0) {
    throw new ErrorConfiguracion(`Faltan variables de entorno: ${faltantes.join(", ")}`);
  }

  pool = mysql.createPool({
    host: DB_NUBE,
    port: Number(DB_PORT || 3306),
    database: DB_DATABASE,
    user: DB_USERNAME,
    password: DB_PASSWORD,
    // Las columnas DATE se devuelven como "AAAA-MM-DD", sin conversión de zona horaria
    dateStrings: true,
    charset: "utf8mb4",
    connectionLimit: 3,
    waitForConnections: true,
    connectTimeout: 10000,
    enableKeepAlive: true,
  });
  return pool;
}
