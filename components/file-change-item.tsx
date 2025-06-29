"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ChevronDown, ChevronRight, Edit, Save, X, Undo2, FileText, FilePlus, FileX } from "lucide-react"
import { cn } from "@/lib/utils"
import { generateDiff, type FileChange } from "@/lib/diff"
import hljs from "highlight.js/lib/core"
import yaml from "highlight.js/lib/languages/yaml"
import { useTheme } from "@/components/theme-provider"
import { CopyButton } from "./copy-button"

interface FileChangeItemProps {
  fileChange: FileChange
  onUpdate: (id: string, content: string) => void
  onRevert: (id: string) => void
}

export function FileChangeItem({ fileChange, onUpdate, onRevert }: FileChangeItemProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(fileChange.content)
  const { actualTheme } = useTheme()

  // Initialize highlight.js for YAML
  useEffect(() => {
    hljs.registerLanguage("yaml", yaml)
  }, [])

  const getStatusConfig = (status: FileChange["status"]) => {
    switch (status) {
      case "created":
        return {
          icon: FilePlus,
          iconColor: "text-green-600 dark:text-green-400",
        }
      case "modified":
        return {
          icon: FileText,
          iconColor: "text-amber-600 dark:text-amber-400",
        }
      case "deleted":
        return {
          icon: FileX,
          iconColor: "text-red-600 dark:text-red-400",
        }
    }
  }

  const statusConfig = getStatusConfig(fileChange.status)
  const StatusIcon = statusConfig.icon

  const handleSave = () => {
    onUpdate(fileChange.id, editContent)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditContent(fileChange.content)
    setIsEditing(false)
  }

  const handleRevert = () => {
    onRevert(fileChange.id)
  }

  const diff = generateDiff(fileChange.previousContent, fileChange.content)

  const renderCodeWithLineNumbers = (content: string, type: "created" | "deleted" | "diff") => {
    const isYamlFile = fileChange.filename.endsWith('.yml') || fileChange.filename.endsWith('.yaml')
    
    if (type === "created") {
      return (
        <div className={cn(
          "bg-green-50 dark:bg-green-900/20",
          isYamlFile && "yaml-highlight yaml-created",
          actualTheme === 'dark' ? 'yaml-dark' : 'yaml-light'
        )}>
          {content.split("\n").map((line, index) => (
            <div key={index} className="flex border-l-2 border-l-green-400">
              <div className="w-6 sm:w-10 px-1 sm:px-2 py-1 text-xs sm:text-sm text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/40 select-none diff-line-number"></div>
              <div className="w-6 sm:w-10 px-1 sm:px-2 py-1 text-xs sm:text-sm text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/40 select-none diff-line-number">
                {index + 1}
              </div>
              <pre className="flex-1 px-2 sm:px-4 py-1 font-mono text-xs sm:text-sm text-green-800 dark:text-green-400 break-all sm:break-normal">
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
      )
    }

    if (type === "deleted") {
      return (
        <div className={cn(
          "bg-red-50 dark:bg-red-900/20",
          isYamlFile && "yaml-highlight yaml-deleted",
          actualTheme === 'dark' ? 'yaml-dark' : 'yaml-light'
        )}>
          {content.split("\n").map((line, index) => (
            <div key={index} className="flex border-l-2 border-l-red-400">
              <div className="w-6 sm:w-10 px-1 sm:px-2 py-1 text-xs sm:text-sm text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/40 select-none diff-line-number">
                {index + 1}
              </div>
              <div className="w-6 sm:w-10 px-1 sm:px-2 py-1 text-xs sm:text-sm text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/40 select-none diff-line-number"></div>
              <div className="flex-1 px-2 sm:px-4 py-1 font-mono text-xs sm:text-sm text-red-800 dark:text-red-400 break-all sm:break-normal">
                {isYamlFile ? (
                  <span dangerouslySetInnerHTML={{
                    __html: hljs.highlight(line || " ", { language: "yaml" }).value
                  }} />
                ) : (
                  line || " "
                )}
              </div>
            </div>
          ))}
        </div>
      )
    }

    // Diff view with improved algorithm
    return (
      <div className={cn(
        isYamlFile && "yaml-highlight yaml-diff",
        actualTheme === 'dark' ? 'yaml-dark' : 'yaml-light'
      )}>
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

          // Use the improved line numbers from the diff algorithm
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
              {/* 左侧行号列 - 旧行号 */}
              <div
                className={cn("w-6 sm:w-10 px-1 sm:px-2 py-1 text-xs sm:text-sm select-none diff-line-number", lineNumberBgClass, lineNumberTextClass)}
              >
                {oldLineDisplay}
              </div>
              {/* 右侧行号列 - 新行号 */}
              <div
                className={cn("w-6 sm:w-10 px-1 sm:px-2 py-1 text-xs sm:text-sm select-none diff-line-number", lineNumberBgClass, lineNumberTextClass)}
              >
                {newLineDisplay}
              </div>
              {/* 代码内容 */}
              <div className={cn("flex-1 px-2 sm:px-4 py-1 font-mono text-xs sm:text-sm", textClass)}>
                <span className="text-gray-400 mr-1 sm:mr-2 select-none w-3 sm:w-4 inline-block">{prefix}</span>
                {isYamlFile ? (
                  <span 
                    className="break-all sm:break-normal"
                    dangerouslySetInnerHTML={{
                      __html: hljs.highlight(diffLine.content || " ", { language: "yaml" }).value
                    }} 
                  />
                ) : (
                  <span className="break-all sm:break-normal">{diffLine.content || " "}</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <Card>
      <div className="cursor-pointer" onClick={() => !isEditing && setIsExpanded(!isExpanded)}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 space-y-2 sm:space-y-0">
          <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
            <div className="transition-transform duration-200 flex-shrink-0">
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-500" />
              )}
            </div>
            <div className="p-1 sm:p-1.5 flex-shrink-0">
              <StatusIcon className={cn("h-4 w-4 sm:h-5 sm:w-5", statusConfig.iconColor)} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2">
                <span className="font-mono text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {fileChange.filename}
                </span>
                <p className="text-xs text-gray-500 dark:text-gray-400 sm:mt-0">
                  {fileChange.timestamp.toLocaleString("zh-CN")}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-1 self-end sm:self-auto">
            {/* Copy button for created, deleted, and modified files */}
            {!isEditing && (
              <CopyButton
                content={fileChange.content}
                variant="ghost"
                className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                title={`复制${fileChange.status === 'modified' ? '新的' : ''}文件内容`}
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
              />
            )}
            {fileChange.status !== "deleted" && !isEditing && (
              <Button
                size="sm"
                variant="ghost"
                title="编辑"
                onClick={(e) => {
                  e.stopPropagation()
                  setIsEditing(true)
                }}
                className="h-7 w-7 sm:h-8 sm:w-8 p-0"
              >
                <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            )}
            {fileChange.canRevert !== false && (
              <Button
                size="sm"
                variant="ghost"
                title="放弃更改"
                onClick={(e) => {
                  e.stopPropagation()
                  handleRevert()
                }}
                className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-orange-600"
              >
                <Undo2 className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {isExpanded && (
        <CardContent className="pt-0 pb-3 px-3 sm:pb-4 sm:px-4">
          {isEditing ? (
            <div className="space-y-3">
              <div className={cn(
                "relative",
                "yaml-highlight",
                actualTheme === 'dark' ? 'yaml-dark' : 'yaml-light'
              )}>
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="font-mono text-sm min-h-[300px] resize-none"
                  placeholder="输入YAML内容..."
                />
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-end space-y-2 sm:space-y-0 sm:space-x-2">
                <Button size="sm" variant="outline" onClick={handleCancel} className="w-full sm:w-auto">
                  <X className="h-3 w-3 mr-1" />
                  取消
                </Button>
                <Button size="sm" onClick={handleSave} className="w-full sm:w-auto">
                  <Save className="h-3 w-3 mr-1" />
                  保存
                </Button>
              </div>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              {fileChange.status === "deleted"
                ? renderCodeWithLineNumbers(fileChange.content, "deleted")
                : fileChange.status === "created"
                  ? renderCodeWithLineNumbers(fileChange.content, "created")
                  : renderCodeWithLineNumbers(fileChange.content, "diff")}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}
