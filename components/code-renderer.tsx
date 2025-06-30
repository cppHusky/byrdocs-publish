"use client"

import { useMemo } from "react"
import { cn } from "@/lib/utils"
import hljs from "highlight.js/lib/core"
import { useTheme } from "@/components/theme-provider"
import { DiffLine } from "@/lib/diff"

interface CodeRendererProps {
  content: string
  type: "created" | "deleted" | "diff" | "unchanged"
  filename: string
  actualTheme?: string
  diff?: DiffLine[]
}

export function CodeRenderer({ 
  content, 
  type, 
  filename, 
  actualTheme, 
  diff 
}: CodeRendererProps) {
  const { actualTheme: themeFromContext } = useTheme()
  const theme = actualTheme || themeFromContext
  
  const isYamlFile = useMemo(() => {
    return filename.endsWith('.yml') || filename.endsWith('.yaml')
  }, [filename])

  // Handle empty content
  if (!content || content.trim() === "") {
    return (
      <div className="flex items-center justify-center py-8 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50">
        <div className="text-center">
          <div className="text-sm font-medium mb-1">文件为空</div>
          <div className="text-xs text-gray-400 dark:text-gray-500">该文件没有内容</div>
        </div>
      </div>
    )
  }

  if (type === "created") {
    const lines = content.split("\n")
    return (
      <div className={cn(
        "flex bg-green-50 dark:bg-green-900/20",
        isYamlFile && "yaml-highlight yaml-created",
        theme === 'dark' ? 'yaml-dark' : 'yaml-light'
      )}>
        <div className="flex-shrink-0 bg-green-50 dark:bg-green-900/20">
          {lines.map((_, index) => (
            <div key={index} className="flex border-l-2 border-l-green-400">
              <div className="w-6 sm:w-10 px-1 sm:px-2 py-1 text-xs sm:text-sm text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/40 select-none diff-line-number">
                {index + 1}
              </div>
            </div>
          ))}
        </div>
        <div className="flex-1 overflow-x-auto bg-green-50 dark:bg-green-900/20">
          {lines.map((line, index) => (
            <div key={index}>
              <pre className="px-2 sm:px-4 py-1 font-mono text-xs sm:text-sm text-green-800 dark:text-green-400 whitespace-pre min-w-max">
                {isYamlFile ? (
                  <span dangerouslySetInnerHTML={{
                    __html: hljs.highlight(line || " ", { language: "yaml" }).value
                  }} />
                ) : (
                  line || " "
                )}
              </pre>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (type === "deleted") {
    const lines = content.split("\n")
    return (
      <div className={cn(
        "flex bg-red-50 dark:bg-red-900/20",
        isYamlFile && "yaml-highlight yaml-deleted",
        theme === 'dark' ? 'yaml-dark' : 'yaml-light'
      )}>
        <div className="flex-shrink-0 bg-red-50 dark:bg-red-900/20">
          {lines.map((_, index) => (
            <div key={index} className="flex border-l-2 border-l-red-400">
              <div className="w-6 sm:w-10 px-1 sm:px-2 py-1 text-xs sm:text-sm text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/40 select-none diff-line-number">
                {index + 1}
              </div>
            </div>
          ))}
        </div>
        <div className="flex-1 overflow-x-auto bg-red-50 dark:bg-red-900/20">
          {lines.map((line, index) => (
            <div key={index}>
              <pre className="px-2 sm:px-4 py-1 font-mono text-xs sm:text-sm text-red-800 dark:text-red-400 whitespace-pre min-w-max">
                {isYamlFile ? (
                  <span dangerouslySetInnerHTML={{
                    __html: hljs.highlight(line || " ", { language: "yaml" }).value
                  }} />
                ) : (
                  line || " "
                )}
              </pre>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (type === "unchanged") {
    const lines = content.split("\n")
    return (
      <div className={cn(
        "flex bg-gray-50 dark:bg-gray-800/50",
        isYamlFile && "yaml-highlight yaml-unchanged",
        theme === 'dark' ? 'yaml-dark' : 'yaml-light'
      )}>
        <div className="flex-shrink-0 bg-gray-50 dark:bg-gray-800/50">
          {lines.map((_, index) => (
            <div key={index} className="flex border-l-2 border-l-gray-300 dark:border-l-gray-600">
              <div className="w-6 sm:w-10 px-1 sm:px-2 py-1 text-xs sm:text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 select-none diff-line-number">
                {index + 1}
              </div>
            </div>
          ))}
        </div>
        <div className="flex-1 overflow-x-auto bg-gray-50 dark:bg-gray-800/50">
          {lines.map((line, index) => (
            <div key={index}>
              <pre className="px-2 sm:px-4 py-1 font-mono text-xs sm:text-sm text-gray-700 dark:text-gray-300 whitespace-pre min-w-max">
                {isYamlFile ? (
                  <span dangerouslySetInnerHTML={{
                    __html: hljs.highlight(line || " ", { language: "yaml" }).value
                  }} />
                ) : (
                  line || " "
                )}
              </pre>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Diff view
  if (type === "diff") {
    if (!diff) return <div>No diff</div>

    return (
      <div className={cn(
        "flex",
        isYamlFile && "yaml-highlight yaml-diff",
        theme === 'dark' ? 'yaml-dark' : 'yaml-light'
      )}>
        <div className="flex-shrink-0">
          {diff.map((diffLine, index) => {
            const bgClass =
              diffLine.type === "added"
                ? "bg-green-50 dark:bg-green-900/20"
                : diffLine.type === "removed"
                  ? "bg-red-50 dark:bg-red-900/20"
                  : "bg-gray-50 dark:bg-gray-800/50"

            const oldLineDisplay = diffLine.oldLineNumber?.toString() || ""
            const newLineDisplay = diffLine.newLineNumber?.toString() || ""
            
            let lineNumberBgClass = ""
            let lineNumberTextClass = ""

            if (diffLine.type === "added") {
              lineNumberBgClass = "bg-green-100 dark:bg-green-900/40"
              lineNumberTextClass = "text-green-700 dark:text-green-300"
            } else if (diffLine.type === "removed") {
              lineNumberBgClass = "bg-red-100 dark:bg-red-900/40"
              lineNumberTextClass = "text-red-700 dark:text-red-300"
            } else {
              lineNumberBgClass = "bg-gray-100 dark:bg-gray-800"
              lineNumberTextClass = "text-gray-500 dark:text-gray-400"
            }

            return (
              <div key={index} className={cn("flex border-l-2", bgClass)}>
                <div
                  className={cn("w-6 sm:w-10 px-1 sm:px-2 py-1 text-xs sm:text-sm select-none diff-line-number", lineNumberBgClass, lineNumberTextClass)}
                >
                  {oldLineDisplay}
                </div>
                <div
                  className={cn("w-6 sm:w-10 px-1 sm:px-2 py-1 text-xs sm:text-sm select-none diff-line-number", lineNumberBgClass, lineNumberTextClass)}
                >
                  {newLineDisplay}
                </div>
              </div>
            )
          })}
        </div>
        <div className="flex-1 overflow-x-auto">
          {diff.map((diffLine, index) => {
            const bgClass =
              diffLine.type === "added"
                ? "bg-green-50 dark:bg-green-900/20 border-l-green-400"
                : diffLine.type === "removed"
                  ? "bg-red-50 dark:bg-red-900/20 border-l-red-400"
                  : "bg-gray-50 dark:bg-gray-800/50 border-l-gray-200 dark:border-l-gray-600"

            const textClass =
              diffLine.type === "added"
                ? "text-green-800 dark:text-green-400"
                : diffLine.type === "removed"
                  ? "text-red-800 dark:text-red-400"
                  : "text-gray-700 dark:text-gray-300"

            const prefix = diffLine.type === "added" ? "+" : diffLine.type === "removed" ? "-" : " "

            return (
              <div key={index} className={bgClass}>
                <pre className={cn("px-2 sm:px-4 py-1 font-mono text-xs sm:text-sm whitespace-pre min-w-max", textClass)}>
                  <span className="text-gray-400 mr-1 sm:mr-2 select-none w-3 sm:w-4 inline-block">{prefix}</span>
                  {isYamlFile ? (
                    <span 
                      dangerouslySetInnerHTML={{
                        __html: hljs.highlight(diffLine.content || " ", { language: "yaml" }).value
                      }} 
                    />
                  ) : (
                    <span>{diffLine.content || " "}</span>
                  )}
                </pre>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return null
}