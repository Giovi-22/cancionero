# Pedal Control Implementation (Bluetooth ESP32)

Support for physical pedals that act as Bluetooth keyboards (sending Arrow keys).

## Proposed Changes

### [NEW] [usePedalControls.ts](file:///e:/GIOVI/PROGRAMACI%C3%93N/MUSICA/App-cancionero/src/hooks/usePedalControls.ts)
A custom hook that centralizes keyboard event listeners for the pedal.

- **Navigation**: Triggers `onNext` and `onPrev` callbacks.
- **Scroll**: Handles `ArrowUp`/`ArrowDown` with smooth scrolling.
- **Context-aware**: It will be used in components where navigation and scrolling make sense.

### [MODIFY] [NativeSongViewer.tsx](file:///e:/GIOVI/PROGRAMACI%C3%93N/MUSICA/App-cancionero/src/components/songs/NativeSongViewer.tsx)
Integrate the `usePedalControls` hook to:
- Navigate to the next/previous song in the current setlist (if `listId` is present).
- Navigate the live show if the user is the Director.
- Provide smooth scrolling for the song content.

### [NEW] [PedalHandler.tsx](file:///e:/GIOVI/PROGRAMACI%C3%93N/MUSICA/App-cancionero/src/components/songs/PedalHandler.tsx)
A lightweight client component to handle pedal events in pages that are otherwise Server Components or use iframes (like the PDF viewer).

### [MODIFY] [page.tsx](file:///e:/GIOVI/PROGRAMACI%C3%93N/MUSICA/App-cancionero/src/app/songs/[id]/page.tsx)
Include `PedalHandler` when viewing a PDF to allow scrolling and navigation via pedal.

## Details on Scroll Behavior
The ESP32 code sends `KEY_UP_ARROW` / `KEY_DOWN_ARROW` every 80ms while pressed.
We will implement a `smoothScroll` function that:
- Scrolls a fixed amount (e.g., 40px).
- Uses `window.scrollBy({ top: amount, behavior: 'smooth' })`.
- Optionally, we can make it more "continuous" by using `requestAnimationFrame` if the default browser repeat behavior isn't smooth enough.

## Navigation Logic
- **Priority 1**: If user is Director of a live show -> Change the live session song.
- **Priority 2**: If `?list=...` is present -> Navigate local setlist.
- **Priority 3**: Fallback to browsing history or do nothing.

## Verification Plan

### Manual Verification
1. Open a song in `NativeSongViewer`.
2. Press Left/Right arrow keys to navigate the setlist.
3. Press Up/Down arrow keys to scroll.
4. Test in "Stage Mode" (fullscreen).
5. Test with a PDF (iframe) to ensure scrolling and navigation still work.
6. (User) Test with the physical ESP32 pedal.
