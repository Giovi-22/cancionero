'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useSetlists } from '@/hooks/useSetlists'
import { usePedalControls } from '@/hooks/usePedalControls'
import { useAppSettings } from '@/hooks/useAppSettings'

interface PedalHandlerProps {
  songId: string
}

export default function PedalHandler({ songId }: PedalHandlerProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { setlists } = useSetlists()
  
  const listId = searchParams.get('list')
  const listSetlist = listId ? setlists.find(s => s.id === listId) : null
  
  const currentListIndex = listSetlist 
    ? listSetlist.songIds.findIndex(id => id === songId) 
    : -1
    
  const prevListSongId = currentListIndex > 0 && listSetlist 
    ? listSetlist.songIds[currentListIndex - 1] 
    : null
    
  const nextListSongId = currentListIndex !== -1 && listSetlist && currentListIndex < listSetlist.songIds.length - 1 
    ? listSetlist.songIds[currentListIndex + 1] 
    : null

  const { settings } = useAppSettings()

  usePedalControls({
    onNext: () => {
      if (nextListSongId) {
        router.push(`/songs/${nextListSongId}?list=${listId}`)
      }
    },
    onPrev: () => {
      if (prevListSongId) {
        router.push(`/songs/${prevListSongId}?list=${listId}`)
      }
    },
    scrollSpeed: settings.pedalScrollSpeed
  })

  // Este componente no renderiza nada, solo escucha eventos
  return null
}
