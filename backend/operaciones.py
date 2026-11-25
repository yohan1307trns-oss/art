def sumar(a, b):
    return a + b


def restar(a, b):
    return a - b


def multiplicar(a, b):
    return a * b


def dividir(a, b):
    if b != 0:
        return a / b
    else:
        print("No se puede dividir entre cero.")
        return 0


def promedio(numeros):
    return sum(numeros) / len(numeros)


def promedio_ponderado(valores, pesos):
    suma_valores = 0
    suma_pesos = 0

    for i in range(len(valores)):
        suma_valores = suma_valores + (valores[i] * pesos[i])
        suma_pesos = suma_pesos + pesos[i]

    if suma_pesos != 0:
        return suma_valores / suma_pesos
    else:
        print("Los pesos no pueden sumar cero.")
        return 0


def calcular_mano_obra(horas, precio_hora):
    total = multiplicar(horas, precio_hora)
    return total


def calcular_total(materiales, mano_obra, extras):
    total = sumar(materiales, mano_obra)
    total = sumar(total, extras)

    return total


def convertir_moneda(total, cambio):
    resultado = multiplicar(total, cambio)
    return resultado


def convertir_moneda(total, cambio):
    resultado = total / cambio
    return resultado
