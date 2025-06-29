"use client"

import { Button, ButtonKbd } from "@/components/ui/button"
import { 
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CheckCircle, ExternalLink } from "lucide-react"
import Link from "next/link"

interface PrSuccessDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  prUrl: string | null
  onClose: () => void
}

export function PrSuccessDialog({ open, onOpenChange, prUrl, onClose }: PrSuccessDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-green-600 dark:text-green-400">
            <CheckCircle className="h-5 w-5" />
            <span>Pull Request 创建成功</span>
          </DialogTitle>
        </DialogHeader>
        <div>
          {prUrl && (
            <>
              <p className="flex flex-row">
                您的更改已成功提交，
                  <Link href={prUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 hover:underline mx-1 flex flex-row items-center">
                  Pull Request
                  <ExternalLink className="h-3 w-3 flex-shrink-0 mx-1" />
                  </Link>
                已创建。
              </p>
            </>
          )}
        </div>
        <DialogFooter className="gap-2">
          <Button 
            variant="outline" 
            onClick={onClose}
          >
            关闭
            <ButtonKbd>d</ButtonKbd>
          </Button>
          <Button 
            onClick={() => {
              if (prUrl) {
                window.open(prUrl, '_blank', 'noopener,noreferrer')
              }
            }}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            查看 Pull Request
            <ButtonKbd className="dark:bg-white/10 bg-white/10 dark:text-white/70 text-white/70 dark:border-white/40 border-white/40">o</ButtonKbd>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}