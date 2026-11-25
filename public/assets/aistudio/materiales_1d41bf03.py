import catalogo

def seleccionar_materiales(materiales):
    total = 0

    catalogo.mostrar_catalogo(materiales)

    numero = int(input(
        "\nSelecciona un material (0 para terminar): "))

    while numero != 0:
        material = catalogo.consultar_catalogo(
            materiales, numero)

        if material != None:
            precio_base = material["precio"]

            respuesta = input(
                "¿Te costo eso? (s/n): ").lower()

            if respuesta == "s":
                precio = precio_base
            else:
                precio_nuevo = float(input(
                    "Ingresa el precio que pagaste: "))

                precio = (precio_nuevo + precio_base) / 2

            cantidad = float(input(
                "¿Cuanto material utilizaste?: "))

            costo = precio * cantidad
            total = total + costo

            print("Costo del material: $", costo)

        else:
            print("Material no encontrado")

        numero = int(input(
            "\nSelecciona otro material (0 para terminar): "))

    
    agregar = input(
        "\n¿Utilizaste algun material no mencionado "
        "en la tabla? (s/n): ").lower()

    i = 0

    while agregar == "s" and i < 20:
        nombre = input(
            "Nombre del material: ")

        precio = float(input(
            "Ingresa el precio del material: "))

        numero = catalogo.agregar_material(
            materiales, nombre, precio)

        print("Material registrado con ID:", numero)

        cantidad = float(input(
            "¿Cuanto material utilizaste?: "))

        costo = precio * cantidad
        total = total + costo

        print("Material:", nombre)
        print("Costo del material: $", costo)

        i = i + 1

        if i < 20:
            agregar = input(
                "\n¿Agregaras otro material? "
                "(s/n): ").lower()
        else:
            print("Llegaste al maximo de 20 materiales")

    return total

