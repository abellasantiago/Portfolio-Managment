# Santiago Abella — Portfolio empresarial

Portfolio profesional enfocado en administración, control financiero y gestión de proyectos. Proyecto independiente del antiguo portfolio de desarrollo de software.

## Vista local

Con Node.js instalado, ejecutar `npm run dev` y abrir http://localhost:4321. No requiere instalar dependencias. También se puede servir la carpeta con cualquier servidor de archivos estáticos.

## Contenido

Inicio, sobre mí, experiencia profesional, formación, enfoque profesional, competencias y herramientas, contacto. Los datos laborales y educativos provienen del CV aportado. El cursado de Desarrollo de Software se presenta como parcial (2025–2026); no como estudio en curso ni título obtenido. “Mi enfoque” conserva el lugar de la antigua sección de proyectos y presenta áreas de aporte basadas en la experiencia, sin inventar proyectos ni métricas.

## Diseño y movimiento

Paleta marfil, verde bosque y salvia. Tipografías Manrope y DM Sans (Google Fonts, con alternativas locales del sistema). Portada con una superficie curva continua dibujada en Canvas 2D, con profundidad, movimiento y respuesta al puntero. Entradas de secciones, franja de texto en movimiento, ilustraciones animadas y enlaces con respuesta sutil al cursor. Sin hexaedro ni bibliotecas de animación.

El botón inferior permite pausar las animaciones y recuerda la preferencia en este navegador. Se respeta `prefers-reduced-motion`. El lienzo deja de animarse al salir de pantalla o al ocultar la pestaña. El contenido sigue disponible sin JavaScript.

## Archivos

- `index.html`: contenido, navegación y metadatos.
- `style.css`: diseño, responsive y movimiento.
- `script.js`: animación de portada, navegación y preferencias.
- `assets/CV_Santiago_Abella.pdf`: CV original aportado y descargable.
- `assets/img/santiago-abella.jpg`: retrato conservado del portfolio anterior.
- `server.mjs`: servidor local, sin dependencias.

## Publicación

Sitio estático listo para GitHub Pages, Netlify o cualquier hosting estático. Para GitHub Pages, subir **el contenido de esta carpeta** a un nuevo repositorio, y en Settings → Pages seleccionar la rama y la carpeta raíz. Las rutas relativas permiten publicarlo bajo un subdirectorio. No hay URL canónica ni enlaces al despliegue antiguo: se pueden configurar cuando exista el nuevo dominio.

Este repositorio es local e independiente; no tiene un remoto de GitHub creado o configurado. La carpeta puede moverse fuera del portfolio anterior conservando su `.git`.

## Verificación

`npm run check` comprueba la sintaxis de los scripts. Revisar en navegador escritorio/móvil, navegación por teclado, menú, descarga del CV y pausa de animaciones al modificar efectos.

Referencias técnicas: [movimiento reducido, MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/%40media/prefers-reduced-motion), [IntersectionObserver, MDN](https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserver).
