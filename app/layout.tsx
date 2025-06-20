import type { Metadata } from 'next'
import './globals.css'
import { ThemeWatcher } from '@/components/theme-watcher'

export const metadata: Metadata = {
  title: 'BYR Docs 元信息生成器',
  description: '轻松生成符合规范的YAML元信息文件',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>
        <ThemeWatcher />
        {children}
      </body>
    </html>
  )
}
