# 🎵 TokTik 1986 - Plataforma de Video, Comercio y Monetización

Una aplicación web progresiva y moderna inspirada en TikTok, construida con **React 19**, **Vite 8**, **Tailwind CSS v4**, **Framer Motion**, **Lucide Icons** y arquitectura de monetización completa (**TikTok Shop, Afiliados, Publicidad In-Feed y Regalos Virtuales**).

---

## 📱 Enlaces de Acceso en Vivo

- **Enlace Global de Alta Velocidad (Celular y PC)**:  
  👉 **[https://drama-microphone-geographic-cup.trycloudflare.com](https://drama-microphone-geographic-cup.trycloudflare.com)**
- **En tu Computadora (Local)**:  
  👉 **[http://localhost:5173/](http://localhost:5173/)**
- **En tu Red Local Wi-Fi**:  
  👉 **`http://192.168.1.104:5173`**

---

## 💰 Módulos de Monetización y Facturación Implementados

### 1. 🛍️ TikTok Shop & Sistema de Afiliados en Video (Forma 1)
- **Píldora Flotante Dorada**: Muestra el nombre del producto, precio en COP y animación de llamado a la acción directamente sobre el video.
- **Drawer de Producto Deslizable**:
  - Fotos del producto, porcentaje de descuento y stock disponible.
  - Insignia de tienda verificada y calificación con estrellas.
  - Selector interactivo de tallas, opciones y cantidad.
  - **Banner de Creador Afiliado**: Muestra a qué creador apoya la compra y la comisión que genera.
- **Checkout Seguro Multimétodo**:
  - Formulario con datos de entrega y selección de método de pago: **Nequi**, **Daviplata**, **Tarjeta Débito/Crédito** y **Pago Contra Entrega**.
  - Al completar la compra, la comisión se acredita automáticamente en la **Billetera del Creador**.

### 2. 📢 Videos Promocionados / In-Feed Ads (Forma 2)
- **Videos Publicitarios en el Feed**: Identificados con etiqueta de `Promocionado`.
- **Barra de Acción Llamativa**: Botón destacado (ej. *"Pedir por WhatsApp 🍔"*, *"Ver Oferta Especial"*).
- **Módulo de Autogestión Publicitaria (🔥)**: Cualquier creador o comerciante puede tocar el botón de llama y configurar una campaña publicitaria:
  - Objetivos: Más vistas de video, más clientes a WhatsApp o más seguidores.
  - Presupuestos en COP: \$20.000 (1.500 personas), \$50.000 (5.000 personas), \$100.000 (15.000 personas).

### 3. 🎁 Economía de Regalos Virtuales y Monedas (Forma 3)
- Botón de regalo 🎁 en la barra lateral de acciones de cada video.
- **Catálogo de Regalos**: Rosa Roja (1 moneda), Café (5 monedas), Fuego Viral (20 monedas), Corona Dorada (100 monedas), León de Oro (500 monedas).
- **Animación en Pantalla Completa**: Al enviar un regalo, aparece una animación flotante gigante sobre el video con el avatar del creador.
- **Tienda de Recarga de Monedas**: Paquetes de monedas en pesos colombianos (\$4.900, \$22.900, \$89.900 COP).
- **Reparto 50/50**: El creador recibe el 50% del valor en su saldo retirable y la plataforma retiene el 50%.

### 4. 💵 Billetera de Creador y Retiros a Cuentas Bancarias
- Sección visible en el **Perfil de Usuario**:
  - Saldo Disponible en COP y Monedas acumuladas.
  - Desglose de ingresos: Ventas por Afiliados (TikTok Shop) vs. Regalos en Vivos.
  - Historial de transacciones en tiempo real.
  - **Retiro Inmediato de Fondos**: Formulario para transferir saldo directamente a **Nequi**, **Daviplata** o **Bancolombia**.

---

## 🎥 Funcionalidades Principales de la Experiencia TikTok

- **Feed Vertical Snap con IntersectionObserver**: Solo reproduce el video visible en pantalla.
- **Gesto de Velocidad 2X**: Mantén presionado para acelerar a 2X con aviso visual.
- **Doble Toque (Like)**: Ráfaga de corazones flotantes animados en el punto exacto del toque.
- **Estudio de Grabación con Cámara en Vivo**: Filtros (Normal, Vintage, Cyberpunk, B&W, Cálido), temporizador de 15s/60s y selector de audios en tendencia.
- **Disco de Vinilo Giratorio**: Al tocarlo abre la pantalla de detalle del sonido con todos los videos relacionados.
- **Perfiles Públicos de Creadores & Mensajes Directos (DM)**: Chat interactivo en tiempo real con respuestas simuladas.
- **Buscador & Explorador**: Filtrado por hashtags, tiendas y creadores.
