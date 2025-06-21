import { useEffect, useRef, useState } from "react";
import { Input } from "../ui/input";

// 课程名称自动补全组件
export function CourseNameInput({
    value,
    onChange,
    id,
    courseList,
    placeholder = "例如：概率论与数理统计",
    isHighlighted = false,
  }: {
    value: string;
    id?: string;
    onChange: (value: string) => void;
    courseList: string[];
    placeholder?: string;
    isHighlighted?: boolean;
  }) {
    const [open, setOpen] = useState(false);
    const [inputValue, setInputValue] = useState(value);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const listRef = useRef<HTMLDivElement>(null);
  
    // 同步外部 value 变化
    useEffect(() => {
      setInputValue(value);
    }, [value]);
  
    // 过滤课程列表
    const filteredCourses = courseList.filter((course) =>
      course.toLowerCase().includes(inputValue.toLowerCase())
    ).slice(0, 10);
  
    // 重置高亮索引当列表变化时
    useEffect(() => {
      setHighlightedIndex(-1);
    }, [filteredCourses.length]);
  
    // 滚动到高亮项
    const scrollToHighlighted = (index: number) => {
      if (listRef.current && index >= 0) {
        const listElement = listRef.current;
        const itemElement = listElement.children[index] as HTMLElement;
        
        if (itemElement) {
          const listRect = listElement.getBoundingClientRect();
          const itemRect = itemElement.getBoundingClientRect();
          
          // 检查项目是否在可视区域内
          const isVisible = itemRect.top >= listRect.top && itemRect.bottom <= listRect.bottom;
          
          if (!isVisible) {
            // 计算需要滚动的距离
            const scrollTop = listElement.scrollTop;
            const itemOffsetTop = itemElement.offsetTop;
            const itemHeight = itemElement.offsetHeight;
            const listHeight = listElement.clientHeight;
            
            if (itemRect.top < listRect.top) {
              // 项目在可视区域上方，滚动到顶部
              listElement.scrollTop = itemOffsetTop;
            } else if (itemRect.bottom > listRect.bottom) {
              // 项目在可视区域下方，滚动到底部
              listElement.scrollTop = itemOffsetTop - listHeight + itemHeight;
            }
          }
        }
      }
    };
  
    const handleSelect = (course: string) => {
      setInputValue(course);
      onChange(course);
      setOpen(false);
      setHighlightedIndex(-1);
    };
  
    const handleInputChange = (newValue: string) => {
      setInputValue(newValue);
      onChange(newValue);
      // 总是显示下拉列表如果有输入内容
      setOpen(newValue.trim().length > 0);
    };
  
    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (!open) {
        if (e.key === 'ArrowDown' && inputValue.trim()) {
          e.preventDefault();
          setOpen(true);
          setHighlightedIndex(0);
        }
        return;
      }
  
      if (filteredCourses.length === 0) {
        return;
      }
  
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setHighlightedIndex(prev => {
            const newIndex = prev < filteredCourses.length - 1 ? prev + 1 : 0;
            // 延迟执行滚动，确保状态已更新
            setTimeout(() => scrollToHighlighted(newIndex), 0);
            return newIndex;
          });
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIndex(prev => {
            const newIndex = prev > 0 ? prev - 1 : filteredCourses.length - 1;
            // 延迟执行滚动，确保状态已更新
            setTimeout(() => scrollToHighlighted(newIndex), 0);
            return newIndex;
          });
          break;
        case 'Enter':
        case 'Tab':
          if (highlightedIndex >= 0 && highlightedIndex < filteredCourses.length) {
            e.preventDefault();
            handleSelect(filteredCourses[highlightedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          setOpen(false);
          setHighlightedIndex(-1);
          break;
      }
    };
  
    const handleFocus = () => {
      if (inputValue.trim().length > 0) {
        setOpen(true);
      }
    };
  
    const handleBlur = (e: React.FocusEvent) => {
      // 延迟关闭以允许点击选项
      setTimeout(() => {
        setOpen(false);
        setHighlightedIndex(-1);
      }, 150);
    };
  
    return (
      <div className="relative">
        <Input
          id={id}
          className={`text-sm ${isHighlighted ? 'border-red-500 ring-1 ring-red-500' : ''}`}
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
        />
        {open && filteredCourses.length > 0 && (
          <div 
            ref={listRef}
            className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-64 overflow-auto"
          >
            {filteredCourses.map((course, index) => (
              <div
                key={course}
                className={`px-3 py-2 cursor-pointer text-sm ${
                  index === highlightedIndex 
                    ? 'bg-accent text-accent-foreground' 
                    : 'hover:bg-accent/50'
                }`}
                onMouseDown={(e) => {
                  e.preventDefault(); // 防止失去焦点
                  handleSelect(course);
                }}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                {course}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }