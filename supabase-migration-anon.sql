-- =============================================
-- KOTAK ANONIM - Migration (Safe / Idempotent)
-- =============================================

-- 1. Drop old tables (CASCADE removes policies, triggers, indexes automatically)
DROP TABLE IF EXISTS anon_messages CASCADE;
DROP TABLE IF EXISTS anon_profiles CASCADE;
DROP TABLE IF EXISTS anon_topics CASCADE;

-- 2. Create new tables

CREATE TABLE anon_topics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    question_text TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE anon_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    topic_id UUID REFERENCES anon_topics(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    is_pinned BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Indexes
CREATE INDEX idx_anon_topics_user_id ON anon_topics(user_id);
CREATE INDEX idx_anon_topics_slug ON anon_topics(slug);
CREATE INDEX idx_anon_messages_topic_id ON anon_messages(topic_id);

-- 4. RLS

ALTER TABLE anon_topics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active topics" ON anon_topics
    FOR SELECT USING (is_active = true);

CREATE POLICY "Users can manage own topics" ON anon_topics
    FOR ALL USING (auth.uid() = user_id);

ALTER TABLE anon_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can send messages to active topics" ON anon_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM anon_topics
            WHERE id = topic_id AND is_active = true
        )
    );

CREATE POLICY "Users can manage messages of own topics" ON anon_messages
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM anon_topics
            WHERE id = anon_messages.topic_id AND user_id = auth.uid()
        )
    );

-- 5. Auto-update trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_anon_topics_updated_at
    BEFORE UPDATE ON anon_topics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
