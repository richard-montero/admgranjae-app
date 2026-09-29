# AdmGranja

Aplicación web para que los encargados de granjas de pollos de engorde registren, desde el celular, los datos diarios de sus crías.

**Stack:** React + TypeScript + Vite + React Router · Netlify Functions (Node) · MySQL existente.
Desarrollado por RAMN Software.

---

## Arquitectura

```
Celular (React)  →  /api/*  →  Netlify Functions  →  MySQL (ramnsoftware.com)
```

- El navegador **nunca** se conecta a MySQL ni ve credenciales.
- Todo el SQL está en `netlify/lib/consultas.ts`, siempre con parámetros.
- El servidor vuelve a validar todo: sesión, que la cría esté activa y asignada al encargado, el rango de fechas y los datos.
- El índice UNIQUE `CriaFecha (DtoIdCria, DtoFecha)` de la base de datos impide duplicados.

### Rutas

| Ruta | Pantalla |
|---|---|
| `/login` | Teléfono (precargado con el último usado) + **Ingresar** |
| `/` | Empresa, encargado y granjas con sus crías activas |
| `/cria/:id` | Datos de la cría, último registro y formulario diario |
| `/cria/:id/temperatura` | Modificar solo las temperaturas de una fecha ya registrada |

### API (Netlify Functions)

| Endpoint | Función |
|---|---|
| `POST /api/login` | Valida el teléfono (§7). Si hay varios registros, toma el de menor `IdPersonal`. |
| `GET /api/granjas` | Crías activas del encargado agrupadas por granja (§9). |
| `GET /api/cria?id=` | Última fecha, rango permitido (§11–12) y unidad de alimento del galpón (`Emp_UndRecAli`). |
| `POST /api/registro` | Inserta en `AVEnG_Cria_Dto` (§13–16). Convierte el consumo a kg con `UndAliEqKg`. |
| `GET /api/temperatura?id=&fecha=` | Temperaturas del registro de esa fecha (`null` si no existe). |
| `POST /api/temperatura` | Actualiza **solo** `DtoTempMna`, `DtoTempTarde` y `DtoTempNoche` de un registro existente. Sin registro → rechazado. |

### Estructura

```
netlify.toml · public/_redirects · .env.example
netlify/
  functions/   login.ts · granjas.ts · cria.ts · registro.ts · temperatura.ts
  lib/         db.ts · consultas.ts · sesion.ts · respuestas.ts
src/
  components/  Header · GranjaCard · CriaCard · RegistroCriaForm · TemperaturasForm · CamposTemperatura · FichaCria · VolverAMisCrias · CampoNumero · Cargando · MensajeError · MensajeExito · Desarrollador
  pages/       Login · Inicio · GestionCria · TemperaturaCria
  routes/      AppRoutes · RutaProtegida
  hooks/       useUsuario · useGranjas · useCria · useTemperaturasRegistro · useIdCria · useConsulta
  context/     UsuarioContext
  lib/         api · validacion · fechas · errores · alimento · almacenamiento
  types/       usuario · granja · cria · registro · api
```

`src/lib/validacion.ts`, `fechas.ts` y `errores.ts` los comparten el formulario y el servidor: las reglas están en un solo lugar.

---

## Reglas implementadas

- **Fecha:** mínima = último registro + 1 día (o inicio de la cría si no hay registros); máxima = hoy, **hora de Bolivia** (`America/La_Paz`), calculada en el servidor.
- **Mortalidad / Descarte:** enteros ≥ 0 (máx. 8.388.607, límite de MEDIUMINT). Vacío → 0.
- **Peso promedio (g):** ≥ 0, máximo 2 decimales, acepta coma o punto. Vacío → 0.
- **Consumo:** se escribe en la **unidad de alimento del galpón** (`Emp_UndRecAli.UndAliNom`, p. ej. sacos) y se guarda en `DtoConsumo` **convertido a kg**: valor × `UndAliEqKg`, redondeado a 2 decimales. La conversión la hace el servidor; el formulario muestra "Se guardará como X kg". ≥ 0, máximo 2 decimales. Vacío → 0.
- **Galpón sin unidad de alimento** (o con factor vacío/0): se puede guardar el día con consumo vacío (0); si se escribe un consumo, se bloquea con un mensaje para no guardar un valor sin convertir.
- **Temperaturas (°C):** enteros, pueden ser negativos (botón ±). Vacío → NULL.
- Después de guardar se vuelve a la lista de crías con el mensaje de confirmación.
- **Registrar temperatura:** se elige una fecha entre el inicio de la cría y el último registro; se cargan las temperaturas actuales y solo esas 3 columnas se actualizan. Si la cría no tiene registro en esa fecha, no se permite modificar (lo valida también el servidor).
- En el dispositivo solo se guarda el teléfono (`localStorage`). La sesión (`sessionStorage`) dura hasta cerrar la pestaña o 12 horas.

---

## Publicación: GitHub + Netlify

### 1. Antes de empezar (en el hosting de ramnsoftware.com)

1. **Habilitar MySQL remoto:** cPanel → *Remote MySQL* → agregar el host `%`. Las IP de Netlify cambian; sin esto, la app mostrará "No se pudo conectar con el servidor".
2. **Cambiar la contraseña** del usuario MySQL, porque fue compartida en texto durante el desarrollo.
3. Comprobar que ese usuario tiene permiso **SELECT** en las tablas consultadas e **INSERT** y **UPDATE** en `AVEnG_Cria_Dto` (UPDATE lo usa "Registrar temperatura").

### 2. GitHub

1. Crear un repositorio (recomendado: **privado**).
2. Subir el contenido de este zip (la carpeta completa, con `netlify.toml` en la raíz).
3. Verificar que **no** se subió ningún archivo `.env`.

### 3. Netlify

1. *Add new site → Import an existing project → GitHub* → elegir el repositorio.
2. La configuración de build se lee sola desde `netlify.toml` (`npm run build`, carpeta `dist`, funciones en `netlify/functions`).
3. *Site configuration → Environment variables* → cargar:

| Variable | Valor |
|---|---|
| `DB_NUBE` | `ramnsoftware.com` |
| `DB_PORT` | `3306` |
| `DB_DATABASE` | nombre de la base de datos |
| `DB_USERNAME` | usuario MySQL |
| `DB_PASSWORD` | contraseña MySQL (la nueva) |
| `SESSION_SECRET` | cadena aleatoria de **32 caracteres o más** |

4. *Deploys → Trigger deploy → Deploy site* (después de cargar las variables).
5. Si algo falla, los detalles técnicos están en *Logs → Functions*.

---

## Checklist de pruebas en Netlify

Marque cada punto en la URL pública, preferiblemente desde un celular.

**Acceso**
- [ ] Número válido → entra y muestra empresa y encargado correctos.
- [ ] Número inexistente → "Este número no está registrado…".
- [ ] Al volver a abrir, el último número aparece precargado.
- [ ] **Salir** → vuelve al acceso con el número precargado.

**Datos**
- [ ] Nombre de la empresa como título.
- [ ] Nombre del encargado visible.
- [ ] Granjas correctas (solo de su empresa).
- [ ] Crías correctas (activas, sin fecha de cierre, asignadas a él).

**Fechas**
- [ ] Cría sin registros → la fecha mínima es la de inicio.
- [ ] Cría con registros → la mínima es el día siguiente al último.
- [ ] Se puede registrar la fecha de hoy.
- [ ] Fecha anterior o igual al último registro → rechazada.
- [ ] Fecha futura → "No se pueden registrar fechas futuras."
- [ ] Cría registrada hasta hoy → aviso "Esta cría está al día".

**Formulario**
- [ ] Todo vacío → guarda 0 en mortalidad, descarte, peso y consumo; NULL en temperaturas.
- [ ] Decimales `1250,55` y `1250.55` → se guardan como 1250.55.
- [ ] Tres decimales → "Use como máximo 2 decimales."
- [ ] Mortalidad `2.5` o `-1` → rechazado.
- [ ] Temperatura con ± (ej. `-3`) → se guarda −3.
- [ ] Texto en campos numéricos → rechazado con mensaje claro.

**Guardado**
- [ ] Registro correcto → vuelve a la lista con "✔ Registro guardado".
- [ ] El registro aparece en `AVEnG_Cria_Dto` con el `DtoIdCria` correcto.
- [ ] Duplicado (dos celulares guardan la misma cría y fecha) → "Ya existe un registro para esa fecha…".
- [ ] Error de inserción (p. ej. variables mal configuradas) → mensaje comprensible, sin detalles técnicos.

**Consumo de alimento**
- [ ] La etiqueta muestra la unidad del galpón ("Consumo (Sacos…)") en vez de "g".
- [ ] Al escribir un consumo aparece "Se guardará como X kg" con valor × factor.
- [ ] En `AVEnG_Cria_Dto.DtoConsumo` queda el valor convertido (p. ej. 3,5 sacos × 46 = 161).
- [ ] Galpón sin unidad configurada → "Consumo (sin unidad)"; con consumo > 0 no deja guardar; vacío sí.

**Registrar temperatura**
- [ ] El botón aparece debajo de "Registrar datos" en cada cría.
- [ ] Al elegir una fecha registrada se muestran sus temperaturas actuales.
- [ ] Guardar cambia solo las temperaturas (mortalidad, descarte, peso y consumo quedan igual en la BD).
- [ ] Vaciar una temperatura → queda NULL.
- [ ] Fecha sin registro de esa cría → "No hay un registro de esta cría en esa fecha…" y no hay formulario.
- [ ] Cría sin ningún registro → aviso "Esta cría todavía no tiene registros".
- [ ] Si falla con error inesperado, revisar que el usuario MySQL tenga permiso UPDATE.

**Navegación**
- [ ] Abrir directamente `https://<su-sitio>/cria/<id>` y `/cria/<id>/temperatura` y refrescar → no aparece pantalla en blanco.
- [ ] Sin sesión, abrir `/cria/<id>` → pide teléfono y luego vuelve a esa cría.
- [ ] `/cria/<id>` de una cría ajena o cerrada → "Esta cría no está disponible…".
- [ ] Dirección inexistente → redirige a la lista.

---

## Consideraciones

- El acceso es solo por teléfono (decisión de negocio): quien conozca un número registrado puede ingresar.
- `DtoPesoProm` y `DtoConsumo` son FLOAT: los valores grandes con decimales pueden guardarse con una pequeña diferencia de redondeo. Si se requiere exactitud total, convendría `DECIMAL(10,2)` (cambio de base de datos que no se aplicó).
