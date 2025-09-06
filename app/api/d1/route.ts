import { NextRequest, NextResponse } from 'next/server'

const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_D1_API_TOKEN
const DATABASE_ID = 'fc7c9a6d-ca65-4768-b3f9-07ec5afb38c5'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const action = url.searchParams.get('action')
    
    if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
      return NextResponse.json(
        { error: 'Cloudflare credentials not configured' },
        { status: 500 }
      )
    }

    const d1ApiUrl = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/d1/database/${DATABASE_ID}/query`

    let query = ''
    
    switch (action) {
      case 'list':
      default:
        query = 'SELECT * FROM meetings ORDER BY date DESC'
        break
    }

    const response = await fetch(d1ApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sql: query,
        params: []
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('D1 API error:', errorText)
      return NextResponse.json(
        { error: `Failed to query D1: ${response.statusText}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    if (!data.success) {
      return NextResponse.json(
        { error: data.errors?.[0]?.message || 'Failed to query D1' },
        { status: 500 }
      )
    }

    // Format the response to match the expected meeting structure
    const meetings = data.result?.[0]?.results || []
    const formattedMeetings = meetings.map((meeting: any) => ({
      id: meeting.id,
      title: meeting.title,
      date: meeting.date,
      participants: meeting.participants || [],
      summary: meeting.summary,
      action_items: meeting.action_items || [],
      project_id: meeting.project_id,
      created_at: meeting.created_at,
      updated_at: meeting.updated_at,
      projects: meeting.project_id ? { 
        id: meeting.project_id, 
        name: meeting.project_name 
      } : null
    }))

    return NextResponse.json({ 
      meetings: formattedMeetings,
      error: null 
    })
  } catch (error) {
    console.error('Error querying D1:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to query D1 database' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, data } = body

    if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
      return NextResponse.json(
        { error: 'Cloudflare credentials not configured' },
        { status: 500 }
      )
    }

    const d1ApiUrl = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/d1/database/${DATABASE_ID}/query`

    let query = ''
    let params: any[] = []

    switch (action) {
      case 'create':
        query = `
          INSERT INTO meetings (title, date, participants, summary, action_items, project_id, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
          RETURNING *
        `
        params = [
          data.title,
          data.date,
          JSON.stringify(data.participants || []),
          data.summary,
          JSON.stringify(data.action_items || []),
          data.project_id
        ]
        break

      case 'update':
        query = `
          UPDATE meetings 
          SET title = ?, date = ?, participants = ?, summary = ?, action_items = ?, project_id = ?, updated_at = datetime('now')
          WHERE id = ?
          RETURNING *
        `
        params = [
          data.title,
          data.date,
          JSON.stringify(data.participants || []),
          data.summary,
          JSON.stringify(data.action_items || []),
          data.project_id,
          data.id
        ]
        break

      case 'delete':
        query = 'DELETE FROM meetings WHERE id = ?'
        params = [data.id]
        break

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    const response = await fetch(d1ApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sql: query,
        params
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('D1 API error:', errorText)
      return NextResponse.json(
        { error: `Failed to execute D1 operation: ${response.statusText}` },
        { status: response.status }
      )
    }

    const result = await response.json()
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.errors?.[0]?.message || 'Failed to execute D1 operation' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      data: result.result?.[0]?.results?.[0] || null,
      error: null 
    })
  } catch (error) {
    console.error('Error executing D1 operation:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to execute D1 operation' },
      { status: 500 }
    )
  }
}