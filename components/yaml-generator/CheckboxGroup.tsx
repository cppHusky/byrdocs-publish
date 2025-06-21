import { cn } from "@/lib/utils";
import { Checkbox } from "../ui/checkbox";
import { useState, useRef } from "react";

// 键盘导航复选框组件
export function CheckboxGroup({
    options,
    selectedValues,
    onChange,
    id,
    isHighlighted = false,
  }: {
    options: string[];
    selectedValues: string[];
    onChange: (values: string[]) => void;
    id?: string;
    isHighlighted?: boolean;
  }) {
    const [focusedIndex, setFocusedIndex] = useState(-1);
    const [hasFocus, setHasFocus] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
  
    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIndex(prev => (prev + 1) % options.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex(prev => prev <= 0 ? options.length - 1 : prev - 1);
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (focusedIndex >= 0) {
          toggleOption(options[focusedIndex]);
        }
      } else if (e.key >= '1' && e.key <= '9') {
        e.preventDefault();
        const index = parseInt(e.key) - 1;
        if (index < options.length) {
          toggleOption(options[index]);
          setFocusedIndex(index);
        }
      }
    };
  
    const toggleOption = (option: string) => {
      if (selectedValues.includes(option)) {
        onChange(selectedValues.filter(v => v !== option));
      } else {
        onChange([...selectedValues, option]);
      }
    };
  
    const handleFocus = () => {
      setHasFocus(true);
      if (focusedIndex === -1) {
        setFocusedIndex(0);
      }
    };
  
    const handleBlur = (e: React.FocusEvent) => {
      if (!containerRef.current?.contains(e.relatedTarget)) {
        setHasFocus(false);
        setFocusedIndex(-1);
      }
    };
  
    const handleMouseLeave = () => {
      setFocusedIndex(-1);
    };
  
    return (
      <div
        ref={containerRef}
        className={cn(
          "space-y-px p-2 border border-input rounded-md transition-colors focus:outline-none focus:ring-2 ring-primary",
          {
            'border-red-500': isHighlighted,
            'border-transparent': !isHighlighted
          }
        )}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onMouseLeave={handleMouseLeave}
        role="group"
        aria-label="复选框组"
        id={id}
      >
        {options.map((option, index) => (
          <div
            key={option}
            className={`text-sm flex items-center space-x-2 p-1 px-2 rounded cursor-pointer ${
              focusedIndex === index ? 'bg-accent' : ''
            }`}
            onClick={(e) => {
              e.preventDefault();
              setFocusedIndex(index);
              toggleOption(option);
            }}
            onMouseEnter={() => setFocusedIndex(index)}
          >
            <Checkbox
              id={`checkbox-${option}`}
              checked={selectedValues.includes(option)}
              onCheckedChange={() => {
                toggleOption(option);
              }}
              tabIndex={-1}
            />
            <span className="cursor-pointer flex-1 select-none py-1">
              {option}
            </span>
            {hasFocus && index < 9 && (
              <kbd className="px-2 py-1 text-xs bg-background border rounded">
                {index + 1}
              </kbd>
            )}
          </div>
        ))}
      </div>
    );
  }
  