import { Button, ButtonKbd } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X as CloseIcon } from "lucide-react";
import { FileType } from "@/lib/types";
import { useEffect } from "react";

interface PreviewOverlayProps {
  showPreview: boolean;
  uploadedFile: File | null;
  blobUrl: string;
  fileType: FileType;
  setShowPreview: (show: boolean) => void;
  setPreviousStep: (step: number) => void;
  setStep: (step: number) => void;
  step: number;
  validateStep3: () => boolean;
  setHighlightedFields: (fields: string[]) => void;
  setHasDownloaded: (downloaded: boolean) => void;
  getHighlightedFieldIds: () => string[];
  children?: React.ReactNode;
}

export function PreviewOverlay({
  showPreview,
  uploadedFile,
  blobUrl,
  fileType,
  setShowPreview,
  setPreviousStep,
  setStep,
  step,
  validateStep3,
  setHighlightedFields,
  setHasDownloaded,
  getHighlightedFieldIds,
  children,
}: PreviewOverlayProps) {
  useEffect(() => {
    if (!showPreview) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Skip if user is typing in an input field
      const activeElement = document.activeElement as HTMLElement;
      const isInputField = activeElement && (
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.contentEditable === 'true'
      );

      if (!isInputField) {
        if (event.ctrlKey || event.metaKey || event.altKey) {
          return;
        }
        
        const previewFormPanel = document.getElementById('preview-form-panel');
        if (previewFormPanel) {
          if (event.key === 'j') {
            previewFormPanel.scrollBy({ top: 300, behavior: 'smooth' });
            event.preventDefault();
          } else if (event.key === 'k') {
            previewFormPanel.scrollBy({ top: -300, behavior: 'smooth' });
            event.preventDefault();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showPreview]);

  if (!showPreview || !uploadedFile || !blobUrl) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowPreview(false)}
        className="absolute right-8 top-4 z-10"
        title="关闭预览"
      >
        <CloseIcon className="w-4 h-4" />
        <ButtonKbd>l</ButtonKbd>
      </Button>
      
      <div className="flex h-full">
        <div className="flex-1 h-full">
          <iframe
            src={`${blobUrl}#toolbar=1&navpanes=0&scrollbar=1`}
            className="w-full h-full border-0"
            title="PDF预览"
          />
        </div>
        
        <div id="preview-form-panel" className="w-1/2 h-full overflow-y-auto border-l bg-card">
          <div className="p-8">
            <div className="text-center space-y-2 mb-6">
              <h2 className="text-2xl font-bold">详细信息</h2>
              <p className="text-muted-foreground">
                填写
                {fileType === "book" ? "书籍" : fileType === "test" ? "试题" : "资料"}
                的详细信息
              </p>
              <Badge variant="outline">
                {fileType === "book" ? "书籍" : fileType === "test" ? "试题" : "资料"}
              </Badge>
            </div>
            
            {children}
            
            <div className="space-y-4 mt-6">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => {
                    setPreviousStep(step);
                    setStep(2);
                  }}>
                    上一步
                    <ButtonKbd>z</ButtonKbd>
                  </Button>
                  <Button onClick={() => {
                    if (validateStep3()) {
                      setHighlightedFields([]);
                      setHasDownloaded(false);
                      setStep(4);
                    } else {
                      const highlightIds = getHighlightedFieldIds();
                      setHighlightedFields(highlightIds);
                      if (highlightIds.length > 0) {
                        setTimeout(() => {
                          const firstHighlightedElement = document.getElementById(highlightIds[0]);
                          if (firstHighlightedElement) {
                            firstHighlightedElement.scrollIntoView({ 
                              behavior: 'smooth', 
                              block: 'center' 
                            });
                            if (firstHighlightedElement instanceof HTMLInputElement || 
                                firstHighlightedElement instanceof HTMLTextAreaElement) {
                              firstHighlightedElement.focus();
                            } else {
                              const inputElement = firstHighlightedElement.querySelector('input, textarea') as HTMLInputElement | HTMLTextAreaElement;
                              if (inputElement) {
                                inputElement.focus();
                              }
                            }
                          }
                        }, 100);
                      }
                    }
                  }}>
                    下一步：预览和提交
                    <ButtonKbd invert={true}>x</ButtonKbd>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}