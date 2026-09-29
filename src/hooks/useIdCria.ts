import { useParams } from "react-router-dom";

/** IdCria de la URL (/cria/:id…), o null si no es un número entero positivo. */
export function useIdCria(): number | null {
  const { id } = useParams();
  if (!id || !/^\d+$/.test(id)) return null;
  const n = Number(id);
  return Number.isSafeInteger(n) && n > 0 ? n : null;
}
