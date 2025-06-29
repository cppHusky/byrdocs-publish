import { cn } from "@/lib/utils";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "../ui/command";
import { ChevronsUpDown, Check, X } from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { filterByPinyinSearch } from "@/lib/pinyin-search";

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
    "数学科学学院",
    "物理科学与技术学院"
  ];

// 学院多选组件
export function CollegeMultiSelect({
    selectedColleges,
    onCollegesChange,
    id,
  }: {
    selectedColleges: string[];
    id?: string;
    onCollegesChange: (colleges: string[]) => void;
  }) {
    const [open, setOpen] = useState(false);
    const [searchValue, setSearchValue] = useState("");

    // 过滤学院列表
    const filteredColleges = searchValue.trim() 
      ? filterByPinyinSearch(COLLEGES, searchValue, (college) => college)
      : COLLEGES;
  
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
      <div className="space-y-2" data-testid="college-multiselect">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild id={id}>
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
            <Command shouldFilter={false}>
              <CommandInput 
                placeholder="搜索学院..." 
                value={searchValue}
                onValueChange={setSearchValue}
              />
              <CommandList>
                <CommandEmpty>未找到学院</CommandEmpty>
                <CommandGroup className="max-h-64 overflow-auto">
                  {filteredColleges.map((college) => (
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