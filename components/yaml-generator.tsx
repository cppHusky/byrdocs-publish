"use client";

import { useState, useEffect } from "react";
import hljs from "highlight.js/lib/core";
import yaml from "highlight.js/lib/languages/yaml";
import { Button, ButtonKbd, ShortcutProvider } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";
import {
  Download,
  FileText,
  BookOpen,
  ClipboardList,
  Plus,
  Trash2,
  RotateCcw,
  Copy,
  Keyboard,
  Upload as UploadIcon,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Check, X } from "lucide-react";
import { CheckboxGroup } from "./yaml-generator/CheckboxGroup";
import { CollegeMultiSelect } from "./yaml-generator/CollegeMultiSelect";
import { CourseNameInput } from "./yaml-generator/CourseNameInput";
import FileUpload from "./file-upload";
import { extractFileTypeFromURL, extractMD5FromURL, validateURLFileType, validateYear, validateYearRange } from "@/lib/validate";
import { BookData, DocData, FileType, TestData, FormData } from "@/lib/types";
import { generateYaml } from "@/lib/yaml";
import { validateISBN, formatISBN } from "@/lib/isbn";
import { useTheme } from "./theme-provider";


export default function YamlGenerator() {
  const { actualTheme } = useTheme();
  // 课程列表状态
  const [courseList, setCourseList] = useState<string[]>([]);

  // 初始化 highlight.js 和获取课程数据
  useEffect(() => {
    hljs.registerLanguage("yaml", yaml);
    
    // 获取课程数据
    const fetchCourseData = async () => {
      try {
        const response = await fetch('https://files.byrdocs.org/metadata2.json');
        const data = await response.json();
        
        // 提取所有课程名称
        const courses = new Set<string>();
        data.forEach((item: any) => {
          if (item.data?.course) {
            if (Array.isArray(item.data.course)) {
              // 处理数组形式的课程
              item.data.course.forEach((course: any) => {
                if (course.name && course.name.trim()) {
                  courses.add(course.name.trim());
                }
              });
            } else if (item.data.course.name && item.data.course.name.trim()) {
              // 处理单个课程对象
              courses.add(item.data.course.name.trim());
            }
          }
        });
        
        setCourseList(Array.from(courses).sort());
      } catch (error) {
        console.error('Failed to fetch course data:', error);
      }
    };
    
    fetchCourseData();
  }, []);

  const [step, setStep] = useState(1);
  const [fileType, setFileType] = useState<FileType>("book");
  const [urlValidationError, setUrlValidationError] = useState<string>("");
  const [hasDownloaded, setHasDownloaded] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [highlightedFields, setHighlightedFields] = useState<string[]>([]);
  const [selectedTypeIndex, setSelectedTypeIndex] = useState(0); // 用于键盘选择文件类型
  const [previousStep, setPreviousStep] = useState(1); // 跟踪上一个步骤
  const [showShortcuts, setShowShortcuts] = useState(false); // 快捷键帮助弹窗
  const [inputMethod, setInputMethod] = useState<'url' | 'upload'>('upload'); // 输入方式选择，默认上传文件
  const [uploadedFileInfo, setUploadedFileInfo] = useState<{ name: string; size: number } | null>(null); // 保存上传文件信息
  const [formData, setFormData] = useState<FormData>({
    id: "",
    url: "",
    type: "book",
    data: {
      title: "",
      authors: [""],
      translators: [],
      edition: "",
      publisher: "",
      publish_year: "",
      isbn: [""],
      filetype: "pdf",
    } as BookData,
  });

  const downloadYaml = () => {
    const yamlContent = generateYaml(fileType, formData);
    const blob = new Blob([yamlContent], { type: "text/yaml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${formData.id || "metadata"}.yml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // 设置已下载状态
    setHasDownloaded(true);
  };

  const createNewMetadata = () => {
    // 重置所有状态
    setStep(1);
    setUrlValidationError("");
    resetFormCompletely("book");
  };

  const resetFormCompletely = (type: FileType) => {
    setFileType(type);
    setUrlValidationError(""); // 清除验证错误
    setInputMethod('upload'); // 重置为上传文件方式
    setUploadedFileInfo(null); // 清除上传文件信息
    // 同步键盘选择索引
    const typeIndex = type === "book" ? 0 : type === "test" ? 1 : 2;
    setSelectedTypeIndex(typeIndex);
    let initialData: BookData | TestData | DocData;

    if (type === "book") {
      initialData = {
        title: "",
        authors: [""],
        translators: [],
        edition: "",
        publisher: "",
        publish_year: "",
        isbn: [""],
        filetype: "pdf",
      } as BookData;
    } else if (type === "test") {
      initialData = {
        college: [""],
        course: { type: "", name: "" },
        time: { start: "", end: "", semester: "", stage: "" },
        filetype: "pdf",
        content: [],
      } as TestData;
    } else {
      initialData = {
        title: "",
        filetype: "pdf",
        course: [{ type: "", name: "" }],
        content: [],
      } as DocData;
    }

    // 完全重置所有数据，包括URL和ID
    setFormData({
      id: "",
      url: "",
      type,
      data: initialData,
    });
  };

  const copyYamlToClipboard = async () => {
    try {
      const yamlContent = generateYaml(fileType, formData);
      await navigator.clipboard.writeText(yamlContent);
      setIsCopied(true);
      
      // 2秒后重置复制状态
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy YAML content:', err);
    }
  };

  const addArrayItem = (field: string, subField?: string) => {
    setFormData((prev) => {
      let newData;
      let newIndex;
      
      if (subField) {
        // @ts-ignore
        const currentArray = prev.data[field][subField];
        newIndex = currentArray.length;
        newData = {
          ...prev,
          data: {
            ...prev.data,
            [field]: {
              // @ts-ignore
              ...prev.data[field],
              [subField]: [...currentArray, ""]
            }
          }
        };
      } else {
        // @ts-ignore
        const currentArray = prev.data[field];
        newIndex = currentArray.length;
        newData = {
          ...prev,
          data: {
            ...prev.data,
            [field]: [...currentArray, ""]
          }
        };
      }
      
      // 延迟聚焦到新添加的输入框
      setTimeout(() => {
        const inputId = `${field}-${newIndex}`;
        const inputElement = document.getElementById(inputId);
        if (inputElement) {
          inputElement.focus();
        }
      }, 100);
      
      return newData;
    });
  };

  const removeArrayItem = (field: string, index: number, subField?: string) => {
    setFormData((prev) => {
      if (subField) {
        // @ts-ignore
        const currentArray = prev.data[field][subField];
        return {
          ...prev,
          data: {
            ...prev.data,
            [field]: {
              // @ts-ignore
              ...prev.data[field],
              [subField]: currentArray.filter((_: any, i: number) => i !== index)
            }
          }
        };
      } else {
        // @ts-ignore
        const currentArray = prev.data[field];
        return {
          ...prev,
          data: {
            ...prev.data,
            [field]: currentArray.filter((_: any, i: number) => i !== index)
          }
        };
      }
    });
  };

  const updateArrayItem = (
    field: string,
    index: number,
    value: string,
    subField?: string
  ) => {
    setFormData((prev) => {
      if (subField) {
        // @ts-ignore
        const currentArray = [...prev.data[field][subField]];
        currentArray[index] = value;
        return {
          ...prev,
          data: {
            ...prev.data,
            [field]: {
              // @ts-ignore
              ...prev.data[field],
              [subField]: currentArray
            }
          }
        };
      } else {
        // @ts-ignore
        const currentArray = [...prev.data[field]];
        currentArray[index] = value;
        return {
          ...prev,
          data: {
            ...prev.data,
            [field]: currentArray
          }
        };
      }
    });
  };

  const resetForm = (type: FileType) => {
    setFileType(type);
    setUrlValidationError(""); // 清除验证错误
    
    // 同步键盘选择索引
    const typeIndex = type === "book" ? 0 : type === "test" ? 1 : 2;
    setSelectedTypeIndex(typeIndex);
    let initialData: BookData | TestData | DocData;

    if (type === "book") {
      initialData = {
        title: "",
        authors: [""],
        translators: [],
        edition: "",
        publisher: "",
        publish_year: "",
        isbn: [""],
        filetype: "pdf",
      } as BookData;
    } else if (type === "test") {
      initialData = {
        college: [""],
        course: { type: "", name: "" },
        time: { start: "", end: "", semester: "", stage: "" },
        filetype: "pdf",
        content: [],
      } as TestData;
    } else {
      initialData = {
        title: "",
        filetype: "pdf",
        course: [{ type: "", name: "" }],
        content: [],
      } as DocData;
    }

    // 保持URL和ID不变，只重置data部分
    setFormData((prev) => ({
      ...prev,
      type,
      data: initialData,
    }));
  };

  // 验证步骤2
  const validateStep2 = (): boolean => {
    if (!formData.id || !formData.url) {
      return false;
    }
    
    // 检查URL格式是否有效
    const validation = validateURLFileType(formData.url, fileType);
    return validation.isValid;
  };

  // 验证步骤3
  const validateStep3 = (): boolean => {
    if (fileType === "book") {
      const data = formData.data as BookData;
      const hasValidISBN = data.isbn.some(
        (isbn) => isbn.trim() && validateISBN(isbn)
      );
      
      // 验证出版年份
      const isValidYear = !data.publish_year || validateYear(data.publish_year);
      
      return !!(
        data.title &&
        data.authors.some((a) => a.trim()) &&
        hasValidISBN &&
        isValidYear
      );
    } else if (fileType === "test") {
      const data = formData.data as TestData;
      
      // 验证年份范围（年份不是必填的）
      const yearValidation = validateYearRange(data.time.start, data.time.end);
      
      return !!(
        data.course.name &&
        data.content.length > 0 &&
        yearValidation.isValid
      );
    } else if (fileType === "doc") {
      const data = formData.data as DocData;
      return !!(
        data.title &&
        data.course.every((c) => c.name.trim()) &&
        data.content.length > 0
      );
    }
    return false;
  };

  // 获取需要高亮的字段ID
  const getHighlightedFieldIds = (): string[] => {
    const fieldIds: string[] = [];
    
    if (fileType === "book") {
      const data = formData.data as BookData;
      
      if (!data.title) {
        fieldIds.push("book-title");
      }
      
      if (!data.authors.some((a) => a.trim())) {
        fieldIds.push("book-authors");
      }
      
      const hasValidISBN = data.isbn.some(
        (isbn) => isbn.trim() && validateISBN(isbn)
      );
      if (!hasValidISBN) {
        fieldIds.push("book-isbn");
      }
      
      if (data.publish_year && !validateYear(data.publish_year)) {
        fieldIds.push("book-publish-year");
      }
    } else if (fileType === "test") {
      const data = formData.data as TestData;
      
      if (!data.course.name) {
        fieldIds.push("test-course-name");
      }
      
      if (data.content.length === 0) {
        fieldIds.push("test-content");
      }
      
      const yearValidation = validateYearRange(data.time.start, data.time.end);
      if (!yearValidation.isValid) {
        fieldIds.push("test-time-range");
      }
    } else if (fileType === "doc") {
      const data = formData.data as DocData;
      
      if (!data.title) {
        fieldIds.push("doc-title");
      }
      
      if (!data.course.every((c) => c.name.trim())) {
        fieldIds.push("doc-course");
      }
      
      if (data.content.length === 0) {
        fieldIds.push("doc-content");
      }
    }
    
    return fieldIds;
  };

  // 键盘快捷键处理
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 检测操作系统并使用相应的修饰键
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      // 全局页面切换快捷键 (Cmd/Ctrl + 左/右箭头，第三页使用 Cmd/Ctrl + >)
      if (cmdOrCtrl && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        e.preventDefault();
        
        if (e.key === 'ArrowLeft' && step > 1) {
          // 向前翻页（不触发自动focus）
          const newStep = step - 1;
          setPreviousStep(step); // 设置为当前步骤，这样不会触发自动focus
          setStep(newStep);
        } else if ((e.key === 'ArrowRight' && step <= 3)) {
          // 向后翻页，需要验证当前页面
          if (step === 1) {
            // 使用当前选中的类型
            const fileTypes: FileType[] = ['book', 'test', 'doc'];
            resetForm(fileTypes[selectedTypeIndex]);
            setStep(2);
          } else if (step === 2 && validateStep2()) {
            setStep(3);
          } else if (step === 3 && validateStep3()) {
            setHighlightedFields([]);
            setStep(4);
          } else if (step === 3) {
            // 第三页验证失败时，高亮未填项并focus第一个
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
        }
        return;
      }

      // 检查是否在特殊组件中（下拉框、弹窗等），如果是则不处理全局快捷键
      const isInSpecialComponent = (
        e.target instanceof HTMLButtonElement ||
        (e.target as Element)?.closest('[role="combobox"]') ||
        (e.target as Element)?.closest('[role="listbox"]') ||
        (e.target as Element)?.closest('[role="option"]') ||
        (e.target as Element)?.closest('[data-radix-popper-content-wrapper]') ||
        (e.target as Element)?.closest('[cmdk-root]') ||
        (e.target as Element)?.closest('.popover-content')
      );

      // 如果用户正在输入框中输入，处理特定的快捷键
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        // 第二页：URL输入框回车进入下一步
        if (step === 2 && e.key === 'Enter') {
          e.preventDefault();
          if (validateStep2()) {
            setStep(3);
          }
          return;
        }

        // 第四页：按回车下载文件或创建新的元信息
        if (step === 4 && e.key === 'Enter') {
          e.preventDefault();
          if (!hasDownloaded) {
            downloadYaml();
          } else {
            createNewMetadata();
          }
          return;
        }
        
        // 对于输入框，只阻止 Enter 键，其他全局快捷键仍然有效
        if (e.key === 'Enter') {
          return;
        }
      }

      // 第一页：方向键选择文件类型
      if (step === 1) {
        const fileTypes: FileType[] = ['book', 'test', 'doc'];
        
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedTypeIndex(prev => prev > 0 ? prev - 1 : fileTypes.length - 1);
        } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedTypeIndex(prev => prev < fileTypes.length - 1 ? prev + 1 : 0);
        } else if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          resetForm(fileTypes[selectedTypeIndex]);
          setStep(2);
        }
      }



      // 第四页：按回车下载文件或创建新的元信息（但不在特殊组件中时）
      if (step === 4 && e.key === 'Enter' && !isInSpecialComponent) {
        if (!hasDownloaded) {
          downloadYaml();
        } else {
          createNewMetadata();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [step, selectedTypeIndex, validateStep2, validateStep3, getHighlightedFieldIds, resetForm, setHighlightedFields, setStep, downloadYaml, createNewMetadata, hasDownloaded]);

  // 处理步骤变化和自动focus
  useEffect(() => {
    // 只有当步骤向前进时才自动focus（进入新页面）
    if (step > previousStep) {
      setTimeout(() => {
        let elementToFocus: HTMLElement | null = null;
        
        if (step === 2) {
          // 第二页：不自动focus，因为默认是上传文件模式
          return; // 提前返回，避免下面的通用focus逻辑
        } else if (step === 3) {
          // 第三页：根据文件类型focus第一个输入框，但只有当该元素为空时才focus
          if (fileType === 'book') {
            elementToFocus = document.getElementById('title');
            if (elementToFocus && elementToFocus instanceof HTMLInputElement && (formData.data as BookData).title?.trim()) {
              elementToFocus = null; // 如果已有内容，不focus
            }
          } else if (fileType === 'test') {
            // 试题页面：focus到学院下拉框（但不触发下拉），只有当学院为空时才focus
            const collegeMultiSelect = document.querySelector('[data-testid="college-multiselect"] [role="combobox"]') as HTMLElement;
            if (collegeMultiSelect && (formData.data as TestData).college?.length > 0) {
              elementToFocus = null; // 如果已选择学院，不focus
            } else {
              elementToFocus = collegeMultiSelect;
            }
          } else if (fileType === 'doc') {
            elementToFocus = document.getElementById('doc-title');
            if (elementToFocus && elementToFocus instanceof HTMLInputElement && (formData.data as DocData).title?.trim()) {
              elementToFocus = null; // 如果已有内容，不focus
            }
          }
        }
        
        if (elementToFocus) {
          elementToFocus.focus();
        }
      }, 100); // 延迟一点确保DOM已更新
    }
    
    setPreviousStep(step);
  }, [step, previousStep, fileType, formData.url]);

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">选择文件类型</h2>
        <p className="text-muted-foreground">
          请根据您要上传的文件选择对应的类型
        </p>
      </div>

      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
        <Card
          className={`cursor-pointer transition-all hover:shadow-md ${
            selectedTypeIndex === 0 ? "ring-2 ring-primary" : ""
          }`}
          onClick={() => {
            setSelectedTypeIndex(0);
            resetForm("book");
          }}
        >
          <CardHeader className="text-center pb-3 sm:pb-6 relative">
            <BookOpen className="w-8 h-8 sm:w-12 sm:h-12 mx-auto text-blue-500 dark:text-blue-400" />
            <CardTitle className="text-base sm:text-lg">书籍 (Book)</CardTitle>
            <Button
              className="absolute top-0 right-0 pointer-events-none"
              variant="ghost"
              onClick={() => {
                setSelectedTypeIndex(0);
                resetForm("book");
              }}
            >
              <ButtonKbd>1</ButtonKbd>
            </Button>
          </CardHeader>
          <CardContent className="pt-0">
            <CardDescription className="text-sm mb-2 sm:mb-3">
              正式出版的教育类PDF电子书籍
            </CardDescription>
            <div className="hidden sm:block space-y-1 text-xs text-muted-foreground">
              <div>• 必须是PDF格式</div>
              <div>• 正式出版物</div>
              <div>• 教育资源</div>
            </div>
            <div className="sm:hidden flex flex-wrap gap-1 text-xs text-muted-foreground">
              <span className="bg-muted px-2 py-1 rounded">PDF格式</span>
              <span className="bg-muted px-2 py-1 rounded">正式出版物</span>
            </div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all hover:shadow-md ${
            selectedTypeIndex === 1 ? "ring-2 ring-primary" : ""
          }`}
          onClick={() => {
            setSelectedTypeIndex(1);
            resetForm("test");
          }}
        >
          <CardHeader className="text-center pb-3 sm:pb-6 relative">
            <ClipboardList className="w-8 h-8 sm:w-12 sm:h-12 mx-auto text-green-500 dark:text-green-400" />
            <CardTitle className="text-base sm:text-lg">试题 (Test)</CardTitle>
            <Button
              className="absolute top-0 right-0 pointer-events-none"
              variant="ghost"
              onClick={() => {
                setSelectedTypeIndex(1);
                resetForm("test");
              }}
            >
              <ButtonKbd>2</ButtonKbd>
            </Button>
          </CardHeader>
          <CardContent className="pt-0">
            <CardDescription className="text-sm mb-2 sm:mb-3">
              北京邮电大学期中/期末考试真题
            </CardDescription>
            <div className="hidden sm:block space-y-1 text-xs text-muted-foreground">
              <div>• 来自北邮</div>
              <div>• 期中/期末考试</div>
              <div>• 真题（非题库）</div>
            </div>
            <div className="sm:hidden flex flex-wrap gap-1 text-xs text-muted-foreground">
              <span className="bg-muted px-2 py-1 rounded">北邮</span>
              <span className="bg-muted px-2 py-1 rounded">期中/期末</span>
            </div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all hover:shadow-md ${
            selectedTypeIndex === 2 ? "ring-2 ring-primary" : ""
          }`}
          onClick={() => {
            setSelectedTypeIndex(2);
            resetForm("doc");
          }}
        >
          <CardHeader className="text-center pb-3 sm:pb-6 relative">
            <FileText className="w-8 h-8 sm:w-12 sm:h-12 mx-auto text-purple-500 dark:text-purple-400" />
            <CardTitle className="text-base sm:text-lg">资料 (Doc)</CardTitle>
            <Button
              className="absolute top-0 right-0 pointer-events-none"
              variant="ghost"
              onClick={() => {
                setSelectedTypeIndex(2);
                resetForm("doc");
              }}
            >
              <ButtonKbd>3</ButtonKbd>
            </Button>
          </CardHeader>
          <CardContent className="pt-0">
            <CardDescription className="text-sm mb-2 sm:mb-3">
              课程相关的学习和复习资料
            </CardDescription>
            <div className="hidden sm:block space-y-1 text-xs text-muted-foreground">
              <div>• PDF或ZIP格式</div>
              <div>• 教育资源</div>
              <div>• 对应具体课程</div>
            </div>
            <div className="sm:hidden flex flex-wrap gap-1 text-xs text-muted-foreground">
              <span className="bg-muted px-2 py-1 rounded">PDF/ZIP</span>
              <span className="bg-muted px-2 py-1 rounded">课程资料</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col items-center space-y-2">
        <Button onClick={() => {
          const fileTypes: FileType[] = ['book', 'test', 'doc'];
          resetForm(fileTypes[selectedTypeIndex]);
          setStep(2);
        }} size="lg">
          下一步：填写基本信息
          <ButtonKbd invert={true}>x</ButtonKbd>
        </Button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">上传文件</h2>
        <p className="text-muted-foreground">上传文件或粘贴文件链接</p>
        <Badge variant="outline">
          {fileType === "book" ? "书籍" : fileType === "test" ? "试题" : "资料"}
        </Badge>
      </div>

      {/* 输入方式选择 */}
      <div className="space-y-4">
        <Label>选择输入方式</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card
            className={`cursor-pointer transition-all hover:shadow-md ${
              inputMethod === 'upload' ? "ring-2 ring-primary" : ""
            }`}
            onClick={() => setInputMethod('upload')}
          >
            <CardHeader className="text-center pb-3 relative">
              <UploadIcon className="w-8 h-8 mx-auto text-green-500 dark:text-green-400" />
              <CardTitle className="text-base">
                上传文件
                <Button
                  variant="ghost"
                  size="sm"
                  className="px-0 absolute top-2 right-3 pointer-events-none"
                  onClick={() => setInputMethod('upload')}
                >
                  <ButtonKbd>1</ButtonKbd>
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <CardDescription className="text-sm text-center">
                本地文件，需要上传
              </CardDescription>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-all hover:shadow-md ${
              inputMethod === 'url' ? "ring-2 ring-primary" : ""
            }`}
            onClick={() => setInputMethod('url')}
          >
            <CardHeader className="text-center pb-3 relative">
              <FileText className="w-8 h-8 mx-auto text-blue-500 dark:text-blue-400" />
              <CardTitle className="text-base">
                粘贴链接
                <Button
                  variant="ghost"
                  size="sm"
                  className="px-0 absolute top-2 right-3 pointer-events-none"
                  onClick={() => setInputMethod('url')}
                >
                  <ButtonKbd>2</ButtonKbd>
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <CardDescription className="text-sm text-center">
                已有文件URL，直接粘贴
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 根据选择的方式显示不同的输入组件 */}
      {inputMethod === 'upload' ? (
        <div className="space-y-2">
          <FileUpload
            allowedTypes={fileType === "book" ? ["pdf"] : fileType === "test" ? ["pdf"] : ["pdf", "zip"]}
            onUploadSuccess={(key: string, fileInfo?: { name: string; size: number }) => {
              // 构建完整的URL
              const fullUrl = `https://byrdocs.org/files/${key}`;
              const md5 = extractMD5FromURL(fullUrl);
              const detectedFileType = extractFileTypeFromURL(fullUrl, fileType);
              
              // 保存文件信息
              if (fileInfo) {
                setUploadedFileInfo(fileInfo);
              }
              
              setFormData((prev) => ({
                ...prev,
                url: fullUrl,
                id: md5,
                data: {
                  ...prev.data,
                  filetype: detectedFileType,
                },
              }));
              
              setUrlValidationError("");
            }}
            onUploadError={(error) => {
              setUrlValidationError(`上传失败: ${error}`);
            }}
            initialUploadedKey={formData.url ? formData.url.split('/').pop() : undefined}
            initialFileInfo={uploadedFileInfo}
            onReset={() => {
              setFormData((prev) => ({
                ...prev,
                url: "",
                id: "",
                data: {
                  ...prev.data,
                  filetype: "pdf",
                },
              }));
              setUploadedFileInfo(null);
            }}
            className="max-w-none"
          />
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="url">
            文件 URL *
            <LabelKbd>u</LabelKbd>
          </Label>
          <div className="relative">
            <Input
              id="url"
              className="text-sm w-full pr-10"
              placeholder="https://byrdocs.org/files/..."
              value={formData.url}
              onChange={(e) => {
                const url = e.target.value;
                const md5 = extractMD5FromURL(url);
                
                // 验证文件格式
                const validation = validateURLFileType(url, fileType);
                if (!validation.isValid && validation.error) {
                  setUrlValidationError(validation.error);
                } else {
                  setUrlValidationError("");
                }
                
                // 只有当URL不为空时才提取文件类型，否则使用默认的pdf
                const detectedFileType = url.trim() ? extractFileTypeFromURL(url, fileType) : "pdf";
                setFormData((prev) => ({
                  ...prev,
                  url: url,
                  id: md5,
                  data: {
                    ...prev.data,
                    filetype: detectedFileType,
                  },
                }));
              }}
            />
            <kbd className="absolute right-2 top-1/2 transform -translate-y-1/2 px-2 py-1 text-xs bg-muted text-muted-foreground border rounded">⏎</kbd>
          </div>
          <p className="text-xs text-muted-foreground">
            通过 byrdocs-cli 上传后得到的URL
          </p>
          {urlValidationError && (
            <p className="text-xs text-red-500">{urlValidationError}</p>
          )}
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => {
          setPreviousStep(step); // 防止触发自动focus
          setStep(1);
        }}
        >
          上一步
          <ButtonKbd>z</ButtonKbd>
        </Button>
        <Button onClick={() => setStep(3)} disabled={!validateStep2()}>
          下一步：填写详细信息
          <ButtonKbd invert={true}>x</ButtonKbd>
        </Button>
      </div>
    </div>
  );

  const renderBookForm = () => {
    const data = formData.data as BookData;
    return (
      <div className="space-y-6">
        <div className="space-y-2" id="book-title">
          <Label htmlFor="title">
            书名 *
            <LabelKbd>b</LabelKbd>
          </Label>
          <Input
            id="title"
            className={`text-sm ${highlightedFields.includes('book-title') ? 'border-red-500 ring-1 ring-red-500' : ''}`}
            placeholder="例如：理论物理学教程 第10卷 物理动理学 第2版"
            value={data.title}
            onChange={(e) => {
              setFormData((prev) => ({
                ...prev,
                data: { ...prev.data, title: e.target.value } as BookData,
              }));
              // 清除高亮
              if (highlightedFields.includes('book-title')) {
                setHighlightedFields(prev => prev.filter(field => field !== 'book-title'));
              }
            }}
          />
          <p className="text-xs text-muted-foreground">
            需与原书保持一致，中文书使用中文书名
          </p>
        </div>

        <div className="space-y-2" id="book-authors">
          <Label htmlFor="authors-0">
            作者 *
            <LabelKbd>c</LabelKbd>
          </Label>
          {data.authors.map((author, index) => (
            <div key={index} className="flex gap-2">
              <Input
                id={`authors-${index}`}
                className={`text-sm ${highlightedFields.includes('book-authors') ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                placeholder="例如：Лифшиц, Евгений Михайлович(粟弗席兹)"
                value={author}
                onChange={(e) => {
                  updateArrayItem("authors", index, e.target.value);
                  // 清除高亮
                  if (highlightedFields.includes('book-authors')) {
                    setHighlightedFields(prev => prev.filter(field => field !== 'book-authors'));
                  }
                }}
              />
              {data.authors.length > 1 && (
                <Button
                  variant="outline"
                  className="px-2"
                  onClick={() => removeArrayItem("authors", index)}
                >
                  <Trash2 className="w-4 h-4" />
                  {index < 9 && <ButtonKbd>{"s" + (index + 1)}</ButtonKbd>}
                </Button>
              )}
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => addArrayItem("authors")}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            添加作者
            <ButtonKbd>a</ButtonKbd>
          </Button>
          <p className="text-xs text-muted-foreground">
            尽量使用原名，可酌情标注中译名
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor={data.translators.length === 0 ? "add-translator" : "translators-0"}>
            译者（可选）
            <LabelKbd>h</LabelKbd>
          </Label>
          {data.translators.length === 0 ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => addArrayItem("translators")}
              className="w-full"
              id="add-translator"
            >
              <Plus className="w-4 h-4 mr-2" />
              添加译者
              <ButtonKbd>t</ButtonKbd>
            </Button>
          ) : (
            <>
              {data.translators.map((translator, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    id={`translators-${index}`}
                    className="text-sm"
                    placeholder="例如：徐锡申"
                    value={translator}
                    onChange={(e) =>
                      updateArrayItem("translators", index, e.target.value)
                    }
                  />
                  <Button
                    variant="outline"
                    className="px-2"
                    onClick={() => removeArrayItem("translators", index)}
                  >
                    <Trash2 className="w-4 h-4" />
                    {data.translators.length == 1 
                      ? <ButtonKbd>{"e"}</ButtonKbd>
                      : index < 9 && <ButtonKbd>{"e" + (index + 1)}</ButtonKbd>
                    }
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => addArrayItem("translators")}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                添加译者
                <ButtonKbd>t</ButtonKbd>
              </Button>
            </>
          )}
          <p className="text-xs text-muted-foreground">如没有译者可留空</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="edition">
              版次
              <LabelKbd>f</LabelKbd>
            </Label>
            <Input
              id="edition"
              className="text-sm"
              placeholder="例如：1"
              value={data.edition}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  data: { ...prev.data, edition: e.target.value } as BookData,
                }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="publisher">
              出版社
              <LabelKbd>g</LabelKbd>
            </Label>
            <Input
              id="publisher"
              className="text-sm"
              placeholder="例如：高等教育出版社"
              value={data.publisher}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  data: { ...prev.data, publisher: e.target.value } as BookData,
                }))
              }
            />
          </div>

          <div className="space-y-2" id="book-publish-year">
            <Label htmlFor="publish_year">
              出版年份
              <LabelKbd>j</LabelKbd>
            </Label>
            <Input
              id="publish_year" 
              className={`text-sm ${
                (data.publish_year && !validateYear(data.publish_year)) || 
                highlightedFields.includes('book-publish-year') 
                ? "border-red-500 ring-1 ring-red-500" : ""
              }`}
              type="number"
              step="1"
              min="1"
              max={new Date().getFullYear()}
              placeholder="例如：2008"
              value={data.publish_year}
              onChange={(e) => {
                setFormData((prev) => ({
                  ...prev,
                  data: {
                    ...prev.data,
                    publish_year: e.target.value,
                  } as BookData,
                }));
                // 清除高亮
                if (highlightedFields.includes('book-publish-year')) {
                  setHighlightedFields(prev => prev.filter(field => field !== 'book-publish-year'));
                }
              }}
            />
            {data.publish_year && !validateYear(data.publish_year) && (
              <p className="text-xs text-red-500">
                出版年份必须是有效年份，不能超过 {new Date().getFullYear()} 年
              </p>
            )}
          </div>
        </div>

        <div className="space-y-2" id="book-isbn">
          <Label htmlFor="isbn-0">
            ISBN *
            <LabelKbd>w</LabelKbd>
          </Label>
          {data.isbn.map((isbn, index) => (
            <div key={index} className="space-y-1">
              <div className="flex gap-2">
                <Input
                  id={`isbn-${index}`}
                  placeholder="例如：978-7-04-023069-7"
                  value={isbn}
                  onChange={(e) => {
                    const value = e.target.value;
                    updateArrayItem("isbn", index, value);

                    // 清除高亮
                    if (highlightedFields.includes('book-isbn')) {
                      setHighlightedFields(prev => prev.filter(field => field !== 'book-isbn'));
                    }

                    // 如果输入完成且格式正确，自动格式化
                    if (validateISBN(value)) {
                      const formatted = formatISBN(value);
                      if (formatted !== value) {
                        setTimeout(
                          () => updateArrayItem("isbn", index, formatted),
                          0
                        );
                      }
                    }
                  }}
                  onBlur={(e) => {
                    // 失去焦点时也尝试格式化
                    const value = e.target.value;
                    if (validateISBN(value)) {
                      const formatted = formatISBN(value);
                      if (formatted !== value) {
                        updateArrayItem("isbn", index, formatted);
                      }
                    }
                  }}
                  className={`text-sm ${
                    (isbn && !validateISBN(isbn)) || 
                    highlightedFields.includes('book-isbn') 
                    ? "border-red-500 ring-1 ring-red-500" : ""
                  }`}
                />
                {data.isbn.length > 1 && (
                  <Button
                    variant="outline"
                    className="px-2"
                    onClick={() => removeArrayItem("isbn", index)}
                  >
                    <Trash2 className="w-4 h-4" />
                    {index < 9 && <ButtonKbd>{"d" + (index + 1)}</ButtonKbd>}
                  </Button>
                )}
              </div>
              {isbn && !validateISBN(isbn) && (
                <p className="text-xs text-red-500">
                  ISBN 格式不正确，请输入有效的 ISBN 格式
                </p>
              )}
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => addArrayItem("isbn")}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            添加 ISBN
            <ButtonKbd>i</ButtonKbd>
          </Button>
          <p className="text-xs text-muted-foreground">
            支持 ISBN-10 和 ISBN-13 格式
          </p>
        </div>
      </div>
    );
  };

  const renderTestForm = () => {
    const data = formData.data as TestData;
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="school">
            学院
            <LabelKbd>s</LabelKbd>
          </Label>
          <CollegeMultiSelect
            id="school"
            selectedColleges={data.college.filter((c) => c.trim())}
            onCollegesChange={(colleges) =>
              setFormData((prev) => ({
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
                    setFormData((prev) => ({
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
                      setFormData((prev) => ({
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
                  setFormData((prev) => ({
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
                开始年份
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
                  setFormData((prev) => ({
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
                结束年份
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
                  setFormData((prev) => ({
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
            return !yearValidation.isValid && yearValidation.error && (
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
                    setFormData((prev) => ({
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
                      setFormData((prev) => ({
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
                    setFormData((prev) => ({
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
                      setFormData((prev) => ({
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
              setFormData((prev) => ({
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
  };

  const renderDocForm = () => {
    const data = formData.data as DocData;
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
              setFormData((prev) => ({
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
                          setFormData((prev) => ({
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
                            setFormData((prev) => ({
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
                              setFormData((prev) => ({
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
                          setFormData((prev) => ({
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
              setFormData((prev) => {
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
              setFormData((prev) => ({
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
  };

  const renderStep3 = () => (
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

      {fileType === "book" && renderBookForm()}
      {fileType === "test" && renderTestForm()}
      {fileType === "doc" && renderDocForm()}

      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between">
                      <Button variant="outline" onClick={() => {
            setPreviousStep(step); // 防止触发自动focus
            setStep(2);
          }}
          >
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
            }}
            >
              下一步：预览和下载
              <ButtonKbd invert={true}>x</ButtonKbd>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">预览和下载</h2>
        <p className="text-muted-foreground">检查生成的YAML文件并下载</p>
      </div>
      <div className="relative">
        <div className={`p-4 rounded-lg text-sm overflow-x-auto border yaml-highlight ${
          actualTheme === 'dark' ? 'yaml-dark' : 'yaml-light'
        }`}>
          <pre
            className="whitespace-pre-wrap m-0 pr-12"
            dangerouslySetInnerHTML={{
              __html: hljs.highlight(generateYaml(fileType, formData), { language: "yaml" }).value,
            }}
          />
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={copyYamlToClipboard}
          className="absolute top-2 right-2 h-8 w-14 p-0"
          title={isCopied ? "已复制!" : "复制YAML内容"}
        >
          {isCopied ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
          <ButtonKbd>c</ButtonKbd>
        </Button>
      </div>
      <div className="flex justify-between">
        {!hasDownloaded ? (
          <>
            <Button variant="outline" onClick={() => {
              setPreviousStep(step); // 防止触发自动focus
              setStep(3);
            }}
            >
              上一步
              <ButtonKbd>z</ButtonKbd>
            </Button>
            <Button
              onClick={downloadYaml}
              className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 text-white"
            >
              <Download className="w-4 h-4 mr-1" />
              下载 YAML 文件
              <ButtonKbd className="dark:bg-white/10 bg-white/10 dark:text-white/70 text-white/70 dark:border-white/40 border-white/40">d</ButtonKbd>
            </Button>
          </>
        ) : (
          <>
            <Button variant="outline" onClick={() => {
              setPreviousStep(step); // 防止触发自动focus
              setStep(3);
            }}
            >
              上一步
              <ButtonKbd>z</ButtonKbd>
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={createNewMetadata}
                className="flex items-center"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                创建新的元信息
                <ButtonKbd>n</ButtonKbd>
              </Button>
              <Button
                onClick={downloadYaml}
                className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 text-white"
              >
                <Download className="w-4 h-4 mr-1" />
                重新下载
                <ButtonKbd className="dark:bg-white/10 bg-white/10 dark:text-white/70 text-white/70 dark:border-white/40 border-white/40">d</ButtonKbd>
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );

  return (
    <ShortcutProvider>
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center my-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            BYR Docs Publish
          </h1>
          <p className="text-lg text-muted-foreground">
            上传文件和编写
            <a
              href="https://github.com/byrdocs/byrdocs-archive/wiki/%E5%85%B3%E4%BA%8E%E6%96%87%E4%BB%B6"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300  hover:underline"
              
            >
              元信息
            </a>
          </p>
        </div>

        <div className="mb-8">
          <div className="flex justify-center">
            <div className="flex items-center">
              {[1, 2, 3, 4].map((stepNum) => (
                <div key={stepNum} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      step >= stepNum
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {stepNum}
                  </div>
                  {stepNum < 4 && (
                    <div
                      className={`w-10 sm:w-20 h-0.5 ${
                        step > stepNum ? "bg-primary" : "bg-muted"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-center mt-2">
            <div className="flex text-xs sm:text-sm space-x-6 sm:space-x-[56px] text-muted-foreground">
              <span>选择类型</span>
              <span>基本信息</span>
              <span>详细信息</span>
              <span>预览下载</span>
            </div>
          </div>
        </div>

        <Card className="bg-card shadow-lg relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowShortcuts(true)}
            className="absolute right-4 top-4 z-10 hidden sm:flex"
            title="快捷键帮助"
          >
            <Keyboard className="w-4 h-4" />
            <ButtonKbd className="sm:hidden">?</ButtonKbd>
          </Button>
          <CardContent className="p-8">
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
            {step === 4 && renderStep4()}
          </CardContent>
        </Card>

        <div className="text-center my-8 text-sm text-muted-foreground">
          <p>
            <a href="https://byrdocs.org" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 hover:underline">BYRDocs</a> | <a href="https://github.com/byrdocs" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 hover:underline">GitHub</a>
          </p>
        </div>
      </div>
      
      {/* 快捷键帮助弹窗 */}
      <Dialog open={showShortcuts} onOpenChange={setShowShortcuts}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Keyboard className="w-5 h-5" />
              快捷键说明
            </DialogTitle>
            <DialogDescription>
              当前可用的快捷键操作
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* 全局快捷键 */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">全局快捷键</h3>
              <div className="grid gap-3">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm">向前翻页</span>
                  <div className="flex items-center gap-1">
                    <kbd className="px-2 py-1 text-xs bg-background border rounded">Cmd/Ctrl</kbd>
                    <span className="text-xs">+</span>
                    <kbd className="px-2 py-1 text-xs bg-background border rounded">←</kbd>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm">向后翻页</span>
                  <div className="flex items-center gap-1">
                    <kbd className="px-2 py-1 text-xs bg-background border rounded">Cmd/Ctrl</kbd>
                    <span className="text-xs">+</span>
                    <kbd className="px-2 py-1 text-xs bg-background border rounded">→</kbd>
                  </div>
                </div>
              </div>
            </div>

            {step !== 3 && 
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">当前页面快捷键</h3>
              <div className="grid gap-3">
                {step === 1 && (
                  <>
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <span className="text-sm">选择文件类型</span>
                      <div className="flex items-center gap-1">
                        <kbd className="px-2 py-1 text-xs bg-background border rounded">↑</kbd>
                        <kbd className="px-2 py-1 text-xs bg-background border rounded">↓</kbd>
                        <kbd className="px-2 py-1 text-xs bg-background border rounded">←</kbd>
                        <kbd className="px-2 py-1 text-xs bg-background border rounded">→</kbd>
                      </div>
                    </div>
                  </>
                )}
                
                {step === 2 && (
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm">填写完 URL 后进入下一步</span>
                    <kbd className="px-2 py-1 text-xs bg-background border rounded">Enter</kbd>
                  </div>
                )}
                
                {step === 4 && (
                  <>
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <span className="text-sm">{hasDownloaded ? '创建新的元信息' : '下载YAML文件'}</span>
                      <kbd className="px-2 py-1 text-xs bg-background border rounded">Enter</kbd>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <span className="text-sm">复制YAML内容</span>
                      <div className="flex items-center gap-1">
                        <kbd className="px-2 py-1 text-xs bg-background border rounded">C</kbd>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>}
          </div>
        </DialogContent>
      </Dialog>
    </div>
    </ShortcutProvider>
  );
}