import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

// Global shortcut state manager
type ShortcutState = {
  currentSequence: string
  isWaitingForNext: boolean
  isHighlighted: boolean
}

// Context to share shortcut info between Button and ButtonKbd
const ShortcutContext = React.createContext<{
  registerShortcut: (shortcut: string) => void
  shortcutState: ShortcutState
} | null>(null)

// Global shortcut provider that should wrap the entire app or component tree
export const ShortcutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [shortcutState, setShortcutState] = React.useState<ShortcutState>({
    currentSequence: '',
    isWaitingForNext: false,
    isHighlighted: false
  })
  
  const buttonsRef = React.useRef<Map<string, () => void>>(new Map())
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null)

  const resetState = React.useCallback(() => {
    setShortcutState({
      currentSequence: '',
      isWaitingForNext: false,
      isHighlighted: false
    })
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement
      
      // Check if focus is in input, textarea, or element with disable-shortcut class
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.closest('.disable-shortcut')
      ) {
        return
      }

      // Check if any modifier keys are pressed
      if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) {
        return
      }

      const normalizedEventKey = event.key.toLowerCase()
      
      // Find all buttons that could match this key sequence
      const potentialMatches = Array.from(buttonsRef.current.keys()).filter(shortcut => {
        const currentIndex = shortcutState.currentSequence.length
        const shortcutKeys = shortcut.split('')
        return shortcutKeys[currentIndex] === normalizedEventKey
      })

      if (potentialMatches.length > 0) {
        event.preventDefault()
        const newSequence = shortcutState.currentSequence + normalizedEventKey
        
        // Check for exact matches
        const exactMatches = potentialMatches.filter(shortcut => shortcut === newSequence)
        
        if (exactMatches.length > 0) {
          // Execute all exact matches and reset state
          exactMatches.forEach(shortcut => {
            const callback = buttonsRef.current.get(shortcut)
            if (callback) {
              callback()
            }
          })
          
          resetState()
        } else {
          // Partial match, continue sequence
          setShortcutState({
            currentSequence: newSequence,
            isWaitingForNext: true,
            isHighlighted: true
          })
          
          // Clear existing timeout
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
          }
          
          // Set timeout to reset state after 3 seconds
          timeoutRef.current = setTimeout(() => {
            resetState()
          }, 3000)
        }
      } else {
        // No matches, reset if we were in a sequence
        if (shortcutState.isWaitingForNext || shortcutState.currentSequence.length > 0) {
          resetState()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [shortcutState, resetState])

  const registerButton = React.useCallback((shortcut: string, callback: () => void) => {
    buttonsRef.current.set(shortcut, callback)
  }, [])

  const unregisterButton = React.useCallback((shortcut: string) => {
    buttonsRef.current.delete(shortcut)
  }, [])

  // Expose global manager to window for Label components
  React.useEffect(() => {
    (window as any).__globalShortcutManager = {
      state: shortcutState,
      registerButton,
      unregisterButton,
      resetState
    }
  }, [shortcutState, registerButton, unregisterButton, resetState])

  return (
    <ShortcutContext.Provider value={{ 
      registerShortcut: () => {}, // This will be overridden by Button
      shortcutState,
      registerButton,
      unregisterButton
    } as any}>
      {children}
    </ShortcutContext.Provider>
  )
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, disabled, asChild = false, onClick, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    const [shortcut, setShortcut] = React.useState<string | null>(null)
    const context = React.useContext(ShortcutContext)
    
    const registerShortcut = React.useCallback((shortcut: string) => {
      setShortcut(shortcut.toLowerCase())
    }, [])

    // Register/unregister with global manager
    React.useEffect(() => {
      if (!shortcut || !onClick || !context) return

      const handleClick = () => {
        const buttonElement = typeof ref === 'function' ? null : ref?.current
        
        // Check if button is disabled
        if (buttonElement?.disabled || disabled) {
          return
        }
        
        const syntheticEvent = {
          currentTarget: buttonElement,
          target: buttonElement,
        } as unknown as React.MouseEvent<HTMLButtonElement>
        onClick(syntheticEvent)
      }

      // Get the parent ShortcutProvider's register function
      const provider = context as any
      if (provider && provider.registerButton) {
        provider.registerButton(shortcut, handleClick)
        
        return () => {
          if (provider.unregisterButton) {
            provider.unregisterButton(shortcut)
          }
        }
      }
    }, [shortcut, onClick, ref, context, disabled])

    return (
      <ShortcutContext.Provider value={{ 
        registerShortcut, 
        shortcutState: context?.shortcutState || {
          currentSequence: '',
          isWaitingForNext: false,
          isHighlighted: false
        }
      }}>
        <Comp
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          onClick={onClick}
          disabled={disabled}
          {...props}
        >
          {children}
        </Comp>
      </ShortcutContext.Provider>
    )
  }
)
Button.displayName = "Button"

export interface ButtonKbdProps extends React.HTMLAttributes<HTMLElement> {
  invert?: boolean
}

const ButtonKbd = React.forwardRef<HTMLElement, ButtonKbdProps>(
  ({ className, children, invert, ...props }, ref) => {
    const context = React.useContext(ShortcutContext)
    const shortcutText = React.Children.toArray(children).join('')
    
    React.useEffect(() => {
      if (context && children) {
        context.registerShortcut(shortcutText)
      }
    }, [context, children, shortcutText])
    
    // Determine the visual state based on shortcut progress
    const getKeyState = (keyIndex: number, key: string) => {
      if (!context?.shortcutState) return 'normal'
      
      const { currentSequence, isWaitingForNext } = context.shortcutState
      
      // Check if this shortcut could match the current sequence
      const shortcutKeys = shortcutText.split('')
      const couldMatch = shortcutKeys.slice(0, currentSequence.length).join('') === currentSequence
      
      if (!couldMatch) {
        return 'normal'
      }
      
      if (keyIndex < currentSequence.length) {
        return 'pressed' // Key has been pressed
      } else if (keyIndex === currentSequence.length && isWaitingForNext) {
        return 'waiting' // This is the next key to press
      }
      return 'normal'
    }
    
    // Check if this shortcut should be highlighted
    const { currentSequence, isWaitingForNext } = context?.shortcutState || {}
    const shortcutKeys = shortcutText.split('')
    const couldMatch = shortcutKeys.slice(0, (currentSequence || '').length).join('') === (currentSequence || '')
    const isHighlighted = isWaitingForNext && couldMatch
    
    return (
      <kbd
        className={cn(
          "hidden sm:inline-block px-1 py-px bg-muted text-muted-foreground text-xs border rounded transition-all duration-200",
          {
            "bg-white/30 text-white/80 border-white/40 dark:bg-black/5 dark:text-black/50 dark:border-black/20": invert,
          },
          className
        )}
        ref={ref}
        {...props}
      >
        {shortcutText.length > 1 ? (
          // Multi-key sequence: render each key with individual styling
          shortcutText.split('').map((key, index) => {
            const keyState = getKeyState(index, key)
            return (
              <span
                key={index}
                className={cn(
                  "transition-all duration-200",
                  keyState === 'pressed' && "opacity-50 text-muted-foreground/70",
                  keyState === 'waiting' && "text-primary font-semibold",
                  keyState === 'normal' && ""
                )}
              >
                {key}
              </span>
            )
          })
        ) : (
          // Single key: render normally
          children
        )}
      </kbd>
    )
  }
)
ButtonKbd.displayName = "ButtonKbd"

export { Button, buttonVariants, ButtonKbd }
