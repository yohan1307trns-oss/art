def registrar_usuario(nombre, contraseña):

    archivo = open("usuarios.txt", "r", encoding="utf-8")

    for linea in archivo:
        datos = linea.strip().split(",")

        if datos[0] == nombre:
            archivo.close()
            return False

    archivo.close()

    archivo = open("usuarios.txt", "a", encoding="utf-8")

    archivo.write(nombre + "," + contraseña + "\n")

    archivo.close()

    return True


def iniciar_sesion(nombre, contraseña):

    archivo = open("usuarios.txt", "r", encoding="utf-8")

    for linea in archivo:
        datos = linea.strip().split(",")

        if datos[0] == nombre and datos[1] == contraseña:
            archivo.close()
            return True

    archivo.close()

    return False
