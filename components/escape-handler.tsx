"use client"

import { useEffect } from 'react'

export function EscapeHandler() {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Skip if user is typing in an input field
      const activeElement = document.activeElement as HTMLElement
      const isInputField = activeElement && (
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.contentEditable === 'true'
      )

      if (event.key === 'Escape') {
        if (activeElement && activeElement !== document.body) {
          // Blur the currently focused element
          activeElement.blur()
          
          // Optionally focus the body to ensure focus is removed
          document.body.focus()
          
          // Prevent default behavior
          event.preventDefault()
        }
      } else if (!isInputField) {
        if (event.ctrlKey || event.metaKey || event.altKey) {
          return
        }
        if (event.key === 'j') {
          window.scrollBy({ top: 300, behavior: 'smooth' })
          event.preventDefault()
        } else if (event.key === 'k') {
          window.scrollBy({ top: -300, behavior: 'smooth' })
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