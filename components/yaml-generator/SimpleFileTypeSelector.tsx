import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileType } from "@/lib/types";

interface SimpleFileTypeSelectorProps {
  selectedType: FileType;
  onTypeChange: (type: FileType) => void;
  disabled?: boolean;
}

export function SimpleFileTypeSelector({
  selectedType,
  onTypeChange,
  disabled = false,
}: SimpleFileTypeSelectorProps) {
  const fileTypes = [
    { value: "book", label: "书籍 (Book)" },
    { value: "test", label: "试题 (Test)" },
    { value: "doc", label: "资料 (Doc)" },
  ] as const;

  return (
    <div className="space-y-2">
      <Select
        value={selectedType}
        onValueChange={(value) => onTypeChange(value as FileType)}
        disabled={disabled}
      >
        <SelectTrigger id="file-type">
          <SelectValue placeholder="选择文件类型" />
        </SelectTrigger>
        <SelectContent>
          {fileTypes.map((type) => (
            <SelectItem key={type.value} value={type.value}>
              {type.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}