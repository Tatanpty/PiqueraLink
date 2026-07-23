# Requirements Document

## Introduction

PiqueraLink es una aplicación web que moderniza la gestión de colas de taxis (piqueras) mediante un sistema digital de turnos FIFO. El sistema ofrece tres flujos principales: gestión de turnos para conductores, solicitud de taxis para pasajeros con vista móvil en tiempo real, y panel de administración para el chequeador/administrador de la piquera. La aplicación prioriza la experiencia mobile-first para pasajeros y utiliza actualizaciones en tiempo real para sincronización de estado.

## Glossary

- **Sistema**: La aplicación web PiqueraLink en su totalidad
- **Cola_FIFO**: Estructura de datos de tipo First-In-First-Out que gestiona el orden de turnos de los conductores en una piquera
- **Piquera**: Punto físico designado donde los taxis esperan en cola por pasajeros
- **Pasajero**: Usuario que solicita un servicio de taxi desde la aplicación móvil web
- **Conductor**: Usuario registrado que opera un vehículo y se enlista en la cola de turnos de una piquera
- **Administrador**: Usuario con rol de chequeador que supervisa la cola virtual, el estado de vehículos y gestiona incidencias
- **Turno**: Posición asignada a un conductor dentro de la Cola_FIFO de una piquera específica
- **Solicitud_de_Viaje**: Petición creada por un Pasajero para obtener un servicio de taxi
- **API_de_Geolocalización**: API del navegador (Geolocation API) utilizada para obtener la ubicación del Pasajero
- **WebSocket**: Protocolo de comunicación bidireccional para actualizaciones en tiempo real
- **Smart_Polling**: Técnica de polling con intervalos adaptativos como alternativa a WebSocket
- **Variable_de_Entorno**: Mecanismo para almacenar credenciales y configuración sensible fuera del código fuente

## Requirements

### Requisito 1: Registro y Autenticación de Usuarios

**Historia de Usuario:** Como usuario del sistema, quiero registrarme e iniciar sesión con mi rol correspondiente, para acceder a las funcionalidades de PiqueraLink según mis permisos.

#### Criterios de Aceptación

1. WHEN un usuario completa el formulario de registro con nombre, correo electrónico, contraseña y rol seleccionado, THE Sistema SHALL crear la cuenta y almacenar las credenciales de forma segura con hash.
2. WHEN un usuario ingresa credenciales válidas en el formulario de inicio de sesión, THE Sistema SHALL autenticar al usuario y emitir un token de sesión.
3. IF un usuario ingresa credenciales inválidas, THEN THE Sistema SHALL retornar un mensaje de error genérico sin revelar qué campo es incorrecto.
4. THE Sistema SHALL almacenar todas las credenciales, claves API y cadenas de conexión exclusivamente en Variables_de_Entorno.
5. WHEN un usuario se registra como Conductor, THE Sistema SHALL requerir datos adicionales del vehículo: placa, modelo, color y fotografía del Conductor.
6. THE Sistema SHALL asignar exactamente uno de los tres roles a cada usuario: Pasajero, Conductor o Administrador.

---

### Requisito 2: Gestión de la Cola FIFO de Turnos

**Historia de Usuario:** Como Conductor, quiero enlistarme en la cola de turnos de mi piquera, para recibir pasajeros en orden justo de llegada.

#### Criterios de Aceptación

1. WHEN un Conductor se enlista en una Piquera, THE Cola_FIFO SHALL asignar un Turno al final de la cola con marca de tiempo de ingreso.
2. THE Cola_FIFO SHALL mantener el orden estricto de llegada: el primer Conductor en enlistarse es el primero en ser asignado a una Solicitud_de_Viaje.
3. WHEN el Conductor en primera posición acepta una Solicitud_de_Viaje, THE Cola_FIFO SHALL remover a dicho Conductor de la cola.
4. IF un Conductor abandona la cola voluntariamente, THEN THE Cola_FIFO SHALL remover al Conductor y reordenar las posiciones restantes sin alterar el orden relativo.
5. WHILE un Conductor está enlistado en la Cola_FIFO, THE Sistema SHALL mostrar al Conductor su posición actual en la cola en tiempo real.
6. THE Cola_FIFO SHALL impedir que un Conductor se enliste en más de una Piquera simultáneamente.

---

### Requisito 3: Solicitud de Taxi por el Pasajero

**Historia de Usuario:** Como Pasajero, quiero solicitar un taxi desde mi ubicación actual, para ser recogido por el siguiente conductor disponible en la piquera más cercana.

#### Criterios de Aceptación

1. WHEN el Pasajero inicia una solicitud de viaje, THE Sistema SHALL solicitar acceso a la API_de_Geolocalización del navegador para obtener la ubicación actual.
2. WHEN la ubicación del Pasajero es obtenida, THE Sistema SHALL mostrar las piqueras disponibles ordenadas por distancia al Pasajero.
3. WHEN el Pasajero selecciona una Piquera y confirma la solicitud, THE Sistema SHALL crear una Solicitud_de_Viaje y asignarla al Conductor en primera posición de la Cola_FIFO de esa Piquera.
4. IF la API_de_Geolocalización no está disponible o el Pasajero deniega el permiso, THEN THE Sistema SHALL permitir al Pasajero seleccionar una Piquera manualmente de una lista.
5. WHEN una Solicitud_de_Viaje es creada, THE Sistema SHALL requerir que el Pasajero ingrese un destino o descripción del punto de recogida.
6. IF la Cola_FIFO de la Piquera seleccionada está vacía, THEN THE Sistema SHALL informar al Pasajero que no hay conductores disponibles y ofrecer notificación cuando uno se enliste.

---

### Requisito 4: Asignación y Visualización de Datos del Conductor

**Historia de Usuario:** Como Pasajero, quiero ver los datos del conductor y vehículo asignados a mi solicitud, para identificar fácilmente el taxi que me recogerá.

#### Criterios de Aceptación

1. WHEN un Conductor es asignado a una Solicitud_de_Viaje, THE Sistema SHALL mostrar al Pasajero: placa del vehículo, modelo del vehículo, color del vehículo y fotografía del Conductor.
2. WHEN un Conductor acepta la Solicitud_de_Viaje, THE Sistema SHALL mostrar al Pasajero un tiempo estimado de llegada basado en la distancia entre la Piquera y la ubicación del Pasajero.
3. WHILE el Conductor está en camino, THE Sistema SHALL actualizar el estado del viaje en tiempo real mediante WebSocket o Smart_Polling.
4. THE Sistema SHALL presentar la vista de datos del Conductor en un diseño mobile-first optimizado para pantallas de 320px a 480px de ancho.

---

### Requisito 5: Gestión de Viajes por el Conductor

**Historia de Usuario:** Como Conductor, quiero aceptar solicitudes de viaje y marcar su completitud, para gestionar mis servicios de manera eficiente.

#### Criterios de Aceptación

1. WHEN una Solicitud_de_Viaje es asignada al Conductor, THE Sistema SHALL notificar al Conductor con los datos del Pasajero y destino.
2. WHEN el Conductor acepta la Solicitud_de_Viaje, THE Sistema SHALL cambiar el estado del viaje a "en camino" y notificar al Pasajero.
3. WHEN el Conductor marca el viaje como completado, THE Sistema SHALL registrar la hora de finalización y cambiar el estado a "completado".
4. IF el Conductor rechaza la Solicitud_de_Viaje, THEN THE Sistema SHALL reasignar la solicitud al siguiente Conductor en la Cola_FIFO y mover al Conductor que rechazó al final de la cola.
5. WHEN un viaje es completado, THE Sistema SHALL permitir al Conductor reincorporarse a la Cola_FIFO de su Piquera.

---

### Requisito 6: Panel de Administración del Chequeador

**Historia de Usuario:** Como Administrador, quiero supervisar la cola virtual y el estado de los vehículos, para garantizar el orden y gestionar incidencias en la piquera.

#### Criterios de Aceptación

1. THE Sistema SHALL mostrar al Administrador un panel con la lista completa de conductores en la Cola_FIFO, su posición y tiempo de espera.
2. THE Sistema SHALL mostrar al Administrador el estado actual de cada vehículo registrado: en cola, en servicio, o fuera de servicio.
3. WHEN el Administrador selecciona un Conductor, THE Sistema SHALL mostrar el historial de servicios del día actual.
4. WHEN el Administrador remueve manualmente un Conductor de la cola, THE Sistema SHALL registrar el motivo de la remoción y notificar al Conductor afectado.
5. THE Sistema SHALL permitir al Administrador registrar incidencias asociadas a un Conductor o vehículo con descripción y marca de tiempo.
6. WHILE el Administrador está en el panel, THE Sistema SHALL actualizar la información de la cola en tiempo real mediante WebSocket o Smart_Polling.

---

### Requisito 7: Actualizaciones en Tiempo Real

**Historia de Usuario:** Como usuario del sistema, quiero recibir actualizaciones en tiempo real sobre el estado de la cola y los viajes, para tener información precisa sin necesidad de recargar la página.

#### Criterios de Aceptación

1. THE Sistema SHALL implementar un mecanismo de sincronización en tiempo real utilizando WebSocket como canal primario.
2. IF la conexión WebSocket falla o no es soportada por el navegador, THEN THE Sistema SHALL recurrir a Smart_Polling con intervalo adaptativo como mecanismo de respaldo.
3. WHEN el estado de la Cola_FIFO cambia (ingreso, salida o reordenamiento), THE Sistema SHALL propagar el cambio a todos los clientes suscritos en un lapso inferior a 2 segundos.
4. WHEN el estado de una Solicitud_de_Viaje cambia, THE Sistema SHALL notificar al Pasajero y al Conductor involucrados en un lapso inferior a 2 segundos.
5. IF la conexión del cliente se interrumpe, THEN THE Sistema SHALL reestablecer la conexión automáticamente y sincronizar el estado actual al reconectarse.

---

### Requisito 8: Gestión de Piqueras

**Historia de Usuario:** Como Administrador, quiero crear y configurar piqueras, para definir los puntos de operación del servicio de taxi.

#### Criterios de Aceptación

1. WHEN el Administrador crea una nueva Piquera, THE Sistema SHALL registrar: nombre, dirección, coordenadas geográficas y capacidad máxima de conductores.
2. THE Sistema SHALL validar que las coordenadas geográficas de la Piquera estén en formato de latitud (-90 a 90) y longitud (-180 a 180).
3. WHILE una Piquera alcanza su capacidad máxima de conductores, THE Sistema SHALL rechazar nuevos enlistamientos e informar al Conductor que la piquera está llena.
4. WHEN el Administrador desactiva una Piquera, THE Sistema SHALL notificar a todos los conductores enlistados y removerlos de la Cola_FIFO.

---

### Requisito 9: Seguridad y Configuración

**Historia de Usuario:** Como equipo de desarrollo, quiero que todas las credenciales y configuraciones sensibles estén protegidas, para cumplir con las mejores prácticas de seguridad.

#### Criterios de Aceptación

1. THE Sistema SHALL cargar todas las credenciales de base de datos, claves API y secretos de sesión exclusivamente desde Variables_de_Entorno.
2. THE Sistema SHALL proveer un archivo .env.example con todas las variables requeridas documentadas sin valores reales.
3. THE Sistema SHALL incluir el archivo .env en el .gitignore para prevenir la exposición accidental de secretos en el repositorio.
4. THE Sistema SHALL validar al iniciar que todas las Variables_de_Entorno obligatorias estén definidas, y detener el arranque con mensaje descriptivo si alguna falta.
5. THE Sistema SHALL hashear todas las contraseñas de usuario antes de almacenarlas utilizando un algoritmo de hash con salt.
6. WHEN un token de sesión expira, THE Sistema SHALL requerir re-autenticación del usuario.

---

### Requisito 10: Arquitectura y Despliegue

**Historia de Usuario:** Como equipo de desarrollo, quiero una arquitectura modular y escalable, para facilitar el mantenimiento y el despliegue en contenedores.

#### Criterios de Aceptación

1. THE Sistema SHALL organizar el código en módulos separados por dominio: autenticación, cola de turnos, viajes, administración y tiempo real.
2. THE Sistema SHALL proveer un Dockerfile funcional para construir la imagen de la aplicación.
3. THE Sistema SHALL implementar un diseño responsive mobile-first donde la interfaz del Pasajero sea completamente usable en pantallas desde 320px de ancho.
4. THE Sistema SHALL exponer una API REST con separación clara entre rutas públicas (pasajero) y rutas protegidas (conductor, administrador).
5. THE Sistema SHALL implementar control de acceso basado en roles que restrinja endpoints según el rol del usuario autenticado.

---

### Requisito 11: Esquema de Base de Datos

**Historia de Usuario:** Como equipo de desarrollo, quiero un esquema de base de datos normalizado, para almacenar consistentemente la información de usuarios, vehículos, piqueras, turnos y solicitudes de viaje.

#### Criterios de Aceptación

1. THE Sistema SHALL mantener las siguientes entidades en la base de datos: Usuarios, Vehículos, Piqueras, Turnos y Solicitudes_de_Viaje.
2. THE Sistema SHALL establecer una relación uno-a-uno entre Conductor y Vehículo.
3. THE Sistema SHALL registrar en la entidad Turno: identificador del Conductor, identificador de la Piquera, posición en cola, marca de tiempo de ingreso y estado (activo, en servicio, removido).
4. THE Sistema SHALL registrar en la entidad Solicitud_de_Viaje: identificador del Pasajero, identificador del Conductor asignado, identificador de la Piquera, ubicación de origen, destino, estado del viaje y marcas de tiempo de creación, asignación y finalización.
5. FOR ALL operaciones de modificación de la Cola_FIFO, THE Sistema SHALL ejecutarlas dentro de una transacción de base de datos para garantizar consistencia (propiedad de round-trip: leer la cola antes y después de una operación atómica produce un estado válido según las reglas FIFO).
