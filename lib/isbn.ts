import * as ISBN from "isbn3";


// ISBN 验证函数
export const validateISBN = (isbn: string): boolean => {
  const parsed = ISBN.parse(isbn);
  return !!(parsed && parsed.isValid);
};

// ISBN 格式化函数
export const formatISBN = (isbn: string): string => {
  const parsed = ISBN.parse(isbn);
  if (parsed && parsed.isValid) {
    return parsed.isbn13h || isbn;
  }
  return isbn;
};
