import { useEffect, useRef, useCallback } from 'react'
import type { Phase, PlayerKey } from '@/types/game'
import * as api from '@/services/api'

interface OpponentJoinedData {
  opponent_name: string
}

interface PhaseChangeData {
  phase: Phase
  current_turn?: PlayerKey
}

interface ShotResultData {
  row: number
  col: number
  result: 'hit' | 'miss'
  sunk: string | null
  sunk_cells: number[][] | null
}

interface OpponentShotData {
  row: number
  col: number
  result: 'hit' | 'miss'
  sunk: string | null
}

interface GameOverData {
  winner: PlayerKey
}

export interface GameStreamHandlers {
  onOpponentJoined?: (data: OpponentJoinedData) => void
  onPhaseChange?: (data: PhaseChangeData) => void
  onOpponentReady?: () => void
  onShotResult?: (data: ShotResultData) => void
  onOpponentShot?: (data: OpponentShotData) => void
  onGameOver?: (data: GameOverData) => void
  onOpponentReconnected?: () => void
}

export function useGameStream(handlers: GameStreamHandlers) {
  const sseRef = useRef<EventSource | null>(null)
  const handlersRef = useRef(handlers)
  handlersRef.current = handlers
  const readyRef = useRef(true)
  const bufferRef = useRef<Array<{ type: string; data: unknown }>>([])

  const dispatchEvent = useCallback((type: string, data: unknown) => {
    const h = handlersRef.current
    switch (type) {
      case 'opponent_joined':
        h.onOpponentJoined?.(data as OpponentJoinedData)
        break
      case 'phase_change':
        h.onPhaseChange?.(data as PhaseChangeData)
        break
      case 'opponent_ready':
        h.onOpponentReady?.()
        break
      case 'shot_result':
        h.onShotResult?.(data as ShotResultData)
        break
      case 'opponent_shot':
        h.onOpponentShot?.(data as OpponentShotData)
        break
      case 'game_over':
        h.onGameOver?.(data as GameOverData)
        break
      case 'opponent_reconnected':
        h.onOpponentReconnected?.()
        break
    }
  }, [])

  const connect = useCallback((gameId: string, token: string, buffered = false) => {
    if (sseRef.current) {
      sseRef.current.close()
    }

    readyRef.current = !buffered
    bufferRef.current = []

    const es = api.createSSE(gameId, token)
    sseRef.current = es

    es.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data)
        const { type, data } = payload
        if (type === 'connected') return

        if (!readyRef.current) {
          bufferRef.current.push({ type, data })
          return
        }

        dispatchEvent(type, data)
      } catch {
        // Ignore parse errors (heartbeats)
      }
    }

    es.onerror = () => {
      // EventSource auto-reconnects
    }
  }, [dispatchEvent])

  const flush = useCallback(() => {
    readyRef.current = true
    for (const event of bufferRef.current) {
      dispatchEvent(event.type, event.data)
    }
    bufferRef.current = []
  }, [dispatchEvent])

  const disconnect = useCallback(() => {
    if (sseRef.current) {
      sseRef.current.close()
      sseRef.current = null
    }
  }, [])

  // Clean up on unmount.
  useEffect(() => {
    return () => {
      if (sseRef.current) {
        sseRef.current.close()
      }
    }
  }, [])

  return { connect, disconnect, flush }
}
