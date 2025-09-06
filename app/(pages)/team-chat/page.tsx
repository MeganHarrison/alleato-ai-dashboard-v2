'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Search, 
  Share2, 
  Users, 
  FileText, 
  Upload, 
  MessageCircle,
  Sparkles,
  BookOpen
} from 'lucide-react';

// Supabase Dropzone components
import { Dropzone, DropzoneContent, DropzoneEmptyState } from '@/components/dropzone';
import { useSupabaseUploadService } from '@/hooks/use-supabase-upload-service';

// Realtime chat
import { RealtimeChat } from '@/components/realtime-chat';
import { useRealtimeChat } from '@/hooks/use-realtime-chat';

// File processing
import { FileTextExtractor } from '@/lib/text-extraction/file-processor';

interface SearchResult {
  id: number;
  content: string;
  metadata: any;
  similarity: number;
}

export default function CollaborativeSearchPage() {
  const [roomName, setRoomName] = useState('vector-search-room');
  const [username, setUsername] = useState('');
  const [hasJoined, setHasJoined] = useState(false);
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [status, setStatus] = useState('');

  // Ref to access chat functions
  const chatRef = useRef<{ shareSearchResults: any; shareDocument: any }>(null);

  // Use realtime chat hook directly for sharing
  const { shareSearchResults, shareDocument } = useRealtimeChat({
    roomName,
    username: username || 'Anonymous',
    onMessage: () => {}
  });

  // Dropzone for file uploads
  const dropzoneProps = useSupabaseUploadService({
    bucketName: 'documents',
    path: 'collaborative',
    allowedMimeTypes: [
      'text/plain',
      'text/markdown', 
      'text/csv',
      'application/pdf'
    ],
    maxFiles: 3,
    maxFileSize: 10 * 1024 * 1024,
    onUploadSuccess: handleFilesUploaded
  });

  // Handle file upload and processing
  async function handleFilesUploaded(uploadedFiles: any[]) {
    if (!uploadedFiles || uploadedFiles.length === 0) return;

    setStatus('Processing uploaded files...');
    
    for (const file of uploadedFiles) {
      try {
        // Extract text from the file
        const extracted = await FileTextExtractor.extractText(file);
        
        // Split text into chunks
        const chunks = FileTextExtractor.splitTextIntoChunks(extracted.content, {
          maxChunkSize: 1000,
          preserveStructure: true
        });

        // Store in vector database
        const documents = chunks.map((chunk, chunkIndex) => ({
          content: chunk,
          metadata: {
            ...extracted.metadata,
            chunkIndex,
            totalChunks: chunks.length,
            uploadedBy: username,
            room: roomName
          }
        }));

        const response = await fetch('/api/vector', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'storeBatch',
            documents
          })
        });

        const result = await response.json();

        if (result.success) {
          // Share the uploaded document in chat
          await shareDocument({
            fileName: file.name,
            fileType: file.type,
            wordCount: extracted.metadata.wordCount,
            preview: extracted.content.substring(0, 200)
          });
          
          setStatus(`✅ Processed and shared ${file.name}`);
        }
      } catch (error) {
        console.error(`Error processing ${file.name}:`, error);
        setStatus(`❌ Failed to process ${file.name}`);
      }
    }
  }

  // Perform vector search
  const handleSearch = useCallback(async () => {
    if (!query.trim()) {
      setStatus('Please enter a search query');
      return;
    }

    setIsSearching(true);
    setStatus('Searching...');
    setSearchResults([]);

    try {
      const response = await fetch('/api/vector', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'search',
          query,
          matchThreshold: 0.7,
          matchCount: 10
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setSearchResults(result.results || []);
        setStatus(`Found ${result.results?.length || 0} results`);
      } else {
        setStatus(`Search error: ${result.error}`);
      }
    } catch (error) {
      setStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSearching(false);
    }
  }, [query]);

  // Share search results in chat
  const handleShareResults = useCallback(async () => {
    if (searchResults.length === 0) return;
    
    await shareSearchResults(query, searchResults);
    setStatus('✅ Shared search results in chat');
  }, [query, searchResults, shareSearchResults]);

  // Handle room joining
  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim() && roomName.trim()) {
      setHasJoined(true);
    }
  };

  if (!hasJoined) {
    return (
      <div className="container mx-auto p-6 max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-6 w-6" />
              Join Collaborative Search Room
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleJoinRoom} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Your Name</label>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Room Name</label>
                <Input
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="Enter room name"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Share this room name with your team to collaborate
                </p>
              </div>
              <Button type="submit" className="w-full">
                Join Room
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Sparkles className="h-8 w-8" />
          Collaborative Vector Search
        </h1>
        <div className="text-muted-foreground mt-2 flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <Users className="h-3 w-3" />
            {roomName}
          </Badge>
          <span>•</span>
          <span>Search documents together and share insights in real-time</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Search and Upload Area */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="search" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="search" className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                Search
              </TabsTrigger>
              <TabsTrigger value="upload" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Upload
              </TabsTrigger>
            </TabsList>

            <TabsContent value="search" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Semantic Search</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter your search query..."
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                      className="flex-1"
                    />
                    <Button onClick={handleSearch} disabled={isSearching}>
                      {isSearching ? 'Searching...' : 'Search'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle>Search Results ({searchResults.length})</CardTitle>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleShareResults}
                        className="gap-2"
                      >
                        <Share2 className="h-4 w-4" />
                        Share in Chat
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {searchResults.slice(0, 5).map((result) => (
                        <Card key={result.id} className="border-l-4 border-blue-500">
                          <CardContent className="pt-4">
                            <div className="flex justify-between items-start mb-2">
                              <Badge variant="outline">ID: {result.id}</Badge>
                              <Badge variant="secondary">
                                {(result.similarity * 100).toFixed(0)}% match
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                              {result.content.substring(0, 200)}...
                            </p>
                            {result.metadata?.uploadedBy && (
                              <p className="text-xs text-muted-foreground mt-2">
                                Uploaded by: {result.metadata.uploadedBy}
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="upload" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Upload Documents</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Upload documents to make them searchable by your team
                  </p>
                </CardHeader>
                <CardContent>
                  <Dropzone {...dropzoneProps} className="min-h-[200px]">
                    <DropzoneEmptyState />
                    <DropzoneContent />
                  </Dropzone>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Status Messages */}
          {status && (
            <Alert>
              <AlertDescription>{status}</AlertDescription>
            </Alert>
          )}
        </div>

        {/* Realtime Chat Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <RealtimeChat
              roomName={roomName}
              username={username}
              height="calc(100vh - 200px)"
              showHeader={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
}