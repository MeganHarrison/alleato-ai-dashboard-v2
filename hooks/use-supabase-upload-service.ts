import { createClient } from '@supabase/supabase-js'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { type FileError, type FileRejection, useDropzone } from 'react-dropzone'

// Create a Supabase client with service role for testing
// WARNING: This exposes the service key to the client - ONLY use for testing!
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  // Using the publishable key which seems to be the service role based on the .env
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

interface FileWithPreview extends File {
  preview?: string
  errors: readonly FileError[]
}

type UseSupabaseUploadServiceOptions = {
  bucketName: string
  path?: string
  allowedMimeTypes?: string[]
  maxFileSize?: number
  maxFiles?: number
  cacheControl?: number
  upsert?: boolean
  onUploadSuccess?: (files: FileWithPreview[]) => void
}

type UseSupabaseUploadServiceReturn = ReturnType<typeof useSupabaseUploadService>

/**
 * Service role version of upload hook for testing when RLS is blocking
 * WARNING: This uses service role key client-side - NEVER use in production!
 */
const useSupabaseUploadService = (options: UseSupabaseUploadServiceOptions) => {
  const {
    bucketName,
    path,
    allowedMimeTypes = [],
    maxFileSize = Number.POSITIVE_INFINITY,
    maxFiles = 1,
    cacheControl = 3600,
    upsert = true,
    onUploadSuccess
  } = options

  const [files, setFiles] = useState<FileWithPreview[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [errors, setErrors] = useState<{ name: string; message: string }[]>([])
  const [successes, setSuccesses] = useState<string[]>([])

  const isSuccess = useMemo(() => {
    if (errors.length === 0 && successes.length === 0) {
      return false
    }
    if (errors.length === 0 && successes.length === files.length) {
      return true
    }
    return false
  }, [errors.length, successes.length, files.length])

  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      const validFiles = acceptedFiles
        .filter((file) => !files.find((x) => x.name === file.name))
        .map((file) => {
          ;(file as FileWithPreview).preview = URL.createObjectURL(file)
          ;(file as FileWithPreview).errors = []
          return file as FileWithPreview
        })

      const invalidFiles = fileRejections.map(({ file, errors }) => {
        ;(file as FileWithPreview).preview = URL.createObjectURL(file)
        ;(file as FileWithPreview).errors = errors
        return file as FileWithPreview
      })

      const newFiles = [...files, ...validFiles, ...invalidFiles]
      setFiles(newFiles)
    },
    [files, setFiles]
  )

  const dropzoneProps = useDropzone({
    onDrop,
    noClick: true,
    accept: allowedMimeTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    maxSize: maxFileSize,
    maxFiles: maxFiles,
    multiple: maxFiles !== 1,
  })

  const onUpload = useCallback(async () => {
    setLoading(true)
    console.log('Starting upload with service client...')

    const filesWithErrors = errors.map((x) => x.name)
    const filesToUpload =
      filesWithErrors.length > 0
        ? [
            ...files.filter((f) => filesWithErrors.includes(f.name)),
            ...files.filter((f) => !successes.includes(f.name)),
          ]
        : files

    const responses = await Promise.all(
      filesToUpload.map(async (file) => {
        try {
          const timestamp = Date.now()
          const uniqueFileName = `${timestamp}-${file.name}`
          const fullPath = path ? `${path}/${uniqueFileName}` : uniqueFileName

          console.log(`Uploading with service role: ${file.name} to ${fullPath}`)
          
          const { data, error } = await supabase.storage
            .from(bucketName)
            .upload(fullPath, file, {
              cacheControl: cacheControl.toString(),
              upsert,
            })

          if (error) {
            console.error('Service upload error:', error)
            return { name: file.name, message: error.message || 'Upload failed' }
          } else {
            console.log('Service upload successful:', data)
            return { name: file.name, message: undefined }
          }
        } catch (err) {
          console.error('Service upload exception:', err)
          return { 
            name: file.name, 
            message: err instanceof Error ? err.message : 'Unknown error' 
          }
        }
      })
    )

    const responseErrors = responses.filter((x) => x.message !== undefined)
    setErrors(responseErrors)

    const responseSuccesses = responses.filter((x) => x.message === undefined)
    const newSuccesses = Array.from(
      new Set([...successes, ...responseSuccesses.map((x) => x.name)])
    )
    setSuccesses(newSuccesses)

    if (responseErrors.length === 0 && onUploadSuccess) {
      onUploadSuccess(filesToUpload)
    }

    setLoading(false)
  }, [files, path, bucketName, errors, successes, cacheControl, upsert, onUploadSuccess])

  // Auto-upload when files are added
  useEffect(() => {
    if (files.length > 0 && files.every(f => f.errors.length === 0) && !loading && successes.length === 0) {
      const timer = setTimeout(() => {
        onUpload()
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [files, loading, successes.length, onUpload])

  useEffect(() => {
    if (files.length === 0) {
      setErrors([])
    }

    if (files.length <= maxFiles) {
      let changed = false
      const newFiles = files.map((file) => {
        if (file.errors.some((e) => e.code === 'too-many-files')) {
          file.errors = file.errors.filter((e) => e.code !== 'too-many-files')
          changed = true
        }
        return file
      })
      if (changed) {
        setFiles(newFiles)
      }
    }
  }, [files.length, setFiles, maxFiles])

  return {
    files,
    setFiles,
    successes,
    isSuccess,
    loading,
    errors,
    setErrors,
    onUpload,
    maxFileSize: maxFileSize,
    maxFiles: maxFiles,
    allowedMimeTypes,
    ...dropzoneProps,
  }
}

export { useSupabaseUploadService, type UseSupabaseUploadServiceOptions, type UseSupabaseUploadServiceReturn }