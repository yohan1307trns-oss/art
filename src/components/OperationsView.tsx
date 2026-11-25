import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import {
  apiCalcularOperacion,
  calcularManoObra,
  calcularPromedioPonderado,
  convertirMoneda,
} from '../api/pythonBackendAdapter';
import { TIPOS_CAMBIO_BASE_MXN } from '../data/mockData';
import { Divisa } from '../types/artValue';
import { formatearMoneda, formatearNumeroCorto } from '../utils/formatters';

interface FilaPonderada {
  id: string;
  concepto: string;
  valor: number;
  peso: number;
}

/**
 * Calculadora de mano de obra, promedio ponderado y conversión de divisas
 * sincronizada con las operaciones en Python.
 */
export function OperationsView() {
  const [montoMxn, setMontoMxn] = useState<number>(5000);
  const [tasas, setTasas] = useState<Record<Divisa, number>>(
    TIPOS_CAMBIO_BASE_MXN
  );

  const [horasSim, setHorasSim] = useState<number>(12);
  const [tarifaSim, setTarifaSim] = useState<number>(350);

  const [filasPonderadas, setFilasPonderadas] = useState<FilaPonderada[]>([
    { id: 'p-1', concepto: 'Boceto y conceptualización', valor: 250, peso: 2 },
    { id: 'p-2', concepto: 'Trazado e ilustración final', valor: 420, peso: 5 },
    { id: 'p-3', concepto: 'Ajustes de color y entrega', valor: 300, peso: 1 },
  ]);

  const [verificacionPython, setVerificacionPython] = useState<string | null>(
    null
  );

  const manoObraResultado = calcularManoObra(horasSim, tarifaSim);
  const resultadoPonderado = calcularPromedioPonderado(
    filasPonderadas.map((f) => f.valor),
    filasPonderadas.map((f) => f.peso)
  );

  const agregarFilaPonderada = () => {
    setFilasPonderadas((prev) => [
      ...prev,
      {
        id: `p-${Date.now()}`,
        concepto: `Etapa ${prev.length + 1}`,
        valor: 300,
        peso: 1,
      },
    ]);
  };

  const actualizarFila = (
    id: string,
    campo: 'concepto' | 'valor' | 'peso',
    nuevoValor: string | number
  ) => {
    setFilasPonderadas((prev) =>
      prev.map((f) => (f.id === id ? { ...f, [campo]: nuevoValor } : f))
    );
  };

  const calcularEnServidorPython = async () => {
    const res = await apiCalcularOperacion({
      tipo: 'promedio_ponderado',
      valores: filasPonderadas.map((f) => f.valor),
      pesos: filasPonderadas.map((f) => f.peso),
    });
    if (res.ok && res.datos) {
      setVerificacionPython(
        `Validado en Python: $ ${formatearNumeroCorto(res.datos.resultado)} MXN / h`
      );
    }
  };

  return (
    <div className="space-y-8">
      <div className="border-b border-[rgba(187,167,254,0.16)] pb-6">
        <p className="text-xs font-medium text-[#bba7fe]">
          Herramientas financieras
        </p>
        <h2 className="mt-1 font-display text-2xl font-bold text-[#f4f3f8]">
          Operaciones y conversión de divisas
        </h2>
        <p className="mt-1 text-sm text-[#bba7fe]">
          Calcula tarifas por hora, promedios ponderados por complejidad y
          equivalencias en moneda extranjera.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-12">
        {/* Conversor múltiple de divisas */}
        <section className="rounded-xl border border-[rgba(187,167,254,0.18)] bg-[#201f29] p-6 xl:col-span-6">
          <h3 className="font-display text-lg font-semibold text-[#f4f3f8]">
            Conversor multi-divisa
          </h3>
          <p className="mt-1 text-xs text-[#bba7fe]">
            Ajusta el tipo de cambio del día para obtener el precio sugerido en
            cada moneda.
          </p>

          <div className="mt-4">
            <label
              htmlFor="monto-base-mxn"
              className="block text-xs font-medium text-[#bba7fe]"
            >
              Monto total base en MXN
            </label>
            <input
              id="monto-base-mxn"
              type="number"
              min={0}
              step="50"
              value={montoMxn}
              onChange={(e) =>
                setMontoMxn(Math.max(0, Number(e.target.value)))
              }
              className="mt-1.5 w-full rounded-lg border border-[rgba(187,167,254,0.25)] bg-[#191820] px-3.5 py-2.5 font-mono-tabular text-base font-semibold text-[#c6ff00] focus:border-[#c6ff00] focus:outline-none"
            />
          </div>

          <div className="mt-5 overflow-x-auto rounded-lg border border-[rgba(187,167,254,0.14)]">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[rgba(187,167,254,0.14)] bg-[#191820] text-xs font-semibold text-[#bba7fe]">
                  <th className="px-3.5 py-2.5">Divisa</th>
                  <th className="px-3.5 py-2.5 text-right">
                    Tipo de cambio (MXN)
                  </th>
                  <th className="px-3.5 py-2.5 text-right">Equivalente</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(187,167,254,0.1)]">
                {(['USD', 'EUR', 'GBP', 'AUD', 'JPY'] as Divisa[]).map((d) => {
                  const convertido = convertirMoneda(montoMxn, d, tasas[d]);
                  return (
                    <tr key={d}>
                      <td className="px-3.5 py-2.5 font-mono-tabular font-semibold text-[#f4f3f8]">
                        {d}
                      </td>
                      <td className="px-3.5 py-2.5 text-right">
                        <input
                          type="number"
                          min={0.01}
                          step="0.01"
                          aria-label={`Tipo de cambio ${d}`}
                          value={tasas[d]}
                          onChange={(e) =>
                            setTasas((prev) => ({
                              ...prev,
                              [d]: Math.max(0.01, Number(e.target.value)),
                            }))
                          }
                          className="w-24 rounded border border-[rgba(187,167,254,0.25)] bg-[#191820] px-2 py-1 text-right font-mono-tabular text-xs text-[#f4f3f8]"
                        />
                      </td>
                      <td className="px-3.5 py-2.5 text-right font-mono-tabular font-semibold text-[#c6ff00]">
                        {formatearMoneda(convertido, d)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Simulador de mano de obra + Promedio ponderado */}
        <div className="space-y-6 xl:col-span-6">
          <section className="rounded-xl border border-[rgba(187,167,254,0.18)] bg-[#201f29] p-6">
            <h3 className="font-display text-lg font-semibold text-[#f4f3f8]">
              Cálculo rápido de mano de obra
            </h3>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3 sm:items-end">
              <div>
                <label
                  htmlFor="sim-horas"
                  className="block text-xs font-medium text-[#bba7fe]"
                >
                  Horas estimadas
                </label>
                <input
                  id="sim-horas"
                  type="number"
                  min={0}
                  step="0.5"
                  value={horasSim}
                  onChange={(e) =>
                    setHorasSim(Math.max(0, Number(e.target.value)))
                  }
                  className="mt-1.5 w-full rounded-lg border border-[rgba(187,167,254,0.25)] bg-[#191820] px-3 py-2 font-mono-tabular text-sm text-[#f4f3f8]"
                />
              </div>
              <div>
                <label
                  htmlFor="sim-tarifa"
                  className="block text-xs font-medium text-[#bba7fe]"
                >
                  Precio por hora (MXN)
                </label>
                <input
                  id="sim-tarifa"
                  type="number"
                  min={0}
                  step="10"
                  value={tarifaSim}
                  onChange={(e) =>
                    setTarifaSim(Math.max(0, Number(e.target.value)))
                  }
                  className="mt-1.5 w-full rounded-lg border border-[rgba(187,167,254,0.25)] bg-[#191820] px-3 py-2 font-mono-tabular text-sm text-[#f4f3f8]"
                />
              </div>
              <div className="rounded-lg bg-[#7b3aec] px-4 py-2.5 text-white">
                <p className="text-[11px] text-white/80">Total mano de obra</p>
                <p className="font-mono-tabular text-lg font-bold">
                  $ {formatearNumeroCorto(manoObraResultado)}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-[rgba(187,167,254,0.18)] bg-[#201f29] p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-display text-lg font-semibold text-[#f4f3f8]">
                  Tarifa por promedio ponderado
                </h3>
                <p className="text-xs text-[#bba7fe]">
                  Calcula una tarifa equilibrada según el peso de cada etapa.
                </p>
              </div>
              <button
                type="button"
                onClick={agregarFilaPonderada}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[rgba(187,167,254,0.28)] px-3 py-1.5 text-xs font-semibold text-[#bba7fe] hover:border-[#bba7fe] hover:text-[#f4f3f8] whitespace-nowrap shrink-0"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                Agregar etapa
              </button>
            </div>

            <div className="mt-4 space-y-2.5">
              {filasPonderadas.map((fila) => (
                <div
                  key={fila.id}
                  className="grid grid-cols-12 items-center gap-2"
                >
                  <input
                    type="text"
                    aria-label="Concepto de etapa"
                    value={fila.concepto}
                    onChange={(e) =>
                      actualizarFila(fila.id, 'concepto', e.target.value)
                    }
                    className="col-span-6 rounded-lg border border-[rgba(187,167,254,0.22)] bg-[#191820] px-3 py-2 text-xs text-[#f4f3f8]"
                  />
                  <input
                    type="number"
                    min={0}
                    aria-label="Tarifa valor MXN"
                    value={fila.valor}
                    onChange={(e) =>
                      actualizarFila(
                        fila.id,
                        'valor',
                        Math.max(0, Number(e.target.value))
                      )
                    }
                    className="col-span-3 rounded-lg border border-[rgba(187,167,254,0.22)] bg-[#191820] px-2.5 py-2 text-right font-mono-tabular text-xs text-[#f4f3f8]"
                  />
                  <input
                    type="number"
                    min={0}
                    aria-label="Peso de etapa"
                    value={fila.peso}
                    onChange={(e) =>
                      actualizarFila(
                        fila.id,
                        'peso',
                        Math.max(0, Number(e.target.value))
                      )
                    }
                    className="col-span-2 rounded-lg border border-[rgba(187,167,254,0.22)] bg-[#191820] px-2.5 py-2 text-right font-mono-tabular text-xs text-[#f4f3f8]"
                  />
                  <button
                    type="button"
                    aria-label={`Quitar ${fila.concepto}`}
                    disabled={filasPonderadas.length <= 1}
                    onClick={() =>
                      setFilasPonderadas((prev) =>
                        prev.filter((item) => item.id !== fila.id)
                      )
                    }
                    className="col-span-1 flex justify-center rounded p-1.5 text-[#bba7fe] hover:text-[#ff8aa3] disabled:opacity-35"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-[#c6ff00] px-4 py-3 text-[#191820]">
              <span className="text-xs font-bold">
                Tarifa ponderada resultante
              </span>
              <span className="font-mono-tabular text-lg font-bold">
                $ {formatearNumeroCorto(resultadoPonderado)} MXN / h
              </span>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={calcularEnServidorPython}
                className="text-xs font-medium text-[#bba7fe] underline-offset-4 hover:text-[#f4f3f8] hover:underline"
              >
                Verificar cálculo con backend Python
              </button>
              {verificacionPython && (
                <span className="font-mono-tabular text-xs text-[#c6ff00]">
                  {verificacionPython}
                </span>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
