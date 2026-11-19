import { useState, useCallback, useRef } from 'react'

/**
 * Hook personalizado reutilizable para gestionar el estado de formularios por nombre de campo.
 */
export function useFormulario(valoresIniciales = {}) {
  const inicialRef = useRef(valoresIniciales)
  const [valores, setValores] = useState(valoresIniciales)

  const cambiar = useCallback((evento) => {
    const { name, value, type, checked } = evento.target
    setValores((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }, [])

  const asignarCampo = useCallback((nombreCampo, valor) => {
    setValores((prev) => ({
      ...prev,
      [nombreCampo]: valor,
    }))
  }, [])

  const reiniciar = useCallback((nuevosValores) => {
    setValores(
      nuevosValores !== undefined ? nuevosValores : inicialRef.current
    )
  }, [])

  return {
    valores,
    setValores,
    cambiar,
    asignarCampo,
    reiniciar,
  }
}

export default useFormulario
