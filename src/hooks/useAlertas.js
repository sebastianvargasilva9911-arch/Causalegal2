import { useEffect, useState } from 'react'
import supabase from '../supabase'
import { useAuth } from '../context/AuthContext'

export function useAlertas() {
  const { usuario } = useAuth()
  const [eventos, setEventos] = useState([])

  const cargar = async () => {
    if (!usuario) return
    const hoy = new Date().toISOString().split('T')[0]
    const en7 = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
    const { data } = await supabase
      .from('eventos')
      .select('*, causas(numero)')
      .eq('usuario_id', usuario.id)
      .gte('fecha', hoy)
      .lte('fecha', en7)
      .order('fecha', { ascending: true })
    setEventos(data || [])
  }

  useEffect(() => { cargar() }, [usuario])

  useEffect(() => {
    const interval = setInterval(cargar, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [usuario])

  const eliminarEvento = async (id) => {
    await supabase.from('eventos').delete().eq('id', id)
    setEventos(prev => prev.filter(e => e.id !== id))
  }

  const eliminarTodos = async () => {
    const ids = eventos.map(e => e.id)
    if (ids.length === 0) return
    await supabase.from('eventos').delete().in('id', ids)
    setEventos([])
  }

  return { eventos, count: eventos.length, eliminarEvento, eliminarTodos, recargar: cargar }
}
