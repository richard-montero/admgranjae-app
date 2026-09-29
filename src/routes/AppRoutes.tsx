import { Navigate, Route, Routes } from "react-router-dom";
import { GestionCria } from "../pages/GestionCria";
import { Inicio } from "../pages/Inicio";
import { Login } from "../pages/Login";
import { TemperaturaCria } from "../pages/TemperaturaCria";
import { RutaProtegida } from "./RutaProtegida";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<RutaProtegida />}>
        <Route path="/" element={<Inicio />} />
        <Route path="/cria/:id" element={<GestionCria />} />
        <Route path="/cria/:id/temperatura" element={<TemperaturaCria />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
