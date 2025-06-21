 "use client"

import { useEffect } from 'react'

export function EscapeHandler() {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        // Get the currently focused element
        const activeElement = document.activeElement as HTMLElement
        
        if (activeElement && activeElement !== document.body) {
          // Blur the currently focused element
          activeElement.blur()
          
          // Optionally focus the body to ensure focus is removed
          document.body.focus()
          
          // Prevent default behavior
          event.preventDefault()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  // This component doesn't render anything
  return null
}