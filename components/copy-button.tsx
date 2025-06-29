"use client";

import { useState } from "react";
import { Button, ButtonKbd } from "@/components/ui/button";
import { Check, Copy } from "lucide-react";

interface CopyButtonProps {
  content: string;
  className?: string;
  size?: "sm" | "default" | "lg";
  variant?: "outline" | "default" | "destructive" | "secondary" | "ghost" | "link";
  title?: string;
  shortcut?: string;
  children?: React.ReactNode;
  onClick?: (e: React.MouseEvent) => void;
}

export function CopyButton({ 
  content, 
  className = "", 
  size = "sm",
  variant = "outline",
  title,
  shortcut,
  children,
  onClick
}: CopyButtonProps) {
  const [isCopied, setIsCopied] = useState(false);

  const copyToClipboard = async (e: React.MouseEvent) => {
    // Call external onClick handler if provided
    if (onClick) {
      onClick(e);
    }
    
    try {
      await navigator.clipboard.writeText(content);
      setIsCopied(true);
      
      // 2秒后重置复制状态
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy content:', err);
    }
  };

  return (
    <Button
      size={size}
      variant={variant}
      onClick={copyToClipboard}
      className={className}
      title={title || (isCopied ? "已复制!" : "复制内容")}
    >
      {children || (
        <>
          {isCopied ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
          {shortcut && <ButtonKbd>{shortcut}</ButtonKbd>}
        </>
      )}
    </Button>
  );
}