import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import type { DatosRegistro, RegistroTemperaturas, Temperaturas } from "../../src/types/registro";
import type { Usuario } from "../../src/types/usuario";
import { obtenerPool } from "./db";

/**
 * Capa de acceso a datos: ÚNICO lugar del proyecto con SQL.
 * Todas las consultas usan parámetros (?) para evitar inyección SQL.
 */

interface FilaUsuario extends RowDataPacket, Usuario {}

/** §7 — Encargado y empresa por teléfono. Si hay varios, el de menor IdPersonal. */
export async function buscarEncargadoPorTelefono(telefono: string): Promise<Usuario | null> {
  const [filas] = await obtenerPool().execute<FilaUsuario[]>(
    `SELECT
        Emp_Personal.IdPersonal,
        Emp_Personal.PerNombre,
        Empresas.EmpId,
        Empresas.EmpNombre
     FROM Emp_Personal
     INNER JOIN Empresas
        ON Emp_Personal.PerEmpresa = Empresas.EmpId
     WHERE Emp_Personal.PerTelf = ?
     ORDER BY Emp_Personal.IdPersonal ASC
     LIMIT 1`,
    [telefono],
  );
  const f = filas[0];
  if (!f) return null;
  return {
    IdPersonal: Number(f.IdPersonal),
    PerNombre: String(f.PerNombre ?? ""),
    EmpId: Number(f.EmpId),
    EmpNombre: String(f.EmpNombre ?? ""),
  };
}

export interface CriaActiva {
  IdCria: number;
  GlpNombre: string;
  IdGranja: number;
  GrjNombre: string;
}

interface FilaCriaActiva extends RowDataPacket, CriaActiva {}

const SQL_CRIAS_ACTIVAS = `
  SELECT
      AVEnG_Cria.IdCria,
      AVEn_Galpones.GlpNombre,
      AVEn_Granjas.IdGranja,
      AVEn_Granjas.GrjNombre
  FROM
      (AVEn_Granjas
      INNER JOIN AVEn_Galpones
          ON AVEn_Granjas.IdGranja = AVEn_Galpones.GlpIdGranja)
      INNER JOIN AVEnG_Cria
          ON AVEn_Galpones.IdGalpon = AVEnG_Cria.CrIdGalpon
  WHERE
      AVEnG_Cria.CrIdEncargado = ?
      AND AVEnG_Cria.CrEstado = 0
      AND AVEnG_Cria.CrFecCierre IS NULL
      AND AVEn_Granjas.IdEmpresa = ?`;

function aCriaActiva(f: FilaCriaActiva): CriaActiva {
  return {
    IdCria: Number(f.IdCria),
    GlpNombre: String(f.GlpNombre ?? ""),
    IdGranja: Number(f.IdGranja),
    GrjNombre: String(f.GrjNombre ?? ""),
  };
}

/** §9 — Granjas, galpones y crías activas del encargado. */
export async function listarCriasActivas(idEncargado: number, idEmpresa: number): Promise<CriaActiva[]> {
  const [filas] = await obtenerPool().execute<FilaCriaActiva[]>(
    `${SQL_CRIAS_ACTIVAS}
     ORDER BY AVEn_Granjas.GrjNombre, AVEn_Galpones.GlpNombre, AVEnG_Cria.IdCria`,
    [idEncargado, idEmpresa],
  );
  return filas.map(aCriaActiva);
}

/** §9 filtrada por una cría: confirma que está activa y asignada al encargado. */
export async function buscarCriaAsignada(
  idCria: number,
  idEncargado: number,
  idEmpresa: number,
): Promise<CriaActiva | null> {
  const [filas] = await obtenerPool().execute<FilaCriaActiva[]>(
    `${SQL_CRIAS_ACTIVAS}
     AND AVEnG_Cria.IdCria = ?`,
    [idEncargado, idEmpresa, idCria],
  );
  return filas[0] ? aCriaActiva(filas[0]) : null;
}

export interface FechasCria {
  UltFecha: string | null;
  CrFecInicio: string;
}

interface FilaFechas extends RowDataPacket {
  UltFecha: string | null;
  CrFecInicio: string;
}

/** §11 — Última fecha registrada y fecha de inicio de la cría. */
export async function obtenerFechasCria(idCria: number): Promise<FechasCria | null> {
  const [filas] = await obtenerPool().execute<FilaFechas[]>(
    `SELECT
        MAX(AVEnG_Cria_Dto.DtoFecha) AS UltFecha,
        AVEnG_Cria.CrFecInicio
     FROM AVEnG_Cria
     LEFT JOIN AVEnG_Cria_Dto
        ON AVEnG_Cria.IdCria = AVEnG_Cria_Dto.DtoIdCria
     WHERE AVEnG_Cria.IdCria = ?
     GROUP BY AVEnG_Cria.CrFecInicio`,
    [idCria],
  );
  const f = filas[0];
  if (!f) return null;
  return {
    UltFecha: f.UltFecha ? String(f.UltFecha).slice(0, 10) : null,
    CrFecInicio: String(f.CrFecInicio).slice(0, 10),
  };
}

/** §13 — Inserta el registro diario. IdDto lo genera MySQL (AUTO_INCREMENT). */
export async function insertarRegistroCria(idCria: number, d: DatosRegistro): Promise<number> {
  const [resultado] = await obtenerPool().execute<ResultSetHeader>(
    `INSERT INTO AVEnG_Cria_Dto
        (DtoIdCria, DtoFecha, DtoMortalidad, DtoDescarte, DtoPesoProm, DtoConsumo,
         DtoTempMna, DtoTempTarde, DtoTempNoche)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      idCria,
      d.DtoFecha,
      d.DtoMortalidad,
      d.DtoDescarte,
      d.DtoPesoProm,
      d.DtoConsumo,
      d.DtoTempMna,
      d.DtoTempTarde,
      d.DtoTempNoche,
    ],
  );
  return resultado.insertId;
}

interface FilaTemperaturas extends RowDataPacket {
  DtoFecha: string;
  DtoTempMna: number | null;
  DtoTempTarde: number | null;
  DtoTempNoche: number | null;
}

/** FLOAT → número con 2 decimales como máximo (evita mostrar 23.299999237). */
function aTemperatura(valor: number | null): number | null {
  return valor === null ? null : Math.round(Number(valor) * 100) / 100;
}

/** Temperaturas del registro de una cría en una fecha, o null si no existe el registro. */
export async function obtenerTemperaturasRegistro(idCria: number, fecha: string): Promise<RegistroTemperaturas | null> {
  const [filas] = await obtenerPool().execute<FilaTemperaturas[]>(
    `SELECT DtoFecha, DtoTempMna, DtoTempTarde, DtoTempNoche
     FROM AVEnG_Cria_Dto
     WHERE DtoIdCria = ? AND DtoFecha = ?`,
    [idCria, fecha],
  );
  const f = filas[0];
  if (!f) return null;
  return {
    DtoFecha: String(f.DtoFecha).slice(0, 10),
    DtoTempMna: aTemperatura(f.DtoTempMna),
    DtoTempTarde: aTemperatura(f.DtoTempTarde),
    DtoTempNoche: aTemperatura(f.DtoTempNoche),
  };
}

/** Actualiza SOLO las 3 temperaturas del registro existente de esa cría y fecha. */
export async function actualizarTemperaturas(idCria: number, fecha: string, t: Temperaturas): Promise<void> {
  await obtenerPool().execute<ResultSetHeader>(
    `UPDATE AVEnG_Cria_Dto
     SET DtoTempMna = ?, DtoTempTarde = ?, DtoTempNoche = ?
     WHERE DtoIdCria = ? AND DtoFecha = ?`,
    [t.DtoTempMna, t.DtoTempTarde, t.DtoTempNoche, idCria, fecha],
  );
}
