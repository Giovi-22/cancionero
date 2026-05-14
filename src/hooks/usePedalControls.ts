'use client'

import { useEffect, useCallback, useRef } from 'react'

interface PedalControlsOptions {
  onNext?: () => void
  onPrev?: () => void
  onScrollUp?: () => void
  onScrollDown?: () => void
  scrollSpeed?: number // Pixels per frame
  enabled?: boolean
}

export function usePedalControls({
  onNext,
  onPrev,
  onScrollUp,
  onScrollDown,
  scrollSpeed = 0.2,
  enabled = true
}: PedalControlsOptions) {
  const scrollDirectionRef = useRef<0 | 1 | -1>(0)
  const animationFrameRef = useRef<number | null>(null)

  const stopScrolling = useCallback(() => {
    scrollDirectionRef.current = 0
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
  }, [])

  const startScrolling = useCallback((direction: 1 | -1) => {
    // If already scrolling in this direction, do nothing
    if (scrollDirectionRef.current === direction) return

    scrollDirectionRef.current = direction
    
    if (animationFrameRef.current !== null) return

    const scrollStep = () => {
      if (scrollDirectionRef.current !== 0) {
        window.scrollBy({ top: scrollDirectionRef.current * scrollSpeed * 4 })
        animationFrameRef.current = requestAnimationFrame(scrollStep)
      } else {
        animationFrameRef.current = null
      }
    }

    animationFrameRef.current = requestAnimationFrame(scrollStep)
  }, [scrollSpeed])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled) return

    // Ignore browser autorepeat
    if (e.repeat) return

    switch (e.code) {
      case 'ArrowRight':
        e.preventDefault()
        onNext?.()
        break
      case 'ArrowLeft':
        e.preventDefault()
        onPrev?.()
        break
      case 'ArrowUp':
        e.preventDefault()
        if (onScrollUp) {
          onScrollUp()
        } else {
          startScrolling(-1)
        }
        break
      case 'ArrowDown':
        e.preventDefault()
        if (onScrollDown) {
          onScrollDown()
        } else {
          startScrolling(1)
        }
        break
    }
  }, [onNext, onPrev, onScrollUp, onScrollDown, startScrolling, enabled])

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    if (!enabled) return

    switch (e.code) {
      case 'ArrowUp':
      case 'ArrowDown':
        if (!onScrollUp && !onScrollDown) {
          stopScrolling()
        }
        break
    }
  }, [enabled, onScrollUp, onScrollDown, stopScrolling])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      stopScrolling()
    }
  }, [handleKeyDown, handleKeyUp, stopScrolling])
}
