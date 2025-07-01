import { requireAuth } from '@/lib/auth'
import { mergeFilesWithChanges } from './actions'
import { EditClient } from './edit-client'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export default async function EditPage() {
  await requireAuth('/edit')
  
  // Fetch merged files data
  const files = await mergeFilesWithChanges()

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <EditClient initialFiles={files} />
    </div>
  )
}