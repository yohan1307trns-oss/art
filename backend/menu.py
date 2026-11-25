import catalogo
import materiales
import operaciones
import archivos


opcion = 0

while opcion != 3:

    print("✧✧⋄⋅⋆⋅⋆⋅⋆⋅⋆⋄✧⋄⋆⋅⋆⋅⋆⋅⋆⋄✧✧")
    print("-ˏˋ⋆ ᴡ ᴇ ʟ ᴄ ᴏ ᴍ ᴇ ⋆ˊˎ-")
    print("✧✧⋄⋅⋆⋅⋆⋅⋆⋅⋆⋄✧⋄⋆⋅⋆⋅⋆⋅⋆⋄✧✧")
    print("1. Iniciar sesion")
    print("2. Registrarse")
    print("3. Salir")

    opcion = int(input("Selecciona una opcion: "))

    match opcion:

        case 1:
            sesion = False

            while sesion == False:

                nombre = input("Nombre de usuario: ")
                contraseña = input("Contraseña: ")

                if archivos.iniciar_sesion(nombre, contraseña):
                    print("¡Inicio de sesion correcto!")
                    sesion = True

                else:
                    print("Usuario o contraseña incorrectos")
                    print("Intenta nuevamente")

            opcion_menu = 0

            while opcion_menu != 2:

                print("\n===== MENU DEL ARTISTA =====")
                print("1. Nueva cotizacion")
                print("2. Cerrar sesion")

                opcion_menu = int(input("Selecciona una opcion: "))

                match opcion_menu:

                    case 1:
                        print("\n===== NUEVA COTIZACION =====")

                        nivel = input(
                            "¿Que nivel de trabajo manejas? "
                            "(Junior, Semi Senior o Senior): ")

                        precio_hora = float(input(
    "De acuerdo a tu nivel, ¿que precio tiene tu hora en MXN?: "))

                        print("\nMetodo de pago")
                        print("1. Efectivo")
                        print("2. Transferencia")
                        print("3. Otro")

                        opc1 = int(input("Selecciona el metodo de pago: "))

                        match opc1:
                            case 1:
                                metodo_pago = "Efectivo"
                            case 2:
                                metodo_pago = "Transferencia"
                            case 3:
                                metodo_pago = "Otro"
                            case _:
                                metodo_pago = "No seleccionado"
                                print("Metodo de pago no valido")

                        print("\nDivisas")
                        print("USD / MXN / EUR / JPY / GBP / AUD")

                        divisa = input("¿Que divisa se usara?: ").upper()

                        print("\nFormato de trabajo")
                        print("1. Digital")
                        print("2. Tradicional")

                        opc2 = int(input("Selecciona el formato: "))

                        match opc2:
                            case 1:
                                formato_trabajo = "Digital"
                                costo_materiales = materiales.seleccionar_materiales(
                                    catalogo.materiales_digitales)

                            case 2:
                                formato_trabajo = "Tradicional"
                                costo_materiales = materiales.seleccionar_materiales(
                                    catalogo.materiales_tradicionales)

                            case _:
                                formato_trabajo = "No seleccionado"
                                costo_materiales = 0
                                print("Formato no valido")

                        if opc2 == 1 or opc2 == 2:
                            horas = float(input(
                                "¿Cuantas horas le dedicaste a este proyecto?: "))

                            mano_obra = operaciones.calcular_mano_obra(
                                horas, precio_hora)

                            costos_extra = float(input(
                                "¿Cuanto gastaste en costos extra en MXN?: "))

                            total_mxn = operaciones.calcular_total(
                                costo_materiales, mano_obra, costos_extra)

                            if divisa == "MXN":
                                precio_final = total_mxn
                            else:
                                cambio = float(input(
                                    "¿A cuanto esta el cambio de hoy de " +
                                    divisa + " a pesos mexicanos?: "))

                                precio_final = operaciones.convertir_moneda(
                                    total_mxn, cambio)

                            print("\n===== RESULTADO =====")
                            print("Nivel:", nivel)
                            print("Metodo de pago:", metodo_pago)
                            print("Formato:", formato_trabajo)
                            print("Materiales en MXN: $", costo_materiales)
                            print("Mano de obra en MXN: $", mano_obra)
                            print("Costos extra en MXN: $", costos_extra)
                            print("Total en MXN: $", total_mxn)
                            print("Precio sugerido en", divisa, ": $", precio_final)
                    case 2:
                        print("Sesion cerrada")
                        break

                    case _:
                        print("Opcion no valida")

                if opcion_menu == 1:
                    print("\n¿Deseas iniciar un nuevo calculo?")
                    print("1. Si")
                    print("2. No")

                    opc = int(input("Selecciona una opcion: "))

                    match opc:
                        case 1:
                            print("¡Vamos a realizar otra cotizacion!")

                        case 2:
                            print("Regresando al menu del artista...")
                            opcion_menu = 0

                        case _:
                            print("Opcion no valida")

        case 2:
            nombre = input("Crea un nombre de usuario: ")
            contraseña = input("Crea una contraseña: ")

            if archivos.registrar_usuario(nombre, contraseña):
                print("¡Usuario registrado correctamente!")
            else:
                print("Ese usuario ya existe")

        case 3:
            print("Gracias por utilizar Art$value")

        case _:
            print("Opcion no valida")


