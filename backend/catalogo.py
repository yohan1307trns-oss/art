materiales_tradicionales = {
    1: {"nombre": "Lapiz", "precio": 10.0},
    2: {"nombre": "Pintura", "precio": 50.0},
    3: {"nombre": "Hojas", "precio": 2.0},
    4: {"nombre": "Lienzo", "precio": 150.0},
    5: {"nombre": "Barniz", "precio": 80.0}
}


materiales_digitales = {
    1: {"nombre": "Plataforma", "precio": 950.0}
}


def mostrar_catalogo(materiales):

    for numero, material in materiales.items():

        print(numero, "-", material["nombre"],
              "Precio: $", material["precio"])


def consultar_catalogo(materiales, numero):

    return materiales.get(numero)


def agregar_material(materiales, nombre, precio):
    numero = max(materiales.keys()) + 1

    materiales[numero] = {
        "nombre": nombre,
        "precio": precio
    }

    return numero
