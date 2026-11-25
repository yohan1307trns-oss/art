"""
Puente HTTP/JSON para integrar los módulos originales de Art&Value en Python:
- archivos.py
- catalogo.py
- materiales.py (reglas de selección y promedio de precio)
- operaciones.py
- menu.py (flujo de cotización del artista)
- usuarios.txt, materiales.txt, materiales_digital.txt
"""

import json
import os
import sys
from datetime import date

import archivos
import catalogo
import operaciones

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
os.chdir(BASE_DIR)
COTIZACIONES_PATH = os.path.join(BASE_DIR, "cotizaciones.json")
MATERIALES_TXT_PATH = os.path.join(BASE_DIR, "materiales.txt")
MATERIALES_DIGITAL_TXT_PATH = os.path.join(BASE_DIR, "materiales_digital.txt")
USUARIOS_TXT_PATH = os.path.join(BASE_DIR, "usuarios.txt")

TARIFAS_SUGERIDAS = {
    "Junior": 180.0,
    "Semi Senior": 290.0,
    "Senior": 450.0,
}


def asegurar_salto_linea_final(ruta_archivo: str) -> None:
    """Garantiza que un archivo .txt termine en salto de línea antes de hacer append."""
    if not os.path.exists(ruta_archivo):
        return
    with open(ruta_archivo, "rb") as f:
        contenido = f.read()
    if contenido and not contenido.endswith(b"\n"):
        with open(ruta_archivo, "ab") as f:
            f.write(b"\n")


def leer_materiales_txt(ruta_archivo: str, formato: str) -> list[dict]:
    """Lee materiales desde materiales.txt o materiales_digital.txt."""
    items = []
    if not os.path.exists(ruta_archivo):
        return items

    with open(ruta_archivo, "r", encoding="utf-8") as f:
        idx = 1
        for linea in f:
            linea_limpia = linea.strip()
            if not linea_limpia or "," not in linea_limpia:
                continue
            partes = linea_limpia.split(",", 1)
            nombre = partes[0].strip()
            try:
                precio = float(partes[1].strip())
            except ValueError:
                continue
            items.append(
                {
                    "id": idx,
                    "nombre": nombre,
                    "precio": precio,
                    "formato": formato,
                    "fuenteArchivo": os.path.basename(ruta_archivo),
                }
            )
            idx += 1
    return items


def escribir_materiales_txt(ruta_archivo: str, items: list[dict]) -> None:
    """Persiste la lista de materiales en su archivo .txt correspondiente."""
    with open(ruta_archivo, "w", encoding="utf-8") as f:
        for item in items:
            precio = item["precio"]
            precio_str = str(int(precio)) if float(precio).is_integer() else str(precio)
            f.write(f"{item['nombre']},{precio_str}\n")


def obtener_catalogo_completo() -> list[dict]:
    tradicionales = leer_materiales_txt(MATERIALES_TXT_PATH, "Tradicional")
    if not tradicionales:
        for num, mat in catalogo.materiales_tradicionales.items():
            tradicionales.append(
                {
                    "id": num,
                    "nombre": mat["nombre"],
                    "precio": float(mat["precio"]),
                    "formato": "Tradicional",
                    "fuenteArchivo": "catalogo.py",
                }
            )

    digitales = leer_materiales_txt(MATERIALES_DIGITAL_TXT_PATH, "Digital")
    if not digitales:
        for num, mat in catalogo.materiales_digitales.items():
            digitales.append(
                {
                    "id": num,
                    "nombre": mat["nombre"],
                    "precio": float(mat["precio"]),
                    "formato": "Digital",
                    "fuenteArchivo": "catalogo.py",
                }
            )

    return tradicionales + digitales


def leer_usuarios_seguros() -> list[dict]:
    """Lee nombres de usuarios desde usuarios.txt sin exponer contraseñas."""
    usuarios = []
    if not os.path.exists(USUARIOS_TXT_PATH):
        return usuarios

    with open(USUARIOS_TXT_PATH, "r", encoding="utf-8") as f:
        for linea in f:
            limpia = linea.strip()
            if not limpia or "," not in limpia:
                continue
            nombre = limpia.split(",", 1)[0].strip()
            es_yohan = nombre.lower() == "yohan"
            usuarios.append(
                {
                    "nombre": nombre,
                    "nivelHabitual": "Senior" if es_yohan else "Semi Senior",
                    "tarifaBaseMxn": 450 if es_yohan else 280,
                    "formatoPrincipal": "Digital" if es_yohan else "Tradicional",
                    "fechaRegistro": "2026-02-14",
                }
            )
    return usuarios


def inicializar_cotizaciones_si_vacio() -> list[dict]:
    if os.path.exists(COTIZACIONES_PATH):
        with open(COTIZACIONES_PATH, "r", encoding="utf-8") as f:
            return json.load(f)

    # Semilla inicial calculada usando operaciones.py
    mano_1 = operaciones.calcular_mano_obra(14, 280)
    total_1 = operaciones.calcular_total(460, mano_1, 150)

    mano_2 = operaciones.calcular_mano_obra(18, 450)
    total_2 = operaciones.calcular_total(950, mano_2, 220)
    final_2 = round(operaciones.convertir_moneda(total_2, 20.15), 2)

    iniciales = [
        {
            "id": "COT-1042",
            "tituloProyecto": "Retrato acrílico sobre lienzo 60x80",
            "artista": "Koko",
            "fechaISO": "2026-11-22",
            "nivel": "Semi Senior",
            "precioHoraMxn": 280,
            "horas": 14,
            "metodoPago": "Transferencia",
            "divisa": "MXN",
            "tipoCambioMxn": 1,
            "formato": "Tradicional",
            "materiales": [
                {
                    "uid": "seed-1",
                    "materialId": 4,
                    "nombre": "Lienzo",
                    "precioBase": 150,
                    "usoPrecioBase": False,
                    "precioPagado": 210,
                    "precioUnitarioAplicado": 180,
                    "cantidad": 1,
                    "subtotalMxn": 180,
                },
                {
                    "uid": "seed-2",
                    "materialId": 2,
                    "nombre": "Pintura",
                    "precioBase": 50,
                    "usoPrecioBase": True,
                    "precioPagado": None,
                    "precioUnitarioAplicado": 50,
                    "cantidad": 4,
                    "subtotalMxn": 200,
                },
                {
                    "uid": "seed-3",
                    "materialId": 5,
                    "nombre": "Barniz",
                    "precioBase": 80,
                    "usoPrecioBase": True,
                    "precioPagado": None,
                    "precioUnitarioAplicado": 80,
                    "cantidad": 1,
                    "subtotalMxn": 80,
                },
            ],
            "costoMaterialesMxn": 460,
            "manoObraMxn": mano_1,
            "costosExtraMxn": 150,
            "totalMxn": total_1,
            "precioFinalDivisa": total_1,
        },
        {
            "id": "COT-1041",
            "tituloProyecto": "Ilustración editorial y portada conceptual",
            "artista": "Yohan",
            "fechaISO": "2026-11-20",
            "nivel": "Senior",
            "precioHoraMxn": 450,
            "horas": 18,
            "metodoPago": "Transferencia",
            "divisa": "USD",
            "tipoCambioMxn": 20.15,
            "formato": "Digital",
            "materiales": [
                {
                    "uid": "seed-4",
                    "materialId": 1,
                    "nombre": "Plataformas",
                    "precioBase": 950,
                    "usoPrecioBase": True,
                    "precioPagado": None,
                    "precioUnitarioAplicado": 950,
                    "cantidad": 1,
                    "subtotalMxn": 950,
                }
            ],
            "costoMaterialesMxn": 950,
            "manoObraMxn": mano_2,
            "costosExtraMxn": 220,
            "totalMxn": total_2,
            "precioFinalDivisa": final_2,
        },
    ]
    with open(COTIZACIONES_PATH, "w", encoding="utf-8") as f:
        json.dump(iniciales, f, ensure_ascii=False, indent=2)
    return iniciales


def guardar_cotizaciones(lista: list[dict]) -> None:
    with open(COTIZACIONES_PATH, "w", encoding="utf-8") as f:
        json.dump(lista, f, ensure_ascii=False, indent=2)


def manejar_accion(accion: str, datos: dict) -> dict:
    if accion == "login":
        nombre = str(datos.get("nombre", "")).strip()
        contrasena = str(datos.get("contrasena", ""))
        if not nombre or not contrasena:
            return {"ok": False, "mensaje": "Ingresa usuario y contraseña."}

        valido = archivos.iniciar_sesion(nombre, contrasena)
        if not valido:
            return {
                "ok": False,
                "mensaje": "Usuario o contraseña incorrectos.",
            }

        usuarios = leer_usuarios_seguros()
        perfil = next(
            (u for u in usuarios if u["nombre"] == nombre),
            {
                "nombre": nombre,
                "nivelHabitual": "Semi Senior",
                "tarifaBaseMxn": 290,
                "formatoPrincipal": "Digital",
                "fechaRegistro": date.today().isoformat(),
            },
        )
        return {
            "ok": True,
            "mensaje": "¡Inicio de sesión correcto!",
            "usuario": perfil,
        }

    if accion == "register":
        nombre = str(datos.get("nombre", "")).strip()
        contrasena = str(datos.get("contrasena", ""))
        if not nombre or not contrasena:
            return {
                "ok": False,
                "mensaje": "El nombre de usuario y la contraseña no pueden estar vacíos.",
            }
        if "," in nombre or "," in contrasena:
            return {
                "ok": False,
                "mensaje": "No se permiten comas en el usuario o contraseña.",
            }

        asegurar_salto_linea_final(USUARIOS_TXT_PATH)
        registrado = archivos.registrar_usuario(nombre, contrasena)
        if not registrado:
            return {
                "ok": False,
                "mensaje": "Ese usuario ya existe.",
            }

        nuevo_perfil = {
            "nombre": nombre,
            "nivelHabitual": "Junior",
            "tarifaBaseMxn": 180,
            "formatoPrincipal": "Digital",
            "fechaRegistro": date.today().isoformat(),
        }
        return {
            "ok": True,
            "mensaje": "¡Usuario registrado correctamente!",
            "usuario": nuevo_perfil,
        }

    if accion == "list_users":
        return {"ok": True, "usuarios": leer_usuarios_seguros()}

    if accion == "get_catalog":
        return {"ok": True, "materiales": obtener_catalogo_completo()}

    if accion == "add_material":
        nombre = str(datos.get("nombre", "")).strip()
        formato = str(datos.get("formato", "Tradicional"))
        try:
            precio = float(datos.get("precio", 0))
        except (TypeError, ValueError):
            return {"ok": False, "mensaje": "El precio debe ser numérico."}

        if not nombre or precio < 0:
            return {
                "ok": False,
                "mensaje": "Ingresa un nombre válido y precio mayor o igual a 0.",
            }

        ruta = (
            MATERIALES_DIGITAL_TXT_PATH
            if formato == "Digital"
            else MATERIALES_TXT_PATH
        )
        existentes = leer_materiales_txt(ruta, formato)
        diccionario = {
            m["id"]: {"nombre": m["nombre"], "precio": m["precio"]}
            for m in existentes
        }
        if not diccionario:
            diccionario = {0: {"nombre": "_base", "precio": 0}}
        nuevo_id = catalogo.agregar_material(diccionario, nombre, precio)

        asegurar_salto_linea_final(ruta)
        precio_str = str(int(precio)) if precio.is_integer() else str(precio)
        with open(ruta, "a", encoding="utf-8") as f:
            f.write(f"{nombre},{precio_str}\n")

        nuevo_item = {
            "id": nuevo_id,
            "nombre": nombre,
            "precio": precio,
            "formato": formato,
            "fuenteArchivo": os.path.basename(ruta),
        }
        return {
            "ok": True,
            "mensaje": f"Material '{nombre}' registrado con ID {nuevo_id}.",
            "material": nuevo_item,
        }

    if accion == "update_material":
        mat_id = int(datos.get("id", 0))
        formato = str(datos.get("formato", "Tradicional"))
        nuevo_precio = float(datos.get("precio", 0))
        if nuevo_precio < 0:
            return {"ok": False, "mensaje": "El precio no puede ser negativo."}

        ruta = (
            MATERIALES_DIGITAL_TXT_PATH
            if formato == "Digital"
            else MATERIALES_TXT_PATH
        )
        items = leer_materiales_txt(ruta, formato)
        actualizado = False
        for item in items:
            if item["id"] == mat_id:
                item["precio"] = nuevo_precio
                actualizado = True
                break

        if not actualizado:
            return {"ok": False, "mensaje": "Material no encontrado."}

        escribir_materiales_txt(ruta, items)
        return {
            "ok": True,
            "mensaje": "Precio actualizado correctamente.",
            "materiales": obtener_catalogo_completo(),
        }

    if accion == "delete_material":
        mat_id = int(datos.get("id", 0))
        formato = str(datos.get("formato", "Tradicional"))
        ruta = (
            MATERIALES_DIGITAL_TXT_PATH
            if formato == "Digital"
            else MATERIALES_TXT_PATH
        )
        items = leer_materiales_txt(ruta, formato)
        filtrados = [item for item in items if item["id"] != mat_id]
        if len(filtrados) == len(items):
            return {"ok": False, "mensaje": "Material no encontrado."}

        escribir_materiales_txt(ruta, filtrados)
        return {
            "ok": True,
            "mensaje": "Material eliminado del catálogo.",
            "materiales": obtener_catalogo_completo(),
        }

    if accion == "list_quotes":
        return {"ok": True, "cotizaciones": inicializar_cotizaciones_si_vacio()}

    if accion == "save_quote":
        titulo = str(datos.get("tituloProyecto", "")).strip()
        artista = str(datos.get("artista", "Artista")).strip()
        nivel = str(datos.get("nivel", "Semi Senior"))
        metodo_pago = str(datos.get("metodoPago", "Transferencia"))
        divisa = str(datos.get("divisa", "MXN")).upper()
        formato = str(datos.get("formato", "Tradicional"))
        precio_hora = float(datos.get("precioHoraMxn", 0))
        horas = float(datos.get("horas", 0))
        costos_extra = float(datos.get("costosExtraMxn", 0))
        tipo_cambio = float(datos.get("tipoCambioMxn", 1))
        materiales_req = datos.get("materiales", [])

        if not titulo or horas <= 0 or precio_hora <= 0:
            return {
                "ok": False,
                "mensaje": "Completa el título, horas dedicadas y precio por hora.",
            }
        if divisa != "MXN" and tipo_cambio <= 0:
            return {
                "ok": False,
                "mensaje": "El tipo de cambio debe ser mayor a cero.",
            }

        # Recálculo autoritativo usando las reglas de materiales.py y operaciones.py
        materiales_procesados = []
        costo_materiales_mxn = 0.0
        for idx, mat in enumerate(materiales_req):
            precio_base = float(mat.get("precioBase", 0))
            uso_base = bool(mat.get("usoPrecioBase", True))
            precio_pagado = mat.get("precioPagado")
            cantidad = float(mat.get("cantidad", 0))

            if uso_base or precio_pagado is None:
                precio_unitario = precio_base
                pagado_val = None
            else:
                pagado_val = float(precio_pagado)
                # Fórmula exacta de materiales.py: (precio_nuevo + precio_base) / 2
                precio_unitario = operaciones.dividir(
                    operaciones.sumar(pagado_val, precio_base), 2
                )

            subtotal = operaciones.multiplicar(precio_unitario, cantidad)
            costo_materiales_mxn = operaciones.sumar(costo_materiales_mxn, subtotal)

            materiales_procesados.append(
                {
                    "uid": mat.get("uid", f"mat-{idx}"),
                    "materialId": int(mat.get("materialId", idx + 1)),
                    "nombre": str(mat.get("nombre", "Material")),
                    "precioBase": precio_base,
                    "usoPrecioBase": uso_base,
                    "precioPagado": pagado_val,
                    "precioUnitarioAplicado": round(precio_unitario, 2),
                    "cantidad": cantidad,
                    "subtotalMxn": round(subtotal, 2),
                    "esPersonalizado": bool(mat.get("esPersonalizado", False)),
                }
            )

        mano_obra_mxn = operaciones.calcular_mano_obra(horas, precio_hora)
        total_mxn = operaciones.calcular_total(
            costo_materiales_mxn, mano_obra_mxn, costos_extra
        )

        if divisa == "MXN":
            precio_final = total_mxn
        else:
            precio_final = operaciones.convertir_moneda(total_mxn, tipo_cambio)

        cotizaciones = inicializar_cotizaciones_si_vacio()
        nuevo_num = 1043 + len(cotizaciones)
        nueva_cot = {
            "id": f"COT-{nuevo_num}",
            "tituloProyecto": titulo,
            "artista": artista,
            "fechaISO": date.today().isoformat(),
            "nivel": nivel,
            "precioHoraMxn": precio_hora,
            "horas": horas,
            "metodoPago": metodo_pago,
            "divisa": divisa,
            "tipoCambioMxn": 1 if divisa == "MXN" else tipo_cambio,
            "formato": formato,
            "materiales": materiales_procesados,
            "costoMaterialesMxn": round(costo_materiales_mxn, 2),
            "manoObraMxn": round(mano_obra_mxn, 2),
            "costosExtraMxn": round(costos_extra, 2),
            "totalMxn": round(total_mxn, 2),
            "precioFinalDivisa": round(precio_final, 2),
        }

        cotizaciones.insert(0, nueva_cot)
        guardar_cotizaciones(cotizaciones)
        return {
            "ok": True,
            "mensaje": f"Cotización {nueva_cot['id']} calculada y guardada en Python.",
            "cotizacion": nueva_cot,
        }

    if accion == "delete_quote":
        cot_id = str(datos.get("id", ""))
        cotizaciones = inicializar_cotizaciones_si_vacio()
        filtradas = [c for c in cotizaciones if c.get("id") != cot_id]
        guardar_cotizaciones(filtradas)
        return {"ok": True, "mensaje": "Cotización eliminada."}

    if accion == "operations_calc":
        tipo = str(datos.get("tipo", ""))
        if tipo == "mano_obra":
            horas = float(datos.get("horas", 0))
            precio_hora = float(datos.get("precioHora", 0))
            return {
                "ok": True,
                "resultado": round(
                    operaciones.calcular_mano_obra(horas, precio_hora), 2
                ),
            }
        if tipo == "convertir":
            total = float(datos.get("total", 0))
            cambio = float(datos.get("cambio", 1))
            if cambio <= 0:
                return {"ok": False, "mensaje": "El tipo de cambio debe ser > 0."}
            return {
                "ok": True,
                "resultado": round(operaciones.convertir_moneda(total, cambio), 2),
            }
        if tipo == "promedio_ponderado":
            valores = [float(v) for v in datos.get("valores", [])]
            pesos = [float(p) for p in datos.get("pesos", [])]
            return {
                "ok": True,
                "resultado": round(
                    operaciones.promedio_ponderado(valores, pesos), 2
                ),
            }
        return {"ok": False, "mensaje": "Tipo de operación no reconocido."}

    return {"ok": False, "mensaje": f"Acción desconocida: {accion}"}


if __name__ == "__main__":
    try:
        entrada = sys.stdin.read()
        solicitud = json.loads(entrada) if entrada.strip() else {}
        accion = solicitud.get("action", "")
        payload = solicitud.get("payload", {})
        respuesta = manejar_accion(accion, payload)
        print(json.dumps(respuesta, ensure_ascii=False))
    except Exception as exc:
        print(
            json.dumps(
                {"ok": False, "mensaje": f"Error interno en Python: {str(exc)}"},
                ensure_ascii=False,
            )
        )
        sys.exit(1)
