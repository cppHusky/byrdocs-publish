"use client";

import { useRouter } from "next/navigation";
import { Button, ButtonKbd } from "./ui/button";
import { ArrowLeft } from "lucide-react";

interface BackToHomeProps {
  shortcut?: string;
}

export function BackToHome({ shortcut }: BackToHomeProps = {}) {
  const router = useRouter();

  return (
    <div>
      <Button
        variant="ghost"
        onClick={() => router.push("/")}
        className="flex items-center text-muted-foreground p-4 h-12 w-full justify-start font-normal group"
      >
        <span className="transition-transform duration-200 group-hover:-translate-x-1">
          <ArrowLeft className="w-4 h-4" />
        </span>
        <span>返回首页</span>
        {shortcut && <ButtonKbd>{shortcut}</ButtonKbd>}
      </Button>
    </div>
  );
}