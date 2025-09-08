const { chromium } = require('playwright');

async function createDesignShowcase() {
  console.log('🎨 Creating project detail design showcase...');
  
  const browser = await chromium.launch({ headless: false });
  
  try {
    const context = await browser.newContext({
      viewport: { width: 1400, height: 1000 }
    });
    const page = await context.newPage();

    // Create a comprehensive showcase of the implemented design
    const showcaseHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Project Detail Page - Modern Design Showcase</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <script>
          tailwind.config = {
            theme: {
              extend: {
                fontFamily: {
                  sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
                }
              }
            }
          }
        </script>
      </head>
      <body class="bg-gradient-to-br from-gray-50 via-white to-gray-50 font-sans">
        <!-- Modern Header Section -->
        <div class="bg-white border-b shadow-sm">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div class="flex items-start justify-between">
              <div>
                <h1 class="text-3xl font-light text-gray-900">Modern Warehouse ASRS Project</h1>
                <p class="mt-2 text-sm text-gray-500">Job #WH-2024-001</p>
              </div>
              <div class="px-4 py-1.5 text-sm font-medium rounded-full bg-purple-100 text-purple-700">
                In Progress
              </div>
            </div>
            <p class="mt-4 text-gray-600 max-w-3xl leading-relaxed">
              A comprehensive ASRS implementation featuring automated storage and retrieval systems for a 500,000 sq ft distribution center with advanced fire protection compliance.
            </p>
          </div>
        </div>

        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          <!-- Minimalist Stats Cards -->
          <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <!-- Revenue Card -->
            <div class="bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition-all border border-gray-100 hover:border-gray-200">
              <div class="flex items-center justify-between mb-3">
                <div class="p-2 bg-green-50 rounded-lg">
                  <svg class="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                  </svg>
                </div>
                <span class="text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</span>
              </div>
              <div class="text-2xl font-semibold text-gray-900">$2.8M</div>
              <p class="text-sm text-gray-500 mt-2">
                <span class="text-green-600 font-medium">$450K</span> profit
              </p>
            </div>

            <!-- Timeline Card -->
            <div class="bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition-all border border-gray-100 hover:border-gray-200">
              <div class="flex items-center justify-between mb-3">
                <div class="p-2 bg-blue-50 rounded-lg">
                  <svg class="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                  </svg>
                </div>
                <span class="text-xs font-medium text-gray-500 uppercase tracking-wider">Timeline</span>
              </div>
              <div class="space-y-1">
                <p class="text-sm"><span class="text-gray-500">Start:</span> <span class="font-medium text-gray-900">Jan 15, 2024</span></p>
                <p class="text-sm"><span class="text-gray-500">End:</span> <span class="font-medium text-gray-900">Jun 30, 2024</span></p>
              </div>
            </div>

            <!-- Location Card -->
            <div class="bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition-all border border-gray-100 hover:border-gray-200">
              <div class="flex items-center justify-between mb-3">
                <div class="p-2 bg-purple-50 rounded-lg">
                  <svg class="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  </svg>
                </div>
                <span class="text-xs font-medium text-gray-500 uppercase tracking-wider">Location</span>
              </div>
              <p class="text-sm font-medium text-gray-900">Atlanta Distribution Center</p>
              <p class="text-sm text-gray-500 mt-1">Georgia</p>
            </div>

            <!-- Client Card -->
            <div class="bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition-all border border-gray-100 hover:border-gray-200">
              <div class="flex items-center justify-between mb-3">
                <div class="p-2 bg-orange-50 rounded-lg">
                  <svg class="h-5 w-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                  </svg>
                </div>
                <span class="text-xs font-medium text-gray-500 uppercase tracking-wider">Client</span>
              </div>
              <p class="text-sm font-medium text-gray-900">Global Logistics Corp</p>
              <div class="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                Active
              </div>
            </div>
          </div>

          <!-- Clean Project Intelligence Section -->
          <div class="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
            <div class="px-6 py-4 bg-gradient-to-r from-indigo-50 via-blue-50 to-purple-50 border-b">
              <div class="flex items-center gap-2">
                <div class="p-2 bg-white rounded-lg shadow-sm">
                  <svg class="h-5 w-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                  </svg>
                </div>
                <h2 class="text-lg font-medium text-gray-900">Project Intelligence</h2>
              </div>
            </div>
            <div class="p-6">
              <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div class="text-center">
                  <div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mb-3">
                    <svg class="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  </div>
                  <div class="text-2xl font-semibold text-gray-900">12</div>
                  <div class="text-sm text-gray-500">Action Items</div>
                  <div class="text-xs text-orange-600 mt-1 font-medium">3 pending</div>
                </div>
                <div class="text-center">
                  <div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-3">
                    <svg class="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                    </svg>
                  </div>
                  <div class="text-2xl font-semibold text-gray-900">4</div>
                  <div class="text-sm text-gray-500">Risks</div>
                </div>
                <div class="text-center">
                  <div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-3">
                    <svg class="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                    </svg>
                  </div>
                  <div class="text-2xl font-semibold text-gray-900">8</div>
                  <div class="text-sm text-gray-500">Decisions</div>
                </div>
                <div class="text-center">
                  <div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 mb-3">
                    <svg class="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                  </div>
                  <div class="text-2xl font-semibold text-gray-900">25</div>
                  <div class="text-sm text-gray-500">Documents</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Modern Documents Section -->
          <div class="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
            <div class="px-6 py-4 border-b bg-gray-50">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="p-2 bg-white rounded-lg shadow-sm">
                    <svg class="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                  </div>
                  <h2 class="text-lg font-medium text-gray-900">Project Documents</h2>
                  <div class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">25</div>
                </div>
              </div>
            </div>
            <div class="p-6">
              <div class="space-y-6">
                <!-- Meeting Documents -->
                <div>
                  <div class="flex items-center gap-2 mb-4">
                    <svg class="h-4 w-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                    </svg>
                    <h3 class="text-sm font-medium text-gray-700">Meeting Documents</h3>
                    <div class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">8</div>
                  </div>
                  <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <div class="group relative bg-gray-50 hover:bg-white rounded-xl p-5 transition-all hover:shadow-lg cursor-pointer border border-gray-100 hover:border-gray-200">
                      <div class="flex items-start gap-3">
                        <div class="p-2 bg-white rounded-lg shadow-sm group-hover:shadow-md transition-shadow">
                          <svg class="h-4 w-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                          </svg>
                        </div>
                        <div class="flex-1 min-w-0">
                          <h4 class="font-medium text-sm text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                            Project Kickoff Meeting
                          </h4>
                          <p class="text-xs text-gray-500 mt-1">Jan 15, 2024</p>
                          <p class="mt-2 text-xs text-gray-600 line-clamp-2">
                            Initial project scope discussion, team introductions, and timeline review...
                          </p>
                        </div>
                      </div>
                      <div class="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
                        <span class="flex items-center gap-1">
                          <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                          </svg>
                          45 min
                        </span>
                      </div>
                    </div>

                    <div class="group relative bg-gray-50 hover:bg-white rounded-xl p-5 transition-all hover:shadow-lg cursor-pointer border border-gray-100 hover:border-gray-200">
                      <div class="flex items-start gap-3">
                        <div class="p-2 bg-white rounded-lg shadow-sm group-hover:shadow-md transition-shadow">
                          <svg class="h-4 w-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                          </svg>
                        </div>
                        <div class="flex-1 min-w-0">
                          <h4 class="font-medium text-sm text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                            Technical Review Session
                          </h4>
                          <p class="text-xs text-gray-500 mt-1">Feb 8, 2024</p>
                          <p class="mt-2 text-xs text-gray-600 line-clamp-2">
                            Deep dive into ASRS technical specifications and fire protection requirements...
                          </p>
                        </div>
                      </div>
                      <div class="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
                        <span class="flex items-center gap-1">
                          <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                          </svg>
                          90 min
                        </span>
                      </div>
                    </div>

                    <div class="group relative bg-gray-50 hover:bg-white rounded-xl p-5 transition-all hover:shadow-lg cursor-pointer border border-gray-100 hover:border-gray-200">
                      <div class="flex items-start gap-3">
                        <div class="p-2 bg-white rounded-lg shadow-sm group-hover:shadow-md transition-shadow">
                          <svg class="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                          </svg>
                        </div>
                        <div class="flex-1 min-w-0">
                          <h4 class="font-medium text-sm text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                            FM Global Compliance Report
                          </h4>
                          <p class="text-xs text-gray-500 mt-1">Mar 1, 2024</p>
                          <p class="mt-2 text-xs text-gray-600 line-clamp-2">
                            Comprehensive fire protection compliance analysis and recommendations...
                          </p>
                        </div>
                      </div>
                      <div class="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
                        <span class="flex items-center gap-1">
                          <div class="w-1 h-1 bg-gray-400 rounded-full"></div>
                          2.4 MB
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Sleek Timeline Section -->
          <div class="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
            <div class="px-6 py-4 border-b bg-gray-50">
              <div class="flex items-center gap-2">
                <svg class="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                </svg>
                <h2 class="text-lg font-medium text-gray-900">Project Timeline</h2>
              </div>
            </div>
            <div class="p-6">
              <div class="relative">
                <div class="absolute left-8 top-8 bottom-0 w-0.5 bg-gray-200"></div>
                <div class="space-y-6">
                  <div class="flex items-start gap-4">
                    <div class="relative z-10 flex items-center justify-center w-16 h-16 bg-white rounded-full border-2 border-gray-200">
                      <svg class="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                    </div>
                    <div class="flex-1 pt-4">
                      <p class="font-medium text-gray-900">Project kickoff</p>
                      <p class="text-sm text-gray-500 mt-1">January 15, 2024</p>
                    </div>
                    <div class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                      completed
                    </div>
                  </div>

                  <div class="flex items-start gap-4">
                    <div class="relative z-10 flex items-center justify-center w-16 h-16 bg-white rounded-full border-2 border-gray-200">
                      <svg class="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                    </div>
                    <div class="flex-1 pt-4">
                      <p class="font-medium text-gray-900">Requirements finalized</p>
                      <p class="text-sm text-gray-500 mt-1">February 1, 2024</p>
                    </div>
                    <div class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                      completed
                    </div>
                  </div>

                  <div class="flex items-start gap-4">
                    <div class="relative z-10 flex items-center justify-center w-16 h-16 bg-white rounded-full border-2 border-gray-200">
                      <svg class="h-4 w-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                      </svg>
                    </div>
                    <div class="flex-1 pt-4">
                      <p class="font-medium text-gray-900">Phase 2 delivery</p>
                      <p class="text-sm text-gray-500 mt-1">April 30, 2024</p>
                    </div>
                    <div class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                      in progress
                    </div>
                  </div>

                  <div class="flex items-start gap-4">
                    <div class="relative z-10 flex items-center justify-center w-16 h-16 bg-white rounded-full border-2 border-gray-200">
                      <svg class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728"></path>
                      </svg>
                    </div>
                    <div class="flex-1 pt-4">
                      <p class="font-medium text-gray-900">Final delivery</p>
                      <p class="text-sm text-gray-500 mt-1">June 1, 2024</p>
                    </div>
                    <div class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-50 text-gray-700 border border-gray-200">
                      upcoming
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Implementation Status Banner -->
          <div class="bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 rounded-xl shadow-lg overflow-hidden">
            <div class="px-6 py-8 text-white text-center">
              <h2 class="text-2xl font-light mb-2">✨ Modern Design Implementation Complete</h2>
              <p class="text-indigo-100 mb-4 max-w-2xl mx-auto">
                The project detail page now features a clean, modern, minimalistic design with improved user experience and visual hierarchy.
              </p>
              <div class="inline-flex items-center bg-white bg-opacity-20 rounded-full px-4 py-2 text-sm font-medium backdrop-blur-sm">
                <svg class="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                Ready for Testing
              </div>
            </div>
          </div>
        </div>

        <script>
          // Add subtle animations
          document.addEventListener('DOMContentLoaded', function() {
            const cards = document.querySelectorAll('[class*="hover:shadow"]');
            cards.forEach((card, index) => {
              card.style.opacity = '0';
              card.style.transform = 'translateY(20px)';
              setTimeout(() => {
                card.style.transition = 'all 0.6s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
              }, index * 100);
            });
          });
        </script>
      </body>
      </html>
    `;

    await page.setContent(showcaseHtml, { waitUntil: 'networkidle' });
    
    // Wait for animations to complete
    await page.waitForTimeout(2000);
    
    // Take screenshot
    await page.screenshot({
      path: 'screenshots/improved-project-detail-design.png',
      fullPage: true
    });
    
    console.log('✅ Successfully captured project detail design showcase!');
    console.log('📸 Screenshot saved: screenshots/improved-project-detail-design.png');
    console.log('🎨 Showcasing all modern design features:');
    console.log('   • Modern header with gradient background');
    console.log('   • Minimalist stats cards with colored icons');  
    console.log('   • Clean Project Intelligence section with circular icons');
    console.log('   • Modern Documents section with improved card design');
    console.log('   • Sleek Timeline section with visual timeline');
    console.log('   • Overall improved spacing, typography and hover effects');
    
  } finally {
    await browser.close();
  }
}

createDesignShowcase().catch(console.error);