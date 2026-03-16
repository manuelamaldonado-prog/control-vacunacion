import sqlite3
from pathlib import Path

from flask import Flask, jsonify, request, send_from_directory


BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "data.db"
SCHEMA_PATH = BASE_DIR / "schema.sql"


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    if not SCHEMA_PATH.exists():
        return
    conn = get_connection()
    try:
        with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
            conn.executescript(f.read())
        conn.commit()
    finally:
        conn.close()


app = Flask(__name__)


@app.route("/")
def index():
    return send_from_directory(BASE_DIR, "index.html")


@app.route("/<path:filename>")
def static_files(filename):
    if filename in ["styles.css", "app.js"]:
        return send_from_directory(BASE_DIR, filename)
    return "Not Found", 404


@app.before_first_request
def before_first_request():
    init_db()


def rows_to_dicts(rows):
    return [dict(row) for row in rows]


@app.get("/api/proveedores")
def list_proveedores():
    conn = get_connection()
    try:
        cur = conn.execute(
            "SELECT id, nombre, telefono, email, direccion, cuit, tipo_inscripcion FROM proveedores ORDER BY nombre"
        )
        return jsonify(rows_to_dicts(cur.fetchall()))
    finally:
        conn.close()


@app.post("/api/proveedores")
def create_proveedor():
    data = request.get_json(force=True)
    # Map frontend fields to backend
    nombre = data.get("razonSocial", "").strip() or data.get("nombre", "").strip()
    
    if not nombre:
        return jsonify({"error": "nombre requerido"}), 400
    conn = get_connection()
    try:
        cur = conn.execute(
            "INSERT INTO proveedores (nombre, telefono, email, direccion, cuit, tipo_inscripcion) VALUES (?, ?, ?, ?, ?, ?)",
            (
                nombre,
                data.get("telefono", "").strip() or None,
                data.get("email", "").strip() or None,
                data.get("direccion", "").strip() or None,
                data.get("cuit", "").strip() or None,
                data.get("tipoInscripcion", "").strip() or None,
            ),
        )
        conn.commit()
        proveedor_id = cur.lastrowid
        cur = conn.execute(
            "SELECT id, nombre, telefono, email, direccion, cuit, tipo_inscripcion FROM proveedores WHERE id = ?",
            (proveedor_id,),
        )
        row = cur.fetchone()
        return jsonify(dict(row)), 201
    finally:
        conn.close()


@app.get("/api/vacunas")
def list_vacunas():
    conn = get_connection()
    try:
        cur = conn.execute(
            """
            SELECT v.id,
                   v.nombre,
                   v.descripcion,
                   v.proveedor_id,
                   v.dosis_por_animal,
                   p.nombre AS proveedor_nombre
            FROM vacunas v
            LEFT JOIN proveedores p ON p.id = v.proveedor_id
            ORDER BY v.nombre
            """
        )
        return jsonify(rows_to_dicts(cur.fetchall()))
    finally:
        conn.close()


@app.post("/api/vacunas")
def create_vacuna():
    data = request.get_json(force=True)
    nombre = data.get("nombre", "").strip()
    if not nombre:
        return jsonify({"error": "nombre requerido"}), 400
    descripcion = data.get("descripcion", "").strip() or None
    proveedor_id = data.get("proveedor_id")
    dosis_por_animal = data.get("dosis_por_animal") or 0
    conn = get_connection()
    try:
        cur = conn.execute(
            "INSERT INTO vacunas (nombre, descripcion, proveedor_id, dosis_por_animal) VALUES (?, ?, ?, ?)",
            (nombre, descripcion, proveedor_id, dosis_por_animal),
        )
        conn.commit()
        vacuna_id = cur.lastrowid
        cur = conn.execute(
            "SELECT id, nombre, descripcion, proveedor_id, dosis_por_animal FROM vacunas WHERE id = ?",
            (vacuna_id,),
        )
        row = cur.fetchone()
        return jsonify(dict(row)), 201
    finally:
        conn.close()


@app.get("/api/vacunadores")
def list_vacunadores():
    conn = get_connection()
    try:
        cur = conn.execute(
            "SELECT id, nombre, matricula, telefono FROM vacunadores ORDER BY nombre"
        )
        return jsonify(rows_to_dicts(cur.fetchall()))
    finally:
        conn.close()


@app.post("/api/vacunadores")
def create_vacunador():
    data = request.get_json(force=True)
    nombre = data.get("nombre", "").strip()
    if not nombre:
        return jsonify({"error": "nombre requerido"}), 400
    conn = get_connection()
    try:
        cur = conn.execute(
            "INSERT INTO vacunadores (nombre, matricula, telefono) VALUES (?, ?, ?)",
            (
                nombre,
                data.get("matricula", "").strip() or None,
                data.get("telefono", "").strip() or None,
            ),
        )
        conn.commit()
        vacunador_id = cur.lastrowid
        cur = conn.execute(
            "SELECT id, nombre, matricula, telefono FROM vacunadores WHERE id = ?",
            (vacunador_id,),
        )
        row = cur.fetchone()
        return jsonify(dict(row)), 201
    finally:
        conn.close()


@app.get("/api/clientes")
def list_clientes():
    conn = get_connection()
    try:
        cur = conn.execute(
            "SELECT id, nombre, documento, telefono, direccion FROM clientes ORDER BY nombre"
        )
        return jsonify(rows_to_dicts(cur.fetchall()))
    finally:
        conn.close()


@app.post("/api/clientes")
def create_cliente():
    data = request.get_json(force=True)
    nombre = data.get("nombre", "").strip()
    if not nombre:
        return jsonify({"error": "nombre requerido"}), 400
    conn = get_connection()
    try:
        cur = conn.execute(
            "INSERT INTO clientes (nombre, documento, telefono, direccion) VALUES (?, ?, ?, ?)",
            (
                nombre,
                data.get("documento", "").strip() or None,
                data.get("telefono", "").strip() or None,
                data.get("direccion", "").strip() or None,
            ),
        )
        conn.commit()
        cliente_id = cur.lastrowid
        cur = conn.execute(
            "SELECT id, nombre, documento, telefono, direccion FROM clientes WHERE id = ?",
            (cliente_id,),
        )
        row = cur.fetchone()
        return jsonify(dict(row)), 201
    finally:
        conn.close()


@app.get("/api/inventario")
def list_inventario():
    conn = get_connection()
    try:
        cur = conn.execute(
            """
            SELECT i.id,
                   i.vacuna_id,
                   v.nombre AS vacuna_nombre,
                   i.lote,
                   i.fecha_ingreso,
                   i.fecha_vencimiento,
                   i.cantidad_total,
                   i.cantidad_disponible,
                   i.proveedor_id,
                   p.nombre AS proveedor_nombre
            FROM inventario i
            LEFT JOIN vacunas v ON v.id = i.vacuna_id
            LEFT JOIN proveedores p ON p.id = i.proveedor_id
            ORDER BY v.nombre, i.fecha_ingreso DESC
            """
        )
        return jsonify(rows_to_dicts(cur.fetchall()))
    finally:
        conn.close()


@app.post("/api/inventario")
def create_inventario():
    data = request.get_json(force=True)
    vacuna_id = data.get("vacuna_id")
    cantidad_total = float(data.get("cantidad_total") or 0)
    if not vacuna_id or cantidad_total <= 0:
        return jsonify({"error": "vacuna_id y cantidad_total requeridos"}), 400
    lote = data.get("lote", "").strip() or None
    fecha_ingreso = data.get("fecha_ingreso", "").strip() or None
    fecha_vencimiento = data.get("fecha_vencimiento", "").strip() or None
    proveedor_id = data.get("proveedor_id")
    conn = get_connection()
    try:
        cur = conn.execute(
            """
            INSERT INTO inventario
            (vacuna_id, lote, fecha_ingreso, fecha_vencimiento, cantidad_total, cantidad_disponible, proveedor_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                vacuna_id,
                lote,
                fecha_ingreso,
                fecha_vencimiento,
                cantidad_total,
                cantidad_total,
                proveedor_id,
            ),
        )
        conn.commit()
        inv_id = cur.lastrowid
        cur = conn.execute(
            """
            SELECT id, vacuna_id, lote, fecha_ingreso, fecha_vencimiento,
                   cantidad_total, cantidad_disponible, proveedor_id
            FROM inventario WHERE id = ?
            """,
            (inv_id,),
        )
        row = cur.fetchone()
        return jsonify(dict(row)), 201
    finally:
        conn.close()


@app.get("/api/vacunaciones")
def list_vacunaciones():
    conn = get_connection()
    try:
        cur = conn.execute(
            """
            SELECT v.id,
                   v.fecha,
                   v.cantidad_animales,
                   v.dosis_por_animal,
                   v.total_dosis,
                   v.observaciones,
                   c.nombre AS cliente_nombre,
                   cl.documento AS cliente_documento,
                   vac.nombre AS vacuna_nombre,
                   va.nombre AS vacunador_nombre
            FROM vacunaciones v
            JOIN clientes cl ON cl.id = v.cliente_id
            JOIN vacunas vac ON vac.id = v.vacuna_id
            JOIN vacunadores va ON va.id = v.vacunador_id
            JOIN clientes c ON c.id = v.cliente_id
            ORDER BY v.fecha DESC
            """
        )
        return jsonify(rows_to_dicts(cur.fetchall()))
    finally:
        conn.close()


@app.post("/api/vacunaciones")
def create_vacunacion():
    data = request.get_json(force=True)
    cliente_id = data.get("cliente_id")
    vacunador_id = data.get("vacunador_id")
    vacuna_id = data.get("vacuna_id")
    fecha = data.get("fecha", "").strip()
    cantidad_animales = int(data.get("cantidad_animales") or 0)
    dosis_por_animal = float(data.get("dosis_por_animal") or 0)
    inventario_id = data.get("inventario_id")
    if not (cliente_id and vacunador_id and vacuna_id and fecha and cantidad_animales > 0 and dosis_por_animal > 0):
        return jsonify({"error": "campos requeridos faltantes"}), 400
    total_dosis = cantidad_animales * dosis_por_animal
    conn = get_connection()
    try:
        if inventario_id:
            cur = conn.execute(
                "SELECT cantidad_disponible FROM inventario WHERE id = ?",
                (inventario_id,),
            )
            row = cur.fetchone()
            if not row or row["cantidad_disponible"] < total_dosis:
                return jsonify({"error": "inventario insuficiente"}), 400
            nueva_disponible = row["cantidad_disponible"] - total_dosis
            conn.execute(
                "UPDATE inventario SET cantidad_disponible = ? WHERE id = ?",
                (nueva_disponible, inventario_id),
            )
        cur = conn.execute(
            """
            INSERT INTO vacunaciones
            (cliente_id, vacunador_id, vacuna_id, inventario_id, fecha,
             cantidad_animales, dosis_por_animal, total_dosis, observaciones)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                cliente_id,
                vacunador_id,
                vacuna_id,
                inventario_id,
                fecha,
                cantidad_animales,
                dosis_por_animal,
                total_dosis,
                data.get("observaciones", "").strip() or None,
            ),
        )
        conn.commit()
        vac_id = cur.lastrowid
        cur = conn.execute(
            "SELECT * FROM vacunaciones WHERE id = ?",
            (vac_id,),
        )
        row = cur.fetchone()
        return jsonify(dict(row)), 201
    finally:
        conn.close()


@app.get("/api/pagos")
def list_pagos():
    conn = get_connection()
    try:
        cur = conn.execute(
            """
            SELECT p.id,
                   p.fecha,
                   p.concepto,
                   p.monto,
                   p.metodo,
                   p.referencia,
                   c.nombre AS cliente_nombre
            FROM pagos p
            JOIN clientes c ON c.id = p.cliente_id
            ORDER BY p.fecha DESC
            """
        )
        return jsonify(rows_to_dicts(cur.fetchall()))
    finally:
        conn.close()


@app.post("/api/pagos")
def create_pago():
    data = request.get_json(force=True)
    cliente_id = data.get("cliente_id")
    fecha = data.get("fecha", "").strip()
    monto = float(data.get("monto") or 0)
    if not (cliente_id and fecha and monto > 0):
        return jsonify({"error": "cliente_id, fecha y monto requeridos"}), 400
    concepto = data.get("concepto", "").strip() or None
    metodo = data.get("metodo", "").strip() or None
    referencia = data.get("referencia", "").strip() or None
    conn = get_connection()
    try:
        cur = conn.execute(
            """
            INSERT INTO pagos (cliente_id, fecha, concepto, monto, metodo, referencia)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (cliente_id, fecha, concepto, monto, metodo, referencia),
        )
        conn.commit()
        pago_id = cur.lastrowid
        cur = conn.execute(
            "SELECT * FROM pagos WHERE id = ?",
            (pago_id,),
        )
        row = cur.fetchone()
        return jsonify(dict(row)), 201
    finally:
        conn.close()


@app.get("/api/reportes/uso_vacunas")
def reporte_uso_vacunas():
    fecha_desde = request.args.get("desde")
    fecha_hasta = request.args.get("hasta")
    conn = get_connection()
    try:
        query = [
            """
            SELECT vac.nombre AS vacuna_nombre,
                   SUM(v.total_dosis) AS total_dosis
            FROM vacunaciones v
            JOIN vacunas vac ON vac.id = v.vacuna_id
            WHERE 1=1
            """
        ]
        params = []
        if fecha_desde:
            query.append("AND v.fecha >= ?")
            params.append(fecha_desde)
        if fecha_hasta:
            query.append("AND v.fecha <= ?")
            params.append(fecha_hasta)
        query.append("GROUP BY vac.nombre ORDER BY vac.nombre")
        cur = conn.execute(" ".join(query), params)
        return jsonify(rows_to_dicts(cur.fetchall()))
    finally:
        conn.close()


@app.get("/api/reportes/inventario_resumen")
def reporte_inventario_resumen():
    conn = get_connection()
    try:
        cur = conn.execute(
            """
            SELECT v.nombre AS vacuna_nombre,
                   SUM(i.cantidad_disponible) AS cantidad_disponible
            FROM inventario i
            JOIN vacunas v ON v.id = i.vacuna_id
            GROUP BY v.nombre
            ORDER BY v.nombre
            """
        )
        return jsonify(rows_to_dicts(cur.fetchall()))
    finally:
        conn.close()


@app.get("/api/reportes/saldos_clientes")
def reporte_saldos_clientes():
    conn = get_connection()
    try:
        cur = conn.execute(
            """
            SELECT cliente_id,
                   cliente_nombre,
                   total_dosis_aplicadas,
                   total_pagado
            FROM vw_saldo_clientes
            ORDER BY cliente_nombre
            """
        )
        return jsonify(rows_to_dicts(cur.fetchall()))
    finally:
        conn.close()


if __name__ == "__main__":
    init_db()
    app.run(debug=True)
