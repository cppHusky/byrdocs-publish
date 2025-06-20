"use client";

import { useState, useEffect, useRef } from "react";
import * as ISBN from "isbn3";
import hljs from "highlight.js/lib/core";
import yaml from "highlight.js/lib/languages/yaml";
import * as YAML from "js-yaml";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  FileText,
  BookOpen,
  ClipboardList,
  Plus,
  Trash2,
} from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

type FileType = "book" | "test" | "doc";

interface BookData {
  title: string;
  authors: string[];
  translators: string[];
  edition: string;
  publisher: string;
  publish_year: string;
  isbn: string[];
  filetype: string;
}

interface TestData {
  college: string[];
  course: {
    type: string;
    name: string;
  };
  time: {
    start: string;
    end: string;
    semester: string;
    stage: string;
  };
  filetype: string;
  content: string[];
}

interface DocData {
  title: string;
  filetype: string;
  course: Array<{
    type: string;
    name: string;
  }>;
  content: string[];
}

interface FormData {
  id: string;
  url: string;
  type: FileType;
  data: BookData | TestData | DocData;
}

const COLLEGES = [
  "信息与通信工程学院",
  "电子工程学院",
  "计算机学院（国家示范性软件学院）",
  "网络空间安全学院",
  "人工智能学院",
  "智能工程与自动化学院",
  "集成电路学院",
  "经济管理学院",
  "理学院",
  "未来学院",
  "人文学院",
  "数字媒体与设计艺术学院",
  "马克思主义学院",
  "国际学院",
  "应急管理学院",
  "网络教育学院（继续教育学院）",
  "玛丽女王海南学院",
  "体育部",
  "卓越工程师学院",
];

export default function YamlGenerator() {
  // 课程列表状态
  const [courseList, setCourseList] = useState<string[]>([]);
  // 主题状态
  const [isDarkMode, setIsDarkMode] = useState(false);

  // 检测主题变化
  useEffect(() => {
    const checkTheme = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setIsDarkMode(isDark);
    };

    // 初始检查
    checkTheme();

    // 监听主题变化
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

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

  // 从URL中提取MD5
  const extractMD5FromURL = (url: string): string => {
    const match = url.match(/\/files\/([a-f0-9]{32})\./i);
    return match ? match[1] : "";
  };

  // 从URL中提取文件格式
  const extractFileTypeFromURL = (url: string, fileType: FileType): string => {
    const match = url.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
    if (match) {
      const extension = match[1].toLowerCase();
      
      // 只有doc类型允许使用zip格式
      if (fileType === 'doc') {
        const formatMap: { [key: string]: string } = {
          'pdf': 'pdf',
          'zip': 'zip',
          'rar': 'zip', // RAR文件也归类为压缩文件
          '7z': 'zip',  // 7z文件也归类为压缩文件
          'doc': 'pdf', // Word文档归类为PDF
          'docx': 'pdf',
          'ppt': 'pdf', // PowerPoint归类为PDF
          'pptx': 'pdf',
          'xls': 'pdf', // Excel归类为PDF
          'xlsx': 'pdf'
        };
        return formatMap[extension] || 'pdf';
      } else {
        // book和test类型只能使用pdf
        return 'pdf';
      }
    }
    return 'pdf'; // 默认返回pdf
  };

  // 验证MD5格式是否正确
  const validateMD5Format = (url: string): { isValid: boolean; error?: string } => {
    if (!url.trim()) {
      return { isValid: true }; // 空URL不验证
    }

    // 检查URL是否包含/files/路径
    if (!url.includes('/files/')) {
      return { isValid: false, error: "URL格式不正确，应包含 '/files/' 路径" };
    }

    // 提取MD5部分
    const md5Match = url.match(/\/files\/([a-f0-9]+)\./i);
    if (!md5Match) {
      return { isValid: false, error: "无法从URL中提取MD5哈希值" };
    }

    const md5 = md5Match[1];
    
    // 验证MD5格式：必须是32位十六进制字符
    if (!/^[a-f0-9]{32}$/i.test(md5)) {
      if (md5.length !== 32) {
        return { 
          isValid: false, 
          error: `MD5哈希值长度不正确，应为32位，当前为${md5.length}位` 
        };
      } else {
        return { 
          isValid: false, 
          error: "MD5哈希值格式不正确，只能包含0-9和a-f字符" 
        };
      }
    }

    return { isValid: true };
  };

  // 验证URL文件格式是否正确
  const validateURLFileType = (url: string, fileType: FileType): { isValid: boolean; error?: string } => {
    if (!url.trim()) {
      return { isValid: true }; // 空URL不验证
    }

    // 首先验证MD5格式
    const md5Validation = validateMD5Format(url);
    if (!md5Validation.isValid) {
      return md5Validation;
    }

    const match = url.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
    if (!match) {
      return { isValid: false, error: "无法从URL中检测到文件扩展名" };
    }

    const extension = match[1].toLowerCase();
    
    // 定义允许的扩展名
    const allowedExtensions = {
      book: ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'],
      test: ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'],
      doc: ['pdf', 'zip', 'rar', '7z', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx']
    };

    const allowed = allowedExtensions[fileType];
    if (!allowed.includes(extension)) {
      const fileTypeName = fileType === 'book' ? '书籍' : fileType === 'test' ? '试题' : '资料';
      const allowedFormats = fileType === 'doc' ? 'PDF 或 ZIP' : 'PDF';
      return { 
        isValid: false, 
        error: `${fileTypeName}类型只支持 ${allowedFormats} 格式，检测到的格式为 ${extension.toUpperCase()}` 
      };
    }

    // 特殊检查：book和test类型不能使用压缩文件格式
    if ((fileType === 'book' || fileType === 'test') && ['zip', 'rar', '7z'].includes(extension)) {
      const fileTypeName = fileType === 'book' ? '书籍' : '试题';
      return { 
        isValid: false, 
        error: `${fileTypeName}类型不支持压缩文件格式 (${extension.toUpperCase()})，请使用 PDF 格式` 
      };
    }

    return { isValid: true };
  };

  // 验证年份是否有效
  const validateYear = (year: string): boolean => {
    if (!year) return true; // 空值不验证
    
    // 验证是否为整数
    if (!/^\d+$/.test(year.trim())) {
      return false;
    }
    
    const yearNum = parseInt(year);
    const currentYear = new Date().getFullYear();
    // 只验证不能超过当前年份，不限制最小年份
    return yearNum > 0 && yearNum <= currentYear;
  };

  // 验证年份范围
  const validateYearRange = (startYear: string, endYear: string): { isValid: boolean; error?: string } => {
    // 如果两个年份都为空，则通过验证
    if (!startYear && !endYear) {
      return { isValid: true };
    }

    // 如果只填了一个年份，要求另一个也必须填
    if (startYear && !endYear) {
      return { isValid: false, error: "填写了开始年份后，结束年份也必须填写" };
    }

    if (!startYear && endYear) {
      return { isValid: false, error: "填写了结束年份后，开始年份也必须填写" };
    }

    // 如果两个年份都填了，验证范围关系
    if (startYear && endYear) {
      // 验证是否为整数
      if (!/^\d+$/.test(startYear.trim())) {
        return { isValid: false, error: "开始年份必须是整数" };
      }
      
      if (!/^\d+$/.test(endYear.trim())) {
        return { isValid: false, error: "结束年份必须是整数" };
      }

      const start = parseInt(startYear);
      const end = parseInt(endYear);
      const currentYear = new Date().getFullYear();

      if (start < 2000 || start > currentYear) {
        return { isValid: false, error: `开始年份必须在 2000 到 ${currentYear} 之间` };
      }

      if (end < 2000 || end > currentYear) {
        return { isValid: false, error: `结束年份必须在 2000 到 ${currentYear} 之间` };
      }

      if (end !== start && end !== start + 1) {
        return { isValid: false, error: "结束年份必须等于开始年份或开始年份+1" };
      }
    }

    return { isValid: true };
  };

  const [step, setStep] = useState(1);
  const [fileType, setFileType] = useState<FileType>("book");
  const [urlValidationError, setUrlValidationError] = useState<string>("");
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

  // ISBN 验证函数
  const validateISBN = (isbn: string): boolean => {
    const parsed = ISBN.parse(isbn);
    return !!(parsed && parsed.isValid);
  };

  // ISBN 格式化函数
  const formatISBN = (isbn: string): string => {
    const parsed = ISBN.parse(isbn);
    if (parsed && parsed.isValid) {
      return parsed.isbn13h || isbn;
    }
    return isbn;
  };

  const generateYaml = () => {
    const schemaUrl = `https://byrdocs.org/schema/${fileType}.yaml`;
    
    // 构建YAML对象
    const yamlObject: any = {
      id: formData.id,
      url: formData.url,
      type: formData.type,
      data: {}
    };

    if (fileType === "book") {
      const data = formData.data as BookData;
      yamlObject.data.title = data.title;
      
      // 只添加非空的数组
      const authors = data.authors.filter((a) => a.trim());
      if (authors.length > 0) {
        yamlObject.data.authors = authors;
      }
      
      const translators = data.translators.filter((t) => t.trim());
      if (translators.length > 0) {
        yamlObject.data.translators = translators;
      }
      
      if (data.edition) yamlObject.data.edition = data.edition;
      if (data.publisher) yamlObject.data.publisher = data.publisher;
      if (data.publish_year) yamlObject.data.publish_year = data.publish_year;
      
      const isbn = data.isbn.filter((i) => i.trim());
      if (isbn.length > 0) {
        yamlObject.data.isbn = isbn;
      }
      
      yamlObject.data.filetype = data.filetype;
    } else if (fileType === "test") {
      const data = formData.data as TestData;
      
      const college = data.college.filter((c) => c.trim());
      if (college.length > 0) {
        yamlObject.data.college = college;
      }
      
      yamlObject.data.course = {
        name: data.course.name
      };
      if (data.course.type) {
        yamlObject.data.course.type = data.course.type;
      }
      
      yamlObject.data.time = {};
      if (data.time.start) yamlObject.data.time.start = data.time.start;
      if (data.time.end) yamlObject.data.time.end = data.time.end;
      if (data.time.semester) yamlObject.data.time.semester = data.time.semester;
      if (data.time.stage) yamlObject.data.time.stage = data.time.stage;
      
      yamlObject.data.filetype = data.filetype;
      
      if (data.content.length > 0) {
        yamlObject.data.content = data.content;
      }
    } else if (fileType === "doc") {
      const data = formData.data as DocData;
      yamlObject.data.title = data.title;
      yamlObject.data.filetype = data.filetype;
      yamlObject.data.course = data.course.map(course => ({
        ...(course.type && { type: course.type }),
        name: course.name
      }));
      
      if (data.content.length > 0) {
        yamlObject.data.content = data.content;
      }
    }

    // 使用js-yaml生成YAML字符串
    const yamlContent = YAML.dump(yamlObject, {
      indent: 2,
      lineWidth: -1, // 不限制行宽
      noRefs: true,  // 不使用引用
      quotingType: '"', // 使用双引号
      forceQuotes: false // 不强制所有字符串都加引号
    });

    // 添加schema注释
    return `# yaml-language-server: $schema=${schemaUrl}\n\n${yamlContent}`;
  };

  const downloadYaml = () => {
    const yamlContent = generateYaml();
    const blob = new Blob([yamlContent], { type: "text/yaml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${formData.id || "metadata"}.yml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const addArrayItem = (field: string, subField?: string) => {
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
              [subField]: [...currentArray, ""]
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
            [field]: [...currentArray, ""]
          }
        };
      }
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

    setFormData({
      id: "",
      url: "",
      type,
      data: initialData,
    });
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
            fileType === "book" ? "ring-2 ring-primary" : ""
          }`}
          onClick={() => resetForm("book")}
        >
          <CardHeader className="text-center pb-3 sm:pb-6">
            <BookOpen className="w-8 h-8 sm:w-12 sm:h-12 mx-auto text-blue-500 dark:text-blue-400" />
            <CardTitle className="text-base sm:text-lg">书籍 (Book)</CardTitle>
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
            fileType === "test" ? "ring-2 ring-primary" : ""
          }`}
          onClick={() => resetForm("test")}
        >
          <CardHeader className="text-center pb-3 sm:pb-6">
            <ClipboardList className="w-8 h-8 sm:w-12 sm:h-12 mx-auto text-green-500 dark:text-green-400" />
            <CardTitle className="text-base sm:text-lg">试题 (Test)</CardTitle>
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
            fileType === "doc" ? "ring-2 ring-primary" : ""
          }`}
          onClick={() => resetForm("doc")}
        >
          <CardHeader className="text-center pb-3 sm:pb-6">
            <FileText className="w-8 h-8 sm:w-12 sm:h-12 mx-auto text-purple-500 dark:text-purple-400" />
            <CardTitle className="text-base sm:text-lg">资料 (Doc)</CardTitle>
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

      <div className="flex justify-center">
        <Button onClick={() => setStep(2)} size="lg">
          下一步：填写基本信息
        </Button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">基本信息</h2>
        <p className="text-muted-foreground">填写文件的基本信息</p>
        <Badge variant="outline">
          {fileType === "book" ? "书籍" : fileType === "test" ? "试题" : "资料"}
        </Badge>
      </div>

      <div className="">
        <div className="space-y-2">
          <Label htmlFor="url">文件 URL *</Label>
          <Input
            id="url"
            className="text-sm w-full"
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
              
              const detectedFileType = extractFileTypeFromURL(url, fileType);
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
          <p className="text-xs text-muted-foreground">
            通过 byrdocs-cli 上传后得到的URL
          </p>
          {urlValidationError && (
            <p className="text-xs text-red-500">{urlValidationError}</p>
          )}
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep(1)}>
          上一步
        </Button>
        <Button onClick={() => setStep(3)} disabled={!validateStep2()}>
          下一步：填写详细信息
        </Button>
      </div>
    </div>
  );

  const renderBookForm = () => {
    const data = formData.data as BookData;
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title">书名 *</Label>
          <Input
            id="title"
            className="text-sm"
            placeholder="例如：理论物理学教程 第10卷 物理动理学 第2版"
            value={data.title}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                data: { ...prev.data, title: e.target.value } as BookData,
              }))
            }
          />
          <p className="text-xs text-muted-foreground">
            需与原书保持一致，中文书使用中文书名
          </p>
        </div>

        <div className="space-y-2">
          <Label>作者 *</Label>
          {data.authors.map((author, index) => (
            <div key={index} className="flex gap-2">
              <Input
                className="text-sm"
                placeholder="例如：Лифшиц, Евгений Михайлович(粟弗席兹)"
                value={author}
                onChange={(e) =>
                  updateArrayItem("authors", index, e.target.value)
                }
              />
              {data.authors.length > 1 && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => removeArrayItem("authors", index)}
                >
                  <Trash2 className="w-4 h-4" />
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
          </Button>
          <p className="text-xs text-muted-foreground">
            尽量使用原名，可酌情标注中译名
          </p>
        </div>

        <div className="space-y-2">
          <Label>译者（可选）</Label>
          {data.translators.length === 0 ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => addArrayItem("translators")}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              添加译者
            </Button>
          ) : (
            <>
              {data.translators.map((translator, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    className="text-sm"
                    placeholder="例如：徐锡申"
                    value={translator}
                    onChange={(e) =>
                      updateArrayItem("translators", index, e.target.value)
                    }
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => removeArrayItem("translators", index)}
                  >
                    <Trash2 className="w-4 h-4" />
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
              </Button>
            </>
          )}
          <p className="text-xs text-muted-foreground">如没有译者可留空</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="edition">版次</Label>
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
            <Label htmlFor="publisher">出版社</Label>
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

          <div className="space-y-2">
            <Label htmlFor="publish_year">出版年份</Label>
            <Input
              id="publish_year" 
              className={`text-sm ${data.publish_year && !validateYear(data.publish_year) ? "border-red-500" : ""}`}
              type="number"
              step="1"
              min="1"
              max={new Date().getFullYear()}
              placeholder="例如：2008"
              value={data.publish_year}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  data: {
                    ...prev.data,
                    publish_year: e.target.value,
                  } as BookData,
                }))
              }
            />
            {data.publish_year && !validateYear(data.publish_year) && (
              <p className="text-xs text-red-500">
                出版年份必须是有效年份，不能超过 {new Date().getFullYear()} 年
              </p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label>ISBN *</Label>
          {data.isbn.map((isbn, index) => (
            <div key={index} className="space-y-1">
              <div className="flex gap-2">
                <Input
                  placeholder="例如：978-7-04-023069-7"
                  value={isbn}
                  onChange={(e) => {
                    const value = e.target.value;
                    updateArrayItem("isbn", index, value);

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
                  className={`text-sm ${isbn && !validateISBN(isbn) ? "border-red-500" : ""}`}
                />
                {data.isbn.length > 1 && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => removeArrayItem("isbn", index)}
                  >
                    <Trash2 className="w-4 h-4" />
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
            添加ISBN
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
          <Label>学院</Label>
          <CollegeMultiSelect
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
          <Label>课程信息 *</Label>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="course-type">课程类型</Label>
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
                  <SelectTrigger>
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

            <div className="space-y-2">
              <Label htmlFor="course-name">课程名称 *</Label>
              <CourseNameInput
                value={data.course.name}
                onChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    data: {
                      ...prev.data,
                      course: {
                        ...(prev.data as TestData).course,
                        name: value,
                      },
                    } as TestData,
                  }))
                }
                courseList={courseList}
                placeholder="例如：概率论与数理统计"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <Label>时间信息 *</Label>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="start-year">开始年份</Label>
              <Input
                id="start-year"
                className={`text-sm ${data.time.start && !validateYear(data.time.start) ? "border-red-500" : ""}`}
                type="number"
                step="1"
                min="2000"
                max={new Date().getFullYear()}
                placeholder="例如：2023"
                value={data.time.start}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    data: {
                      ...prev.data,
                      time: {
                        ...(prev.data as TestData).time,
                        start: e.target.value,
                      },
                    } as TestData,
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end-year">结束年份</Label>
              <Input
                id="end-year"
                className={`text-sm ${data.time.end && !validateYear(data.time.end) ? "border-red-500" : ""}`}
                type="number"
                step="1"
                min="2000"
                max={new Date().getFullYear()}
                placeholder="例如：2024"
                value={data.time.end}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    data: {
                      ...prev.data,
                      time: {
                        ...(prev.data as TestData).time,
                        end: e.target.value,
                      },
                    } as TestData,
                  }))
                }
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
              <Label htmlFor="semester">学期</Label>
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
                  <SelectTrigger>
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
              <Label htmlFor="stage">考试阶段</Label>
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
                  <SelectTrigger>
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

        <div className="space-y-2">
          <Label>内容类型 *</Label>
          <div className="space-y-2">
            {["原题", "答案"].map((contentType) => (
              <div key={contentType} className="flex items-center space-x-2">
                <Checkbox
                  id={contentType}
                  checked={data.content.includes(contentType)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setFormData((prev) => ({
                        ...prev,
                        data: {
                          ...prev.data,
                          content: [
                            ...(prev.data as TestData).content,
                            contentType,
                          ],
                        } as TestData,
                      }));
                    } else {
                      setFormData((prev) => ({
                        ...prev,
                        data: {
                          ...prev.data,
                          content: (prev.data as TestData).content.filter(
                            (c) => c !== contentType
                          ),
                        } as TestData,
                      }));
                    }
                  }}
                />
                <Label htmlFor={contentType}>{contentType}</Label>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">至少选择一项</p>
        </div>
      </div>
    );
  };

  const renderDocForm = () => {
    const data = formData.data as DocData;
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="doc-title">资料标题 *</Label>
          <Input
            id="doc-title"
            className="text-sm"
            placeholder="例如：工程制图习题解答"
            value={data.title}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                data: { ...prev.data, title: e.target.value } as DocData,
              }))
            }
          />
          <p className="text-xs text-muted-foreground">
            请自行总结一个合适的标题
          </p>
        </div>



        <div className="space-y-2">
          <Label>课程信息 *</Label>
          <div className="space-y-4">
            {data.course.map((course, index) => (
              <Card key={index} className="p-4">
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
                      </Button>
                    )}
                  </div>
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>课程类型</Label>
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
                          <SelectTrigger>
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
                      <Label>课程名称 *</Label>
                      <CourseNameInput
                        value={course.name}
                        onChange={(value) =>
                          setFormData((prev) => ({
                            ...prev,
                            data: {
                              ...prev.data,
                              course: (prev.data as DocData).course.map((c, i) =>
                                i === index ? { ...c, name: value } : c
                              ),
                            } as DocData,
                          }))
                        }
                        courseList={courseList}
                        placeholder="例如：工程图学"
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
            onClick={() =>
              setFormData((prev) => ({
                ...prev,
                data: {
                  ...prev.data,
                  course: [
                    ...(prev.data as DocData).course,
                    { type: "", name: "" },
                  ],
                } as DocData,
              }))
            }
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            添加课程
          </Button>
        </div>

        <div className="space-y-2">
          <Label>内容类型 *</Label>
          <div className="space-y-2">
            {["思维导图", "题库", "答案", "知识点", "课件"].map(
              (contentType) => (
                <div key={contentType} className="flex items-center space-x-2">
                  <Checkbox
                    id={contentType}
                    checked={data.content.includes(contentType)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setFormData((prev) => ({
                          ...prev,
                          data: {
                            ...prev.data,
                            content: [
                              ...(prev.data as DocData).content,
                              contentType,
                            ],
                          } as DocData,
                        }));
                      } else {
                        setFormData((prev) => ({
                          ...prev,
                          data: {
                            ...prev.data,
                            content: (prev.data as DocData).content.filter(
                              (c) => c !== contentType
                            ),
                          } as DocData,
                        }));
                      }
                    }}
                  />
                  <Label htmlFor={contentType}>{contentType}</Label>
                </div>
              )
            )}
          </div>
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

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep(2)}>
          上一步
        </Button>
        <Button onClick={() => setStep(4)} disabled={!validateStep3()}>
          下一步：预览和下载
        </Button>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">预览和下载</h2>
        <p className="text-muted-foreground">检查生成的YAML文件并下载</p>
      </div>

      {/* <div 
            className="bg-muted p-4 rounded-lg text-sm overflow-x-auto"
            dangerouslySetInnerHTML={{
              __html: hljs.highlight(generateYaml(), { language: 'yaml' }).value
            }}
          /> */}
      <div className={`p-4 rounded-lg text-sm overflow-x-auto border yaml-highlight ${
        isDarkMode ? 'yaml-dark' : 'yaml-light'
      }`}>
        <pre
          className="whitespace-pre-wrap m-0"
          dangerouslySetInnerHTML={{
            __html: hljs.highlight(generateYaml(), { language: "yaml" }).value,
          }}
        />
      </div>
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep(3)}>
          上一步
        </Button>
        <Button
          onClick={downloadYaml}
          className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 text-white"
        >
          <Download className="w-4 h-4 mr-1" />
          下载 YAML 文件
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center my-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            BYR Docs 元信息生成器
          </h1>
          <p className="text-lg text-muted-foreground">
            轻松生成符合
            <a
              href="https://github.com/byrdocs/byrdocs-archive/wiki/%E5%85%B3%E4%BA%8E%E6%96%87%E4%BB%B6"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300  hover:underline"
              
            >
              规范
            </a>
            的YAML元信息文件
          </p>
        </div>

        <div className="mb-8">
          <div className="flex justify-center">
            <div className="flex items-center space-x-4">
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
                      className={`w-12 h-0.5 ${
                        step > stepNum ? "bg-primary" : "bg-muted"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-center mt-2">
            <div className="flex space-x-16 text-sm text-muted-foreground">
              <span>选择类型</span>
              <span>基本信息</span>
              <span>详细信息</span>
              <span>预览下载</span>
            </div>
          </div>
        </div>

        <Card className="bg-card shadow-lg">
          <CardContent className="p-8">
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
            {step === 4 && renderStep4()}
          </CardContent>
        </Card>

        <div className="text-center mt-8 text-sm text-muted-foreground">
          <p>
            <a href="https://byrdocs.org" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 hover:underline">BYRDocs</a> | <a href="https://github.com/byrdocs" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 hover:underline">GitHub</a>
          </p>
        </div>
      </div>
    </div>
  );
}

// 课程名称自动补全组件
function CourseNameInput({
  value,
  onChange,
  courseList,
  placeholder = "例如：概率论与数理统计",
}: {
  value: string;
  onChange: (value: string) => void;
  courseList: string[];
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const listRef = useRef<HTMLDivElement>(null);

  // 同步外部 value 变化
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // 过滤课程列表
  const filteredCourses = courseList.filter((course) =>
    course.toLowerCase().includes(inputValue.toLowerCase())
  ).slice(0, 10);

  // 重置高亮索引当列表变化时
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [filteredCourses.length]);

  // 滚动到高亮项
  const scrollToHighlighted = (index: number) => {
    if (listRef.current && index >= 0) {
      const listElement = listRef.current;
      const itemElement = listElement.children[index] as HTMLElement;
      
      if (itemElement) {
        const listRect = listElement.getBoundingClientRect();
        const itemRect = itemElement.getBoundingClientRect();
        
        // 检查项目是否在可视区域内
        const isVisible = itemRect.top >= listRect.top && itemRect.bottom <= listRect.bottom;
        
        if (!isVisible) {
          // 计算需要滚动的距离
          const scrollTop = listElement.scrollTop;
          const itemOffsetTop = itemElement.offsetTop;
          const itemHeight = itemElement.offsetHeight;
          const listHeight = listElement.clientHeight;
          
          if (itemRect.top < listRect.top) {
            // 项目在可视区域上方，滚动到顶部
            listElement.scrollTop = itemOffsetTop;
          } else if (itemRect.bottom > listRect.bottom) {
            // 项目在可视区域下方，滚动到底部
            listElement.scrollTop = itemOffsetTop - listHeight + itemHeight;
          }
        }
      }
    }
  };

  const handleSelect = (course: string) => {
    setInputValue(course);
    onChange(course);
    setOpen(false);
    setHighlightedIndex(-1);
  };

  const handleInputChange = (newValue: string) => {
    setInputValue(newValue);
    onChange(newValue);
    // 总是显示下拉列表如果有输入内容
    setOpen(newValue.trim().length > 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === 'ArrowDown' && inputValue.trim()) {
        e.preventDefault();
        setOpen(true);
        setHighlightedIndex(0);
      }
      return;
    }

    if (filteredCourses.length === 0) {
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => {
          const newIndex = prev < filteredCourses.length - 1 ? prev + 1 : 0;
          // 延迟执行滚动，确保状态已更新
          setTimeout(() => scrollToHighlighted(newIndex), 0);
          return newIndex;
        });
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => {
          const newIndex = prev > 0 ? prev - 1 : filteredCourses.length - 1;
          // 延迟执行滚动，确保状态已更新
          setTimeout(() => scrollToHighlighted(newIndex), 0);
          return newIndex;
        });
        break;
      case 'Enter':
      case 'Tab':
        if (highlightedIndex >= 0 && highlightedIndex < filteredCourses.length) {
          e.preventDefault();
          handleSelect(filteredCourses[highlightedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  const handleFocus = () => {
    if (inputValue.trim().length > 0) {
      setOpen(true);
    }
  };

  const handleBlur = (e: React.FocusEvent) => {
    // 延迟关闭以允许点击选项
    setTimeout(() => {
      setOpen(false);
      setHighlightedIndex(-1);
    }, 150);
  };

  return (
    <div className="relative">
      <Input
        className="text-sm"
        value={inputValue}
        onChange={(e) => handleInputChange(e.target.value)}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoComplete="off"
      />
      {open && filteredCourses.length > 0 && (
        <div 
          ref={listRef}
          className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-64 overflow-auto"
        >
          {filteredCourses.map((course, index) => (
            <div
              key={course}
              className={`px-3 py-2 cursor-pointer text-sm ${
                index === highlightedIndex 
                  ? 'bg-accent text-accent-foreground' 
                  : 'hover:bg-accent/50'
              }`}
              onMouseDown={(e) => {
                e.preventDefault(); // 防止失去焦点
                handleSelect(course);
              }}
              onMouseEnter={() => setHighlightedIndex(index)}
            >
              {course}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// 学院多选组件
function CollegeMultiSelect({
  selectedColleges,
  onCollegesChange,
}: {
  selectedColleges: string[];
  onCollegesChange: (colleges: string[]) => void;
}) {
  const [open, setOpen] = useState(false);

  const handleSelect = (college: string) => {
    if (selectedColleges.includes(college)) {
      onCollegesChange(selectedColleges.filter((c) => c !== college));
    } else {
      onCollegesChange([...selectedColleges, college]);
    }
  };

  const handleRemove = (college: string) => {
    onCollegesChange(selectedColleges.filter((c) => c !== college));
  };

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selectedColleges.length === 0
              ? "选择学院..."
              : `已选择 ${selectedColleges.length} 个学院`}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] max-h-[--radix-popover-content-available-height] p-0">
          <Command>
            <CommandInput placeholder="搜索学院..." />
            <CommandList>
              <CommandEmpty>未找到学院</CommandEmpty>
              <CommandGroup className="max-h-64 overflow-auto">
                {COLLEGES.map((college) => (
                  <CommandItem
                    key={college}
                    value={college}
                    onSelect={() => handleSelect(college)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedColleges.includes(college)
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                    {college}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedColleges.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedColleges.map((college) => (
            <Badge
              key={college}
              variant="secondary"
              className="flex items-center gap-1"
            >
              {college}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => handleRemove(college)}
              />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
