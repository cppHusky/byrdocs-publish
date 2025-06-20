"use client";

import { useEffect } from "react";

export function ThemeWatcher() {
  useEffect(() => {
    // 获取当前系统主题
    const getSystemTheme = () => {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    };

    // 应用主题
    const applyTheme = (theme: 'dark' | 'light') => {
      const root = document.documentElement;
      if (theme === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    // 初始化主题
    const initialTheme = getSystemTheme();
    applyTheme(initialTheme);

    // 监听系统主题变化
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleThemeChange = (e: MediaQueryListEvent) => {
      const newTheme = e.matches ? 'dark' : 'light';
      applyTheme(newTheme);
    };

    // 添加监听器
    mediaQuery.addEventListener('change', handleThemeChange);

    // 清理函数
    return () => {
      mediaQuery.removeEventListener('change', handleThemeChange);
    };
  }, []);

  return null; // 这个组件不渲染任何内容
} 