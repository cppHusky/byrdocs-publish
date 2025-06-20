import { Checkbox } from "../ui/checkbox";
import { useState, useRef } from "react";

// 键盘导航复选框组件
export function CheckboxGroup({
    options,
    selectedValues,
    onChange,
    isHighlighted = false,
  }: {
    options: string[];
    selectedValues: string[];
    onChange: (values: string[]) => void;
    isHighlighted?: boolean;
  }) {
    const [focusedIndex, setFocusedIndex] = useState(-1);
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
      if (focusedIndex === -1) {
        setFocusedIndex(0);
      }
    };
  
    const handleBlur = (e: React.FocusEvent) => {
      // 只有当焦点完全离开容器时才重置
      if (!containerRef.current?.contains(e.relatedTarget)) {
        setFocusedIndex(-1);
      }
    };
  
    const handleMouseLeave = () => {
      // 鼠标移出时取消高亮
      setFocusedIndex(-1);
    };
  
    return (
      <div
        ref={containerRef}
        className={`space-y-2 ${isHighlighted ? 'p-2 border border-red-500 rounded-md' : ''}`}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onMouseLeave={handleMouseLeave}
        role="group"
        aria-label="复选框组"
      >
        {options.map((option, index) => (
          <div
            key={option}
            className={`text-sm flex items-center space-x-2 p-1 rounded cursor-pointer ${
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
              tabIndex={-1} // 让容器处理焦点
            />
            <span className="cursor-pointer flex-1 select-none">
              {option}
            </span>
          </div>
        ))}
      </div>
    );
  }
  