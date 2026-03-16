# Control de Vacunación

Sistema integral web para la gestión de vacunación bovina, stock de inventario, registro de proveedores, clientes, finanzas (cobros, pagos a vacunadores) e informes.

Este proyecto tiene una arquitectura simple basada en un Backend con _Python (Flask)_ y una base de datos local SQLite, que alimenta un Frontend _HTML, CSS y JavaScript Vanilla_.

## Características

- Frontend 100% responsivo y compatible con dispositivos móviles (gracias al viewport estándar).
- PWA-friendly y de carga rápida.
- Gestión persistente offline guardando datos de forma unificada si hace falta mediante uso de API estandarizada hacia el backend.

## Requisitos Previos

- Python 3.9 o superior.
- Git (para el control de versiones).

## Instalación y Ejecución Local (Windows)

1. Clonar el repositorio:
   ```bash
   git clone https://github.com/TU-USUARIO/control-vacunacion.git
   cd control-vacunacion
   ```
2. Instalar dependencias mediante `pip`:
   ```bash
   pip install -r requirements.txt
   ```
3. Iniciar el sistema localmente con su archivo script:
   ```bash
   INICIAR_SISTEMA.bat
   ```

Alternativamente (o para Mac/Linux), desde la terminal:
   ```bash
   python backend.py
   ```
   Luego ingresa a `http://127.0.0.1:5000` en tu navegador.

## Despliegue en Servidor o Nube

El proyecto se puede iniciar en cualquier proveedor que soporte WSGI mediante bibliotecas como Gunicorn. En el archivo `requirements.txt` ya se asegura la compatibilidad.
Recomendamos alojarlo en servidores (como _PythonAnywhere_) o VPS clásicos (vía SSH) de forma tal que siempre retengan el archivo de la base de datos `data.db` que se creará de forma inteligente de manera automática.
