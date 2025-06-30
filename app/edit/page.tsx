import { requireAuth } from '@/lib/auth'
import { mergeFilesWithChanges } from './actions'
import { EditClient } from './edit-client'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export default async function EditPage() {
  await requireAuth()
  
  // Fetch merged files data
  const files = await mergeFilesWithChanges()

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Link 
          href="/" 
          className="inline-flex items-center mb-4 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          返回首页
        </Link>
      </div>
      
      <EditClient initialFiles={files} />
    </div>
  )
}