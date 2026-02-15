import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string

// Use Service Role for admin actions to bypass RLS initially (or use RLS with authenticated user)
// Here we use service role for simplicity in API routes, but we should verify the user's session
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const slug = searchParams.get('slug')

    // Public access: fetch by slug
    if (slug) {
        const { data, error } = await supabaseAdmin
            .from('anon_topics')
            .select('id, title, question_text, slug, is_active')
            .eq('slug', slug)
            .eq('is_active', true)
            .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 404 })
        return NextResponse.json({ topic: data })
    }

    // Admin access: fetch all topics for a user
    if (userId) {
        // In a real app, verify session here!
        const { data, error } = await supabaseAdmin
            .from('anon_topics')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ topics: data })
    }

    return NextResponse.json({ error: "Missing userId or slug" }, { status: 400 })
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { user_id, title, question_text } = body

        if (!user_id || !title || !question_text) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }

        // Generate a random short slug (5 chars)
        const slug = Math.random().toString(36).substring(2, 7)

        const { data, error } = await supabaseAdmin
            .from('anon_topics')
            .insert([{
                user_id,
                title,
                question_text,
                slug,
                is_active: true
            }])
            .select()
            .single()

        if (error) throw error

        return NextResponse.json({ topic: data })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

    const { error } = await supabaseAdmin
        .from('anon_topics')
        .delete()
        .eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
}
