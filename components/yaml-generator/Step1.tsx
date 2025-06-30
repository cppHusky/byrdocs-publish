import { Button, ButtonKbd } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  ClipboardList,
  FileText,
} from "lucide-react";
import { FileType } from "@/lib/types";

interface Step1Props {
  selectedTypeIndex: number;
  setSelectedTypeIndex: (index: number) => void;
  resetForm: (type: FileType) => void;
  setStep: (step: number) => void;
}

export function Step1({
  selectedTypeIndex,
  setSelectedTypeIndex,
  resetForm,
  setStep,
}: Step1Props) {
  return (
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
}