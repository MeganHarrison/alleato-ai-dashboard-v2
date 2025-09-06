'use client'

// TODO: Fix missing dropzone components
// import {
//   Dropzone,
//   DropzoneContent,
//   DropzoneEmptyState,
// } from '@/components/blocks/dropzone/components/dropzone'
// import { useSupabaseUpload } from '@/components/blocks/dropzone/hooks/use-supabase-upload'

const FileUploadDemo = () => {
  // const props = useSupabaseUpload({
  //   bucketName: 'test',
  //   path: 'test',
  //   allowedMimeTypes: ['image/*'],
  //   maxFiles: 2,
  //   maxFileSize: 1000 * 1000 * 10, // 10MB,
  // })

  return (
    <div className="w-[500px] p-8">
      <p>File upload component is temporarily disabled - missing dropzone components</p>
    </div>
  )
}

export default FileUploadDemo
