"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button, ButtonKbd } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  ChevronDown, 
  ChevronRight, 
  Edit, 
  Undo2, 
  FileText, 
  FilePlus, 
  FileX, 
  AlertCircle,
  Trash2,
  Loader2,
  Copy,
  Check
} from "lucide-react"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { generateDiff, type FileChange } from "@/lib/diff"
import hljs from "highlight.js/lib/core"
import yaml from "highlight.js/lib/languages/yaml"
import { useTheme } from "@/components/theme-provider"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { parse } from "yaml"
import { getFileDisplayInfo } from "@/lib/display-utils"
import { CodeRenderer } from "./code-renderer"
import { getStatusConfig } from "@/lib/file-status-icon"
import Link from "next/link"
import { TransparentButtonKbd } from "./ui/transparent-button-kbd"

interface FileListItemEnhancedProps {
  fileChange: FileChange
  onRevert?: (id: string) => void
  onDelete?: (id: string) => void
}

export function FileListItemEnhanced({ 
  fileChange, 
  onRevert,
  onDelete
}: FileListItemEnhancedProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showRevertDialog, setShowRevertDialog] = useState(false)
  const [isCopying, setIsCopying] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)
  const { actualTheme } = useTheme()

  // Initialize highlight.js for YAML
  useEffect(() => {
    hljs.registerLanguage("yaml", yaml)
  }, [])

  // Get the actual content
  const actualContent = useMemo(() => {
    return fileChange.content || ""
  }, [fileChange.content])



  // Parse YAML content to get display information
  const yamlData = useMemo(() => {
    if (actualContent) {
      try {
        return parse(actualContent)
      } catch (error) {
        console.error('Failed to parse YAML:', error)
        return null
      }
    }
    return null
  }, [actualContent])

  // Get display information using shared utility
  const displayInfo = getFileDisplayInfo(yamlData, fileChange.filename)

  // Check if file is older than 14 days
  const isFileExpired = () => {
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
    return fileChange.timestamp < fourteenDaysAgo
  }

  const statusConfig = getStatusConfig(fileChange.status)
  const StatusIcon = statusConfig.icon


  const handleRevert = () => {
    if (onRevert) {
      onRevert(fileChange.id)
    }
  }

  const handleDelete = () => {
    if (onDelete) {
      onDelete(fileChange.id)
    }
  }

  const handleCopyWithGeneration = async () => {
    setIsCopying(true)
    setCopySuccess(false)
    try {
      const contentToCopy = actualContent
      
      if (contentToCopy) {
        await navigator.clipboard.writeText(contentToCopy)
        setCopySuccess(true)
        // Reset success state after 2 seconds
        setTimeout(() => setCopySuccess(false), 2000)
      }
    } catch (error) {
      console.error('Failed to copy content:', error)
    } finally {
      setIsCopying(false)
    }
  }


  const diff = useMemo(() => {
    if (fileChange.previousContent && actualContent) {
      return generateDiff(fileChange.previousContent, actualContent)
    }
    return null
  }, [fileChange.previousContent, actualContent])

  return (
    <>
    <Card className={cn(
      "border",
      fileChange.status === 'created' && "border-green-500 dark:border-green-600",
      fileChange.status === 'modified' && "border-amber-500 dark:border-amber-600",
      fileChange.status === 'deleted' && "border-red-500 dark:border-red-600",
      fileChange.status === 'unchanged' && "border-border"
    )}>
      <div className="cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
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
              <StatusIcon className={cn(
                "h-4 w-4 sm:h-5 sm:w-5",
                fileChange.status === 'created' && "text-green-600 dark:text-green-400",
                fileChange.status === 'modified' && "text-amber-600 dark:text-amber-400",
                fileChange.status === 'deleted' && "text-red-600 dark:text-red-400",
                fileChange.status === 'unchanged' && "text-gray-600 dark:text-gray-400"
              )} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-col">
                <div className="flex items-center space-x-2">
                  <span 
                    className="font-medium text-sm sm:text-base text-gray-900 dark:text-gray-100 truncate select-text flex items-center cursor-text"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className={cn("mr-1", displayInfo.typeColor)}>{displayInfo.typeLabel}</span>
                    <span className="text-gray-400 dark:text-gray-500 mx-1">/</span>
                    <span>{displayInfo.title}</span>
                  </span>
                  {displayInfo.subtitle && (
                    <span 
                      className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate select-text cursor-text"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {displayInfo.subtitle}
                    </span>
                  )}
                  {fileChange.hasConflict && (
                    <TooltipProvider delayDuration={0}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge variant="destructive" className="flex items-center gap-1 px-2 py-0.5 min-w-[58px]">
                            <AlertCircle className="h-3 w-3" />
                            <span className="text-xs">冲突</span>
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p className="text-sm font-medium mb-1">检测到文件冲突</p>
                          <p className="text-xs text-muted-foreground">
                            {fileChange.conflictType === 'content' 
                              ? '该文件在元数据库中已存在，但您也有创建记录。请检查并解决冲突。'
                              : '该文件的删除记录与当前元数据库内容不匹配。文件可能已被更新。'
                            }
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  {isFileExpired() && fileChange.status !== "unchanged" && (
                    <TooltipProvider delayDuration={0}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge variant="destructive" className="flex items-center gap-1 px-2 py-0.5 min-w-[58px]">
                            <AlertCircle className="h-3 w-3" />
                            <span className="text-xs">过期</span>
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p className="text-sm font-medium mb-1">文件可能已过期</p>
                          <p className="text-xs text-muted-foreground">
                            该文件上传时间距离现在已经超过 14 天，上传的文件可能已被删除。
                            建议您重新上传文件以确保可用性。
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
                <span 
                  className="font-mono text-xs text-gray-500 dark:text-gray-400 select-text cursor-text"
                  onClick={(e) => e.stopPropagation()}
                >
                  {fileChange.filename}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-400 block sm:hidden cursor-text select-text" onClick={(e) => e.stopPropagation()}>
                {fileChange.status !== 'unchanged' && fileChange.timestamp.toLocaleString("zh-CN")}
            </p>
            <div className="flex items-center space-x-1 sm:space-x-2">
                <Button
                    size="sm"
                    variant="ghost"
                    title={`复制${fileChange.status === 'modified' ? '新的' : ''}文件内容`}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleCopyWithGeneration()
                    }}
                    disabled={isCopying}
                    className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                >
                    {isCopying ? (
                      <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                    ) : copySuccess ? (
                      <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                    ) : (
                      <Copy className="h-3 w-3 sm:h-4 sm:w-4" />
                    )}
                </Button>
                {fileChange.status !== "deleted" && (
                <Button
                    asChild
                    size="sm"
                    variant="ghost"
                    title="编辑"
                    className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                >
                  <Link href={`/edit/${fileChange.id}`} onClick={(e) => e.stopPropagation()}>
                    <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Link>
                </Button>
                )}
                {(onDelete || (fileChange.canRevert !== false && onRevert)) && (
                <Button
                    size="sm"
                    variant="ghost"
                    title={fileChange.status === 'unchanged' ? "删除" : "放弃更改"}
                    onClick={(e) => {
                    e.stopPropagation()
                    if (fileChange.status === 'unchanged') {
                      handleDelete()
                    } else {
                      setShowRevertDialog(true)
                    }
                    }}
                    className={cn(
                      "h-7 w-7 sm:h-8 sm:w-8 p-0",
                      fileChange.status === 'unchanged' ? "text-red-600" : "text-orange-600"
                    )}
                >
                    {fileChange.status === 'unchanged' ? (
                      <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                    ) : (
                      <Undo2 className="h-3 w-3 sm:h-4 sm:w-4" />
                    )}
                </Button>
                )}
            </div>
          </div>
        </div>
      </div>

      {isExpanded && actualContent && (
        <CardContent className="pt-0 pb-3 px-3 sm:pb-4 sm:px-4">
          <div className="border rounded-lg overflow-hidden">
            <CodeRenderer
              content={actualContent}
              type={fileChange.status === "deleted" ? "deleted" 
                    : fileChange.status === "created" ? "created"
                    : fileChange.status === "modified" ? "diff"
                    : fileChange.status === "unchanged" ? "unchanged"
                    : "created"}
              filename={fileChange.filename}
              actualTheme={actualTheme}
              diff={fileChange.status === "modified" && diff ? diff : undefined}
            />
          </div>
        </CardContent>
      )}
    </Card>

    {/* Revert confirmation dialog */}
    <Dialog open={showRevertDialog} onOpenChange={setShowRevertDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>确认放弃更改</DialogTitle>
          <DialogDescription>
            您确定要放弃对文件 {fileChange.filename} 的更改吗？此操作无法撤销。
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => setShowRevertDialog(false)}
          >
            取消
            <ButtonKbd>n</ButtonKbd>
          </Button>
          <Button 
            variant="destructive" 
            onClick={() => {
              handleRevert()
              setShowRevertDialog(false)
            }}
          >
            确认放弃
            <TransparentButtonKbd>y</TransparentButtonKbd>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </>
  )
}