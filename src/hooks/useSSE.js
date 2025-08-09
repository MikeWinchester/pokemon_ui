import { useEffect, useRef, useState } from 'react'
import settings from '@/lib/settings'

export function useSSE() {
  const [connectionStatus, setConnectionStatus] = useState('disconnected')
  const [lastMessage, setLastMessage] = useState(null)
  const eventSourceRef = useRef(null)
  const reconnectTimeoutRef = useRef(null)
  const listenersRef = useRef(new Map())

  const connect = () => {
    if (eventSourceRef.current?.readyState === EventSource.OPEN) {
      return
    }

    try {
      const eventSource = new EventSource(`${settings.URL}/events`)
      eventSourceRef.current = eventSource

      eventSource.onopen = () => {
        console.log('SSE connected')
        setConnectionStatus('connected')
        // Limpiar timeout de reconexión si existe
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current)
          reconnectTimeoutRef.current = null
        }
      }

      eventSource.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          console.log('SSE message received:', message)
          
          setLastMessage(message)
          
          // Notificar a los listeners específicos
          const listeners = listenersRef.current.get(message.type) || []
          listeners.forEach(callback => {
            try {
              callback(message.data)
            } catch (error) {
              console.error('Error in SSE listener:', error)
            }
          })
          
          // Notificar a los listeners generales
          const generalListeners = listenersRef.current.get('*') || []
          generalListeners.forEach(callback => {
            try {
              callback(message)
            } catch (error) {
              console.error('Error in general SSE listener:', error)
            }
          })
        } catch (error) {
          console.error('Error parsing SSE message:', error)
        }
      }

      eventSource.onerror = (error) => {
        console.error('SSE error:', error)
        setConnectionStatus('error')
        
        // Reconectar después de 3 segundos
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current)
        }
        
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('Attempting to reconnect SSE...')
          setConnectionStatus('reconnecting')
          connect()
        }, 3000)
      }
    } catch (error) {
      console.error('Error creating EventSource:', error)
      setConnectionStatus('error')
    }
  }

  const disconnect = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    
    setConnectionStatus('disconnected')
  }

  // Función para suscribirse a tipos específicos de mensajes
  const subscribe = (messageType, callback) => {
    const listeners = listenersRef.current.get(messageType) || []
    listeners.push(callback)
    listenersRef.current.set(messageType, listeners)

    // Retornar función de limpieza
    return () => {
      const currentListeners = listenersRef.current.get(messageType) || []
      const filteredListeners = currentListeners.filter(cb => cb !== callback)
      if (filteredListeners.length > 0) {
        listenersRef.current.set(messageType, filteredListeners)
      } else {
        listenersRef.current.delete(messageType)
      }
    }
  }

  useEffect(() => {
    connect()

    return () => {
      disconnect()
    }
  }, [])

  // Cleanup en unmount
  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [])

  return {
    connectionStatus,
    lastMessage,
    subscribe,
    connect,
    disconnect
  }
}