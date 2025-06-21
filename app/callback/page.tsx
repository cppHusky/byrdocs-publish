'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function CallbackPage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (token) {
      localStorage.setItem('token', token);
      setStatus('success');
      
      // Try to close the window after storing the token
      setTimeout(() => {
        window.close();
      }, 100);
    } else {
      console.error('No token found in callback URL');
      setStatus('error');
      // Still try to close the window even if no token
      setTimeout(() => {
        window.close();
      }, 1000);
    }
  }, [searchParams]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        {status === 'processing' && (
          <>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-600">登录中...</p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <div className="rounded-full h-8 w-8 bg-green-500 flex items-center justify-center mx-auto mb-4">
              <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-green-600 font-medium mb-2">登录成功</p>
            <p className="text-gray-500 text-sm">窗口将自动关闭，如未关闭请手动关闭此窗口</p>
          </>
        )}
        
        {status === 'error' && (
          <>
            <div className="rounded-full h-8 w-8 bg-red-500 flex items-center justify-center mx-auto mb-4">
              <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-red-600 font-medium mb-2">登录失败</p>
            <p className="text-gray-500 text-sm">未找到有效的登录信息，请重新尝试</p>
          </>
        )}
      </div>
    </div>
  );
}
