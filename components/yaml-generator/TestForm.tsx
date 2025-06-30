import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label, LabelKbd } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X } from "lucide-react";
import { TestData } from "@/lib/types";
import { validateYear, validateYearRange } from "@/lib/validate";
import { CheckboxGroup } from "./CheckboxGroup";
import { CollegeMultiSelect } from "./CollegeMultiSelect";
import { CourseNameInput } from "./CourseNameInput";

interface TestFormProps {
  data: TestData;
  highlightedFields: string[];
  courseList: string[];
  setFormData: (data: any) => void;
  setHighlightedFields: React.Dispatch<React.SetStateAction<string[]>>;
}

export function TestForm({
  data,
  highlightedFields,
  courseList,
  setFormData,
  setHighlightedFields,
}: TestFormProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="school">
          学院
          <LabelKbd>s</LabelKbd>
        </Label>
        <CollegeMultiSelect
          id="school"
          selectedColleges={data.college?.filter((c) => c.trim()) || []}
          onCollegesChange={(colleges) =>
            setFormData((prev: any) => ({
              ...prev,
              data: { ...prev.data, college: colleges } as TestData,
            }))
          }
        />
        <p className="text-xs text-muted-foreground">
          只有确认该学院实际考过此试卷时才填写
        </p>
      </div>

      <div className="space-y-4">
        <Label>课程信息</Label>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="course-type">
              课程类型
              <LabelKbd>c</LabelKbd>
            </Label>
            <div className="flex gap-2">
              <Select
                value={data.course.type}
                onValueChange={(value) =>
                  setFormData((prev: any) => ({
                    ...prev,
                    data: {
                      ...prev.data,
                      course: {
                        ...(prev.data as TestData).course,
                        type: value,
                      },
                    } as TestData,
                  }))
                }
              >
                <SelectTrigger id="course-type">
                  <SelectValue placeholder="选择课程类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="本科">本科</SelectItem>
                  <SelectItem value="研究生">研究生</SelectItem>
                </SelectContent>
              </Select>
              {data.course.type && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    setFormData((prev: any) => ({
                      ...prev,
                      data: {
                        ...prev.data,
                        course: {
                          ...(prev.data as TestData).course,
                          type: "",
                        },
                      } as TestData,
                    }))
                  }
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-2" id="test-course-name">
            <Label htmlFor="course-name">
              课程名称 *
              <LabelKbd>t</LabelKbd>
            </Label>
            <CourseNameInput
              id="course-name"
              value={data.course.name}
              onChange={(value) => {
                setFormData((prev: any) => ({
                  ...prev,
                  data: {
                    ...prev.data,
                    course: {
                      ...(prev.data as TestData).course,
                      name: value,
                    },
                  } as TestData,
                }));
                // 清除高亮
                if (highlightedFields.includes('test-course-name')) {
                  setHighlightedFields(prev => prev.filter(field => field !== 'test-course-name'));
                }
              }}
              courseList={courseList}
              isHighlighted={highlightedFields.includes('test-course-name')}
            />
          </div>
        </div>
      </div>

      <div className="space-y-4" id="test-time-range">
        <Label>时间信息 *</Label>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="start-year">
              开始年份 *
              <LabelKbd>b</LabelKbd>
            </Label>
            <Input
              id="start-year"
              className={`text-sm ${
                (data.time.start && !validateYear(data.time.start)) || 
                highlightedFields.includes('test-time-range') 
                ? "border-red-500 ring-1 ring-red-500" : ""
              }`}
              type="number"
              step="1"
              min="2000"
              max={new Date().getFullYear()}
              placeholder="例如：2023"
              value={data.time.start}
              onChange={(e) => {
                setFormData((prev: any) => ({
                  ...prev,
                  data: {
                    ...prev.data,
                    time: {
                      ...(prev.data as TestData).time,
                      start: e.target.value,
                    },
                  } as TestData,
                }));
                // 清除高亮
                if (highlightedFields.includes('test-time-range')) {
                  setHighlightedFields(prev => prev.filter(field => field !== 'test-time-range'));
                }
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="end-year">
              结束年份 *
              <LabelKbd>e</LabelKbd>
            </Label>
            <Input
              id="end-year"
              className={`text-sm ${
                (data.time.end && !validateYear(data.time.end)) || 
                highlightedFields.includes('test-time-range') 
                ? "border-red-500 ring-1 ring-red-500" : ""
              }`}
              type="number"
              step="1"
              min="2000"
              max={new Date().getFullYear()}
              placeholder="例如：2024"
              value={data.time.end}
              onChange={(e) => {
                setFormData((prev: any) => ({
                  ...prev,
                  data: {
                    ...prev.data,
                    time: {
                      ...(prev.data as TestData).time,
                      end: e.target.value,
                    },
                  } as TestData,
                }));
                // 清除高亮
                if (highlightedFields.includes('test-time-range')) {
                  setHighlightedFields(prev => prev.filter(field => field !== 'test-time-range'));
                }
              }}
            />
          </div>
          

        {(() => {
          const yearValidation = validateYearRange(data.time.start, data.time.end);
          return !yearValidation.isValid && yearValidation.error && highlightedFields.includes('test-time-range') && (
            <p className="text-xs text-red-500 col-span-2">
              {yearValidation.error}
            </p>
          );
        })()}
          <div className="space-y-2">
            <Label htmlFor="semester">
              学期
              <LabelKbd>f</LabelKbd>
            </Label>
            <div className="flex gap-2">
              <Select
                value={data.time.semester}
                onValueChange={(value) =>
                  setFormData((prev: any) => ({
                    ...prev,
                    data: {
                      ...prev.data,
                      time: {
                        ...(prev.data as TestData).time,
                        semester: value,
                      },
                    } as TestData,
                  }))
                }
              >
                <SelectTrigger id="semester">
                  <SelectValue placeholder="选择学期" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="First">第一学期</SelectItem>
                  <SelectItem value="Second">第二学期</SelectItem>
                </SelectContent>
              </Select>
              {data.time.semester && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    setFormData((prev: any) => ({
                      ...prev,
                      data: {
                        ...prev.data,
                        time: {
                          ...(prev.data as TestData).time,
                          semester: "",
                        },
                      } as TestData,
                    }))
                  }
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="stage">
              考试阶段
              <LabelKbd>g</LabelKbd>
            </Label>
            <div className="flex gap-2">
              <Select
                value={data.time.stage}
                onValueChange={(value) =>
                  setFormData((prev: any) => ({
                    ...prev,
                    data: {
                      ...prev.data,
                      time: { ...(prev.data as TestData).time, stage: value },
                    } as TestData,
                  }))
                }
              >
                <SelectTrigger id="stage">
                  <SelectValue placeholder="选择考试阶段" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="期中">期中</SelectItem>
                  <SelectItem value="期末">期末</SelectItem>
                </SelectContent>
              </Select>
              {data.time.stage && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    setFormData((prev: any) => ({
                      ...prev,
                      data: {
                        ...prev.data,
                        time: { ...(prev.data as TestData).time, stage: "" },
                      } as TestData,
                    }))
                  }
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2" id="test-content">
        <Label htmlFor="test-content">
          内容类型 *
          <LabelKbd>h</LabelKbd>
        </Label>
        <CheckboxGroup
          id="test-content"
          options={["原题", "答案"]}
          selectedValues={data.content}
          onChange={(newContent: string[]) => {
            setFormData((prev: any) => ({
              ...prev,
              data: {
                ...prev.data,
                content: newContent,
              } as TestData,
            }));
            // 清除高亮
            if (highlightedFields.includes('test-content')) {
              setHighlightedFields(prev => prev.filter(field => field !== 'test-content'));
            }
          }}
          isHighlighted={highlightedFields.includes('test-content')}
        />
        <p className="text-xs text-muted-foreground">至少选择一项</p>
      </div>
    </div>
  );
}