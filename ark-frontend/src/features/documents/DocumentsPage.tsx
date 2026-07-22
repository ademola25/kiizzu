import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FileText, Upload, Trash2, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/PageHeader'
import { Skeleton } from '@/components/ui/skeleton'
import api from '@/api/client'

interface Doc {
  id: number
  filename: string
  document_type: string
  file_size: number
  uploaded_at: string
}

function fileExt(name: string) {
  const m = /\.([a-z0-9]+)$/i.exec(name)
  return (m?.[1] || 'doc').toUpperCase()
}

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function DocumentsPage() {
  const queryClient = useQueryClient()
  const [uploading, setUploading] = useState(false)

  const { data: docs, isLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: async () => {
      const { data } = await api.get('/documents/')
      return data.results as Doc[]
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/documents/${id}/`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['documents'] }),
  })

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const { data } = await api.post('/documents/upload/', {
        filename: file.name,
        content_type: file.type,
        file_size: file.size,
        document_type: 'other',
      })
      await fetch(data.upload_url, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      })
      queryClient.invalidateQueries({ queryKey: ['documents'] })
    } catch {
      alert('Upload failed. Please try again.')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleDownload = async (id: number) => {
    const { data } = await api.get(`/documents/${id}/download/`)
    window.open(data.download_url, '_blank')
  }

  return (
    <>
      <PageHeader
        eyebrow="Vault"
        title="Documents"
        description="Lease, EJARI, and any other paperwork — encrypted and stored on AWS S3."
        action={
          <label className="cursor-pointer">
            <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleUpload} />
            <span className="inline-flex items-center gap-1.5 px-4 h-10 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.06)] transition-colors">
              <Upload size={15} />
              {uploading ? 'Uploading…' : 'Upload'}
            </span>
          </label>
        }
      />

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-16 rounded-2xl" />
          <Skeleton className="h-16 rounded-2xl" />
          <Skeleton className="h-16 rounded-2xl" />
        </div>
      ) : !docs?.length ? (
        <div className="surface-card text-center py-20 px-6">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-neutral-100 grid place-items-center mb-4">
            <FileText size={20} className="text-neutral-400" />
          </div>
          <h3 className="text-base font-semibold text-neutral-900">No documents yet</h3>
          <p className="text-sm text-neutral-500 mt-1.5 max-w-sm mx-auto">
            Upload your lease or EJARI certificate to keep them safe and in one place.
          </p>
        </div>
      ) : (
        <div className="surface-card divide-y divide-neutral-100">
          {docs.map((doc) => (
            <div key={doc.id} className="flex items-center gap-4 px-5 py-4 hover:bg-neutral-50/60 transition-colors first:rounded-t-2xl last:rounded-b-2xl">
              <div className="shrink-0 w-10 h-10 rounded-xl bg-primary-50 ring-1 ring-primary-100 grid place-items-center">
                <span className="text-[10px] font-semibold text-primary-700 num">{fileExt(doc.filename)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-neutral-900 truncate">{doc.filename}</div>
                <div className="text-xs text-neutral-500 mt-0.5 num">
                  {new Date(doc.uploaded_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  <span className="text-neutral-300 mx-1.5">·</span>
                  {formatSize(doc.file_size)}
                </div>
              </div>
              <div className="flex gap-1.5">
                <Button variant="outline" size="sm" onClick={() => handleDownload(doc.id)}>
                  <Eye size={14} className="mr-1" /> View
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { if (confirm('Delete this document?')) deleteMutation.mutate(doc.id) }}
                  className="text-danger-700 hover:bg-danger-50 hover:text-danger-700"
                  aria-label="Delete document"
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
