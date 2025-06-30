import { Button, ButtonKbd } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label, LabelKbd } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, X } from "lucide-react";
import { DocData } from "@/lib/types";
import { CheckboxGroup } from "./CheckboxGroup";
import { CourseNameInput } from "./CourseNameInput";

interface DocFormProps {
  data: DocData;
  highlightedFields: string[];
  courseList: string[];
  setFormData: (data: any) => void;
  setHighlightedFields: React.Dispatch<React.SetStateAction<string[]>>;
}

export function DocForm({
  data,
  highlightedFields,
  courseList,
  setFormData,
  setHighlightedFields,
}: DocFormProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2" id="doc-title-div">
        <Label htmlFor="doc-title">
          资料标题 *
          <LabelKbd>t</LabelKbd>
        </Label>
        <Input
          id="doc-title"
          className={`text-sm ${highlightedFields.includes('doc-title') ? 'border-red-500 ring-1 ring-red-500' : ''}`}
          placeholder="例如：工程制图习题解答"
          value={data.title}
          onChange={(e) => {
            setFormData((prev: any) => ({
              ...prev,
              data: { ...prev.data, title: e.target.value } as DocData,
            }));
            // 清除高亮
            if (highlightedFields.includes('doc-title')) {
              setHighlightedFields(prev => prev.filter(field => field !== 'doc-title'));
            }
          }}
        />
        <p className="text-xs text-muted-foreground">
          请自行总结一个合适的标题
        </p>
      </div>

      <div className="space-y-2" id="doc-course">
        <Label>课程信息 *</Label>
        <div className="space-y-4">
          {data.course.map((course, index) => (
            <Card key={index} className="p-4" data-course-index={index}>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">课程 {index + 1}</h4>
                  {data.course.length > 1 && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() =>
                        setFormData((prev: any) => ({
                          ...prev,
                          data: {
                            ...prev.data,
                            course: (prev.data as DocData).course.filter(
                              (_, i) => i !== index
                            ),
                          } as DocData,
                        }))
                      }
                    >
                      <Trash2 className="w-4 h-4" />
                      <ButtonKbd
                        className="text-muted/80 dark:text-muted-foreground bg-white/10 dark:bg-white/5 border-white/20 dark:border-white/10"
                      >
                        {"d" + (index + 1).toString()}
                      </ButtonKbd>
                    </Button>
                  )}
                </div>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor={`course-type-${index}`}>
                      课程类型
                      {data.course.length == 1 && <LabelKbd>{"e"}</LabelKbd>}
                      {data.course.length > 1 && index < 9 && <LabelKbd>{"e" + (index + 1).toString()}</LabelKbd>}
                    </Label>
                    <div className="flex gap-2">
                      <Select
                        value={course.type}
                        onValueChange={(value) =>
                          setFormData((prev: any) => ({
                            ...prev,
                            data: {
                              ...prev.data,
                              course: (prev.data as DocData).course.map((c, i) =>
                                i === index ? { ...c, type: value } : c
                              ),
                            } as DocData,
                          }))
                        }
                      >
                        <SelectTrigger id={`course-type-${index}`}>
                          <SelectValue placeholder="选择课程类型" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="本科">本科</SelectItem>
                          <SelectItem value="研究生">研究生</SelectItem>
                        </SelectContent>
                      </Select>
                      {course.type && (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() =>
                            setFormData((prev: any) => ({
                              ...prev,
                              data: {
                                ...prev.data,
                                course: (prev.data as DocData).course.map(
                                  (c, i) => (i === index ? { ...c, type: "" } : c)
                                ),
                              } as DocData,
                            }))
                          }
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`course-name-${index}`}>
                      课程名称 *
                      {data.course.length == 1 && <LabelKbd>{"n"}</LabelKbd>}
                      {data.course.length > 1 && index < 9 && <LabelKbd>{"n" + (index + 1).toString()}</LabelKbd>}
                    </Label>
                    <CourseNameInput
                      id={`course-name-${index}`}
                      value={course.name}
                      onChange={(value) => {
                        setFormData((prev: any) => ({
                          ...prev,
                          data: {
                            ...prev.data,
                            course: (prev.data as DocData).course.map((c, i) =>
                              i === index ? { ...c, name: value } : c
                            ),
                          } as DocData,
                        }));
                        // 清除高亮
                        if (highlightedFields.includes('doc-course')) {
                          setHighlightedFields(prev => prev.filter(field => field !== 'doc-course'));
                        }
                      }}
                      courseList={courseList}
                      isHighlighted={highlightedFields.includes('doc-course')}
                    />
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setFormData((prev: any) => {
              const currentCourses = (prev.data as DocData).course;
              const newIndex = currentCourses.length;
              
              // 延迟聚焦到新课程的课程类型下拉框
              setTimeout(() => {
                const selectElement = document.querySelector(`[data-course-index="${newIndex}"] [role="combobox"]`) as HTMLElement;
                if (selectElement) {
                  selectElement.focus();
                }
              }, 100);
              
              return {
                ...prev,
                data: {
                  ...prev.data,
                  course: [
                    ...currentCourses,
                    { type: "", name: "" },
                  ],
                } as DocData,
              };
            });
          }}
          className="w-full"
        >
          <Plus className="w-4 h-4 mr-2" />
          添加课程
          <ButtonKbd>c</ButtonKbd>
        </Button>
      </div>

      <div className="space-y-2" id="doc-content">
        <Label htmlFor="doc-content">
          内容类型 *
          <LabelKbd>h</LabelKbd>
        </Label>
        <CheckboxGroup
          id="doc-content"
          options={["思维导图", "题库", "答案", "知识点", "课件"]}
          selectedValues={data.content}
          onChange={(newContent: string[]) => {
            setFormData((prev: any) => ({
              ...prev,
              data: {
                ...prev.data,
                content: newContent,
              } as DocData,
            }));
            // 清除高亮
            if (highlightedFields.includes('doc-content')) {
              setHighlightedFields(prev => prev.filter(field => field !== 'doc-content'));
            }
          }}
          isHighlighted={highlightedFields.includes('doc-content')}
        />
        <p className="text-xs text-muted-foreground">至少选择一项</p>
      </div>
    </div>
  );
}