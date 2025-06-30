import { FormData, FileType, BookData, TestData, DocData } from './types';

export interface DisplayInfo {
  title: string;
  subtitle: string;
  fileType: FileType;
  typeLabel: string;
  typeColor: string;
}

// Helper function to generate display name for files (extracted from file-changes/actions.ts)
export function generateDisplayName(yamlData: FormData): string {
  try {
    if (!yamlData || !yamlData.type) {
      return yamlData?.id || 'Unknown';
    }

    // For books and docs, use title
    if (yamlData.type === 'book') {
      const bookData = yamlData.data as BookData;
      return bookData.title || yamlData.id;
    }
    
    if (yamlData.type === 'doc') {
      const docData = yamlData.data as DocData;
      return docData.title || yamlData.id;
    }

    // For tests, generate title based on time and course info
    if (yamlData.type === 'test' && yamlData.data) {
      const testData = yamlData.data as TestData;
      let time = testData.time?.start || '';
      
      if (testData.time?.start && testData.time?.end && testData.time.start !== testData.time.end) {
        time = `${testData.time.start}-${testData.time.end}`;
      }
      
      const semester = testData.time?.semester === 'First' ? ' 第一学期' : 
                       testData.time?.semester === 'Second' ? ' 第二学期' : '';
      
      const courseName = testData.course?.name || '';
      const stage = testData.time?.stage ? ' ' + testData.time.stage : '';
      
      const isAnswerOnly = testData.content?.length === 1 && testData.content[0] === '答案';
      const contentType = isAnswerOnly ? '答案' : '试卷';
      
      return `${time}${semester} ${courseName}${stage}${contentType}`;
    }

    return yamlData.id;
  } catch (error) {
    // If parsing fails, return ID
    return yamlData?.id || 'Unknown';
  }
}

// Get comprehensive display information for a file
export function getFileDisplayInfo(yamlData?: FormData, filename?: string): DisplayInfo {
  if (!yamlData) {
    return {
      title: filename || 'Unknown',
      subtitle: '',
      fileType: 'book', // default
      typeLabel: '文件',
      typeColor: 'text-gray-600 dark:text-gray-400'
    };
  }

  const data = yamlData.data;
  
  // Get type info
  const getTypeInfo = (type: FileType) => {
    switch (type) {
      case 'book':
        return {
          typeLabel: '书籍',
          typeColor: 'text-blue-600 dark:text-blue-400'
        };
      case 'test':
        return {
          typeLabel: '试卷',
          typeColor: 'text-green-600 dark:text-green-400'
        };
      case 'doc':
        return {
          typeLabel: '资料',
          typeColor: 'text-purple-600 dark:text-purple-400'
        };
      default:
        return {
          typeLabel: '文件',
          typeColor: 'text-gray-600 dark:text-gray-400'
        };
    }
  };

  const typeInfo = getTypeInfo(yamlData.type);
  const title = generateDisplayName(yamlData);
  
  let subtitle = '';
  
  if (yamlData.type === 'book') {
    const bookData = data as BookData;
    subtitle = bookData.authors?.filter(a => a.trim()).join(', ') || '';
  } else if (yamlData.type === 'test') {
    const testData = data as TestData;
    subtitle = testData.course?.name || '';
  } else if (yamlData.type === 'doc') {
    const docData = data as DocData;
    subtitle = docData.course?.map(c => c.name).join(', ') || '';
  }

  return {
    title,
    subtitle,
    fileType: yamlData.type,
    typeLabel: typeInfo.typeLabel,
    typeColor: typeInfo.typeColor
  };
}