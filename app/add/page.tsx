'use client';

import YamlGenerator from "@/components/yaml-generator"
import { BackToHome } from "@/components/back-to-home"
import { ShortcutProvider } from "@/components/ui/button";

export const runtime = 'edge';

export default function Page() {
  return (
    <ShortcutProvider>
        <div className="min-h-screen py-8 bg-background">
        <div className="max-w-4xl mx-auto px-4">
            <BackToHome shortcut="m" />
            <YamlGenerator />
        </div>
        </div>
    </ShortcutProvider>
  )
}
