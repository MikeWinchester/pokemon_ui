import { createContext, useContext, useState, useEffect } from 'react'
import { useSSE } from '@/hooks/useSSE'

const ProgressContext = createContext()

export function ProgressProvider({ children }) {
  const [progressData, setProgressData] = useState({})
  const [reportsData, setReportsData] = useState([])
  const sse = useSSE()

  useEffect(() => {
    // Suscribirse a actualizaciones de progreso
    const unsubscribeProgress = sse.subscribe('progress_update', (data) => {
      setProgressData(prev => ({
        ...prev,
        [data.reportId]: {
          status: data.status,
          message: data.message,
          progress: data.progress,
          timestamp: data.timestamp
        }
      }))

      // Limpiar progreso completado después de 5 segundos
      if (data.status === 'completed' || data.status === 'failed') {
        setTimeout(() => {
          setProgressData(prev => {
            const newData = { ...prev }
            delete newData[data.reportId]
            return newData
          })
        }, 5000)
      }
    })

    // Suscribirse a creación de reportes
    const unsubscribeCreated = sse.subscribe('report_created', (data) => {
      if (Array.isArray(data) && data.length > 0) {
        const reportId = data[0].id
        setProgressData(prev => ({
          ...prev,
          [reportId]: {
            status: 'sent',
            message: 'Report queued for processing...',
            progress: 0,
            timestamp: new Date().toISOString()
          }
        }))
      }
    })

    // Suscribirse a actualizaciones de reportes
    const unsubscribeUpdated = sse.subscribe('report_updated', (data) => {
      // Esta información se manejará a través del hook de la tabla
    })

    // Suscribirse a eliminación de reportes
    const unsubscribeDeleted = sse.subscribe('report_deleted', (data) => {
      setProgressData(prev => {
        const newData = { ...prev }
        delete newData[data.id]
        return newData
      })
    })

    return () => {
      unsubscribeProgress()
      unsubscribeCreated()
      unsubscribeUpdated()
      unsubscribeDeleted()
    }
  }, [sse])

  const getProgressForReport = (reportId) => {
    return progressData[reportId] || null
  }

  const clearProgress = (reportId) => {
    setProgressData(prev => {
      const newData = { ...prev }
      delete newData[reportId]
      return newData
    })
  }

  const value = {
    progressData,
    getProgressForReport,
    clearProgress,
    connectionStatus: sse.connectionStatus
  }

  return (
    <ProgressContext.Provider value={value}>
      {children}
    </ProgressContext.Provider>
  )
}

export function useProgress() {
  const context = useContext(ProgressContext)
  if (!context) {
    throw new Error('useProgress must be used within a ProgressProvider')
  }
  return context
}