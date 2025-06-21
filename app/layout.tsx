import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { EscapeHandler } from '@/components/escape-handler'

export const metadata: Metadata = {
  title: 'BYR Docs Publish',
  description: '上传文件和编写元信息',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <EscapeHandler />
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
