import { useCallback } from 'react';

export function useArrayManipulation(setFormData: (data: any) => void) {
  const addArrayItem = useCallback((field: string, subField?: string) => {
    setFormData((prev: any) => {
      let newData;
      let newIndex;
      
      if (subField) {
        // @ts-ignore
        const currentArray = prev.data[field][subField] || [];
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
        const currentArray = prev.data[field] || [];
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
  }, [setFormData]);

  const removeArrayItem = useCallback((field: string, index: number, subField?: string) => {
    setFormData((prev: any) => {
      if (subField) {
        // @ts-ignore
        const currentArray = prev.data[field][subField] || [];
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
        const currentArray = prev.data[field] || [];
        return {
          ...prev,
          data: {
            ...prev.data,
            [field]: currentArray.filter((_: any, i: number) => i !== index)
          }
        };
      }
    });
  }, [setFormData]);

  const updateArrayItem = useCallback((
    field: string,
    index: number,
    value: string,
    subField?: string
  ) => {
    setFormData((prev: any) => {
      if (subField) {
        // @ts-ignore
        const currentArray = [...(prev.data[field][subField] || [])];
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
        const currentArray = [...(prev.data[field] || [])];
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
  }, [setFormData]);

  return {
    updateArrayItem,
    removeArrayItem,
    addArrayItem,
  };
}