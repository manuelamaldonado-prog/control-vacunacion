PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS proveedores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  telefono TEXT,
  email TEXT,
  direccion TEXT,
  cuit TEXT,
  tipo_inscripcion TEXT
);

CREATE TABLE IF NOT EXISTS vacunas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  proveedor_id INTEGER,
  dosis_por_animal REAL,
  FOREIGN KEY (proveedor_id) REFERENCES proveedores (id)
);

CREATE TABLE IF NOT EXISTS vacunadores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  matricula TEXT,
  telefono TEXT
);

CREATE TABLE IF NOT EXISTS clientes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  documento TEXT,
  telefono TEXT,
  direccion TEXT
);

CREATE TABLE IF NOT EXISTS inventario (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vacuna_id INTEGER NOT NULL,
  lote TEXT,
  fecha_ingreso TEXT,
  fecha_vencimiento TEXT,
  cantidad_total REAL NOT NULL,
  cantidad_disponible REAL NOT NULL,
  proveedor_id INTEGER,
  FOREIGN KEY (vacuna_id) REFERENCES vacunas (id),
  FOREIGN KEY (proveedor_id) REFERENCES proveedores (id)
);

CREATE TABLE IF NOT EXISTS vacunaciones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_id INTEGER NOT NULL,
  vacunador_id INTEGER NOT NULL,
  vacuna_id INTEGER NOT NULL,
  inventario_id INTEGER,
  fecha TEXT NOT NULL,
  cantidad_animales INTEGER NOT NULL,
  dosis_por_animal REAL NOT NULL,
  total_dosis REAL NOT NULL,
  observaciones TEXT,
  FOREIGN KEY (cliente_id) REFERENCES clientes (id),
  FOREIGN KEY (vacunador_id) REFERENCES vacunadores (id),
  FOREIGN KEY (vacuna_id) REFERENCES vacunas (id),
  FOREIGN KEY (inventario_id) REFERENCES inventario (id)
);

CREATE TABLE IF NOT EXISTS pagos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_id INTEGER NOT NULL,
  fecha TEXT NOT NULL,
  concepto TEXT,
  monto REAL NOT NULL,
  metodo TEXT,
  referencia TEXT,
  FOREIGN KEY (cliente_id) REFERENCES clientes (id)
);

CREATE VIEW IF NOT EXISTS vw_saldo_clientes AS
SELECT
  c.id AS cliente_id,
  c.nombre AS cliente_nombre,
  IFNULL(
    (SELECT SUM(v.total_dosis)
     FROM vacunaciones v
     WHERE v.cliente_id = c.id),
    0
  ) AS total_dosis_aplicadas,
  IFNULL(
    (SELECT SUM(p.monto)
     FROM pagos p
     WHERE p.cliente_id = c.id),
    0
  ) AS total_pagado;
