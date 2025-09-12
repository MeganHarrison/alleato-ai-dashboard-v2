'use client'

import { client } from '@/lib/management-api'
import { useQuery } from '@tanstack/react-query'

// GET Buckets
const getBuckets = async (projectRef: string) => {
  const { data, error } = await client.GET('/v1/projects/{ref}/storage/buckets', {
    params: {
      path: {
        ref: projectRef,
      },
    },
  })
  if (error) {
    throw error
  }

  return data
}

export const useGetBuckets = (projectRef: string) => {
  return useQuery({
    queryKey: ['buckets', projectRef],
    queryFn: () => getBuckets(projectRef),
    enabled: !!projectRef,
    retry: false,
  })
}

// LIST Objects
const listObjects = async ({ projectRef, bucketId }: { projectRef: string; bucketId: string }) => {
  // Note: This endpoint is not yet implemented in the API schema
  // Using type assertion to handle the missing endpoint
  const { data, error } = await (client.POST as (url: string, options: unknown) => Promise<{data?: unknown, error?: unknown}>)(
    '/v1/projects/{ref}/storage/buckets/{bucketId}/objects/list',
    {
      params: {
        path: {
          ref: projectRef,
          bucketId,
        },
      },
      body: {
        path: '',
        options: { limit: 100, offset: 0 },
      },
    }
  )
  if (error) {
    throw error
  }

  return data as any
}

export const useListObjects = (projectRef: string, bucketId: string) => {
  return useQuery({
    queryKey: ['objects', projectRef, bucketId],
    queryFn: () => listObjects({ projectRef, bucketId }),
    enabled: !!projectRef && !!bucketId,
  })
}
