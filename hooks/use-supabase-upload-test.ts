import { createClient } from '@/lib/supabase/client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { type FileError, type FileRejection, useDropzone } from 'react-dropzone'

// Create a Supabase client that works without authentication for testing
const supabase = createClient()

interface FileWithPreview extends File {
  preview?: string
  errors: readonly FileError[]
}

type UseSupabaseUploadTestOptions = {
  bucketName: string
  path?: string
  allowedMimeTypes?: string[]
  maxFileSize?: number
  maxFiles?: number
  cacheControl?: number
  upsert?: boolean
  /**
   * Callback when files are successfully uploaded and processed
   */
  onUploadSuccess?: (files: FileWithPreview[]) => void
}

type UseSupabaseUploadTestReturn = ReturnType<typeof useSupabaseUploadTest>

/**
 * Test version of useSupabaseUpload that works without authentication
 * For testing purposes only - DO NOT use in production
 */
const useSupabaseUploadTest = (options: UseSupabaseUploadTestOptions) => {
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
          // Generate a unique filename to avoid conflicts
          const timestamp = Date.now()
          const uniqueFileName = `${timestamp}-${file.name}`
          const fullPath = path ? `${path}/${uniqueFileName}` : uniqueFileName

          console.log(`Uploading file: ${file.name} to path: ${fullPath}`)
          
          const { data, error } = await supabase.storage
            .from(bucketName)
            .upload(fullPath, file, {
              cacheControl: cacheControl.toString(),
              upsert,
            })

          if (error) {
            console.error('Upload error details:', {
              error,
              errorMessage: error.message || 'Unknown error',
              errorDetails: JSON.stringify(error),
              fileName: file.name,
              fullPath,
              bucketName
            })
            return { name: file.name, message: error.message || `Failed to upload ${file.name}` }
          } else {
            console.log('Upload successful:', { data, fileName: file.name, path: fullPath })
            return { name: file.name, message: undefined }
          }
        } catch (err) {
          console.error('Upload exception:', err)
          return { 
            name: file.name, 
            message: err instanceof Error ? err.message : 'Unknown upload error' 
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

    // Call success callback if all files uploaded successfully
    if (responseErrors.length === 0 && onUploadSuccess) {
      onUploadSuccess(filesToUpload)
    }

    setLoading(false)
  }, [files, path, bucketName, errors, successes, cacheControl, upsert, onUploadSuccess])

  // Auto-upload when files are added (optional behavior)
  useEffect(() => {
    if (files.length > 0 && files.every(f => f.errors.length === 0) && !loading && successes.length === 0) {
      // Auto-trigger upload for valid files
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
      const changed = false
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

export { useSupabaseUploadTest, type UseSupabaseUploadTestOptions, type UseSupabaseUploadTestReturn }