import { Button, ButtonKbd } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileType, BookData, TestData, DocData } from "@/lib/types";
import { BookForm } from "./BookForm";
import { TestForm } from "./TestForm";
import { DocForm } from "./DocForm";

interface Step3Props {
  fileType: FileType;
  formData: any;
  courseList: string[];
  highlightedFields: string[];
  setFormData: (data: any) => void;
  setHighlightedFields: React.Dispatch<React.SetStateAction<string[]>>;
  updateArrayItem: (field: string, index: number, value: string, subField?: string) => void;
  removeArrayItem: (field: string, index: number, subField?: string) => void;
  addArrayItem: (field: string, subField?: string) => void;
  validateStep3: () => boolean;
  getHighlightedFieldIds: () => string[];
  setStep: (step: number) => void;
  setPreviousStep: (step: number) => void;
  setHasDownloaded: (downloaded: boolean) => void;
  step: number;
}

export function Step3({
  fileType,
  formData,
  courseList,
  highlightedFields,
  setFormData,
  setHighlightedFields,
  updateArrayItem,
  removeArrayItem,
  addArrayItem,
  validateStep3,
  getHighlightedFieldIds,
  setStep,
  setPreviousStep,
  setHasDownloaded,
  step,
}: Step3Props) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
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

      {fileType === "book" && (
        <BookForm
          data={formData.data as BookData}
          highlightedFields={highlightedFields}
          setFormData={setFormData}
          setHighlightedFields={setHighlightedFields}
          updateArrayItem={updateArrayItem}
          removeArrayItem={removeArrayItem}
          addArrayItem={addArrayItem}
        />
      )}
      
      {fileType === "test" && (
        <TestForm
          data={formData.data as TestData}
          highlightedFields={highlightedFields}
          courseList={courseList}
          setFormData={setFormData}
          setHighlightedFields={setHighlightedFields}
        />
      )}
      
      {fileType === "doc" && (
        <DocForm
          data={formData.data as DocData}
          highlightedFields={highlightedFields}
          courseList={courseList}
          setFormData={setFormData}
          setHighlightedFields={setHighlightedFields}
        />
      )}

      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => {
              setPreviousStep(step); // 防止触发自动focus
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
                // 滚动到第一个高亮字段并聚焦
                if (highlightIds.length > 0) {
                  setTimeout(() => {
                    const firstHighlightedElement = document.getElementById(highlightIds[0]);
                    if (firstHighlightedElement) {
                      firstHighlightedElement.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'center' 
                      });
                      // 如果是输入框，则focus它
                      if (firstHighlightedElement instanceof HTMLInputElement || 
                          firstHighlightedElement instanceof HTMLTextAreaElement) {
                        firstHighlightedElement.focus();
                      } else {
                        // 如果是其他元素，尝试找到其中的输入框
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
  );
}