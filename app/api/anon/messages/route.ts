import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { topic_id, content } = body

        if (!topic_id || !content) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }

        // Verify topic exists and is active
        const { data: topic } = await supabaseAdmin
            .from('anon_topics')
            .select('id')
            .eq('id', topic_id)
            .eq('is_active', true)
            .single()

        if (!topic) {
            return NextResponse.json({ error: "Topic not found or inactive" }, { status: 404 })
        }

        const { data, error } = await supabaseAdmin
            .from('anon_messages')
            .insert([{ topic_id, content }])
            .select()
            .single()

        if (error) throw error

        return NextResponse.json({ message: data })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const topicId = searchParams.get('topicId')

    if (!topicId) return NextResponse.json({ error: "Missing topicId" }, { status: 400 })

    const { data, error } = await supabaseAdmin
        .from('anon_messages')
        .select('*')
        .eq('topic_id', topicId)
        .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ messages: data })
}

export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

    const { error } = await supabaseAdmin
        .from('anon_messages')
        .delete()
        .eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
}
