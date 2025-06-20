export type FileType = "book" | "test" | "doc";

export interface BookData {
  title: string;
  authors: string[];
  translators: string[];
  edition: string;
  publisher: string;
  publish_year: string;
  isbn: string[];
  filetype: string;
}

export interface TestData {
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

export interface DocData {
  title: string;
  filetype: string;
  course: Array<{
    type: string;
    name: string;
  }>;
  content: string[];
}

export interface FormData {
  id: string;
  url: string;
  type: FileType;
  data: BookData | TestData | DocData;
}
