import { pinyin } from "pinyin";

// 将中文转换为拼音数组
export const getPinyinArray = (text: string): string[] => {
  try {
    const pinyinResult = pinyin(text, {
      heteronym: false,
      segment: true,
      style: "normal" as any
    });
    return pinyinResult.map(item => Array.isArray(item) ? item[0] : item).filter(Boolean);
  } catch (error) {
    return [];
  }
};

// 检查是否匹配拼音
export const matchesPinyin = (text: string, searchTerm: string): boolean => {
  const pinyinArray = getPinyinArray(text);
  if (pinyinArray.length === 0) return false;
  
  const searchLower = searchTerm.toLowerCase().trim();
  if (!searchLower) return false;
  
  // 处理空格分隔的搜索词
  const searchTerms = searchLower.split(/\s+/).filter(term => term.length > 0);
  
  // 如果只有一个搜索词，进行多种匹配模式
  if (searchTerms.length === 1) {
    const term = searchTerms[0];
    
    // 完整拼音匹配（连续）
    const fullPinyin = pinyinArray.join('').toLowerCase();
    if (fullPinyin.includes(term)) {
      return true;
    }
    
    // 拼音首字母匹配
    const pinyinInitials = pinyinArray.map(py => py.charAt(0)).join('').toLowerCase();
    if (pinyinInitials.includes(term)) {
      return true;
    }
    
    // 单个拼音匹配
    for (const py of pinyinArray) {
      if (py.toLowerCase().includes(term)) {
        return true;
      }
    }
    
    return false;
  }
  
  // 多个搜索词的情况，每个词都必须匹配
  for (const term of searchTerms) {
    let found = false;
    
    // 检查是否有拼音以该词开头
    for (const py of pinyinArray) {
      if (py.toLowerCase().startsWith(term)) {
        found = true;
        break;
      }
    }
    
    // 如果当前词没有找到匹配，返回 false
    if (!found) {
      return false;
    }
  }
  
  return true;
};

// 通用的拼音搜索过滤函数
export const filterByPinyinSearch = <T>(
  items: T[],
  searchTerm: string,
  getTextFromItem: (item: T) => string
): T[] => {
  if (!searchTerm.trim()) return items;
  
  return items.filter((item) => {
    const text = getTextFromItem(item);
    
    // 中文直接匹配
    if (text.toLowerCase().includes(searchTerm.toLowerCase())) {
      return true;
    }
    
    // 拼音匹配
    return matchesPinyin(text, searchTerm);
  });
}; 