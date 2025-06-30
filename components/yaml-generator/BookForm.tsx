import { Button, ButtonKbd } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label, LabelKbd } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import { BookData } from "@/lib/types";
import { validateISBN, formatISBN } from "@/lib/isbn";
import { validateYear } from "@/lib/validate";

interface BookFormProps {
  data: BookData;
  highlightedFields: string[];
  setFormData: (data: any) => void;
  setHighlightedFields: React.Dispatch<React.SetStateAction<string[]>>;
  updateArrayItem: (field: string, index: number, value: string, subField?: string) => void;
  removeArrayItem: (field: string, index: number, subField?: string) => void;
  addArrayItem: (field: string, subField?: string) => void;
}

export function BookForm({
  data,
  highlightedFields,
  setFormData,
  setHighlightedFields,
  updateArrayItem,
  removeArrayItem,
  addArrayItem,
}: BookFormProps) {
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
            setFormData((prev: any) => ({
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
          <LabelKbd>a</LabelKbd>
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
          <ButtonKbd>q</ButtonKbd>
        </Button>
        <p className="text-xs text-muted-foreground">
          尽量使用原名，可酌情标注中译名
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor={!data.translators || data.translators.length === 0 ? "add-translator" : "translators-0"}>
          译者（可选）
          <LabelKbd>t</LabelKbd>
        </Label>
        {!data.translators || data.translators.length === 0 ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => addArrayItem("translators")}
            className="w-full"
            id="add-translator"
          >
            <Plus className="w-4 h-4 mr-2" />
            添加译者
            <ButtonKbd>y</ButtonKbd>
          </Button>
        ) : (
          <>
            {data.translators?.map((translator, index) => (
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
                  {data.translators?.length == 1 
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
              <ButtonKbd>y</ButtonKbd>
            </Button>
          </>
        )}
        <p className="text-xs text-muted-foreground">如没有译者可留空</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="edition">
            版次
            <LabelKbd>n</LabelKbd>
          </Label>
          <Input
            id="edition"
            className="text-sm"
            placeholder="例如：1"
            value={data.edition}
            onChange={(e) =>
              setFormData((prev: any) => ({
                ...prev,
                data: { ...prev.data, edition: e.target.value } as BookData,
              }))
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="publisher">
            出版社
            <LabelKbd>c</LabelKbd>
          </Label>
          <Input
            id="publisher"
            className="text-sm"
            placeholder="例如：高等教育出版社"
            value={data.publisher}
            onChange={(e) =>
              setFormData((prev: any) => ({
                ...prev,
                data: { ...prev.data, publisher: e.target.value } as BookData,
              }))
            }
          />
        </div>

        <div className="space-y-2" id="book-publish-year">
          <Label htmlFor="publish_year">
            出版年份
            <LabelKbd>f</LabelKbd>
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
              setFormData((prev: any) => ({
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
          <LabelKbd>i</LabelKbd>
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
          <ButtonKbd>w</ButtonKbd>
        </Button>
        <p className="text-xs text-muted-foreground">
          支持 ISBN-10 和 ISBN-13 格式
        </p>
      </div>
    </div>
  );
}