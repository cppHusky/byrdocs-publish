import { ButtonKbd } from "./button";

interface TransparentButtonKbdProps {
  children: React.ReactNode;
}

export function TransparentButtonKbd({ children }: TransparentButtonKbdProps) {
  return (
    <ButtonKbd className="dark:bg-white/10 bg-white/10 dark:text-white/70 text-white/70 dark:border-white/40 border-white/40">
      {children}
    </ButtonKbd>
  );
}