-- Design Ref: §2.1 — Supabase Tables (9개 테이블)
-- Plan SC: 프로젝트 CRUD, 인터뷰 세션, 캐릭터/배경/보이스/다큐 에셋 관리

-- 1. profiles (사용자 프로필)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  birth_year INTEGER NOT NULL,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. projects (다큐 프로젝트)
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '나의 다큐멘터리',
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'interviewing', 'generating', 'completed', 'failed')),
  current_era TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. interviews (인터뷰 세션)
CREATE TABLE interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  era TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped')),
  langgraph_thread_id TEXT,
  messages JSONB DEFAULT '[]',
  summary TEXT,
  key_events JSONB DEFAULT '[]',
  emotions JSONB DEFAULT '[]',
  question_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. stories (서사 구조화 결과)
CREATE TABLE stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  era TEXT NOT NULL,
  narrative_script TEXT,
  scene_breakdown JSONB DEFAULT '[]',
  source_type TEXT NOT NULL DEFAULT 'interview'
    CHECK (source_type IN ('interview', 'template')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. characters (AI 캐릭터)
CREATE TABLE characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  face_image_url TEXT NOT NULL,
  character_image_url TEXT,
  style_preset TEXT DEFAULT 'cute_cartoon',
  generation_prompt TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. backgrounds (시대 배경)
CREATE TABLE backgrounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  era TEXT NOT NULL,
  era_year_range TEXT,
  era_context TEXT,
  image_url TEXT,
  generation_prompt TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. voices (보이스 설정)
CREATE TABLE voices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  voice_type TEXT NOT NULL CHECK (voice_type IN ('cloned', 'sample')),
  voice_id TEXT,
  sample_audio_url TEXT,
  consent_given BOOLEAN DEFAULT false,
  consent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. documentaries (생성된 다큐멘터리)
CREATE TABLE documentaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  era TEXT,
  video_url TEXT,
  thumbnail_url TEXT,
  duration_seconds INTEGER,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'generating', 'completed', 'failed')),
  generation_cost JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- 9. era_references (시대 참고 데이터)
CREATE TABLE era_references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year_start INTEGER NOT NULL,
  year_end INTEGER NOT NULL,
  era_label TEXT NOT NULL,
  events JSONB DEFAULT '[]',
  culture JSONB DEFAULT '{}',
  keywords TEXT[],
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS 정책
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE backgrounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE voices ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentaries ENABLE ROW LEVEL SECURITY;

-- profiles: 본인만 CRUD
CREATE POLICY "profiles_own" ON profiles FOR ALL USING (auth.uid() = id);

-- projects: 본인 프로젝트만
CREATE POLICY "projects_own" ON projects FOR ALL USING (auth.uid() = user_id);

-- interviews: 본인 프로젝트의 인터뷰만
CREATE POLICY "interviews_own" ON interviews FOR ALL
  USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

-- stories: 본인 프로젝트의 서사만
CREATE POLICY "stories_own" ON stories FOR ALL
  USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

-- characters: 본인 프로젝트의 캐릭터만
CREATE POLICY "characters_own" ON characters FOR ALL
  USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

-- backgrounds: 본인 프로젝트의 배경만
CREATE POLICY "backgrounds_own" ON backgrounds FOR ALL
  USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

-- voices: 본인 프로젝트의 보이스만
CREATE POLICY "voices_own" ON voices FOR ALL
  USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

-- documentaries: 본인 프로젝트의 다큐만
CREATE POLICY "documentaries_own" ON documentaries FOR ALL
  USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

-- era_references: 모든 인증 사용자 읽기 가능
ALTER TABLE era_references ENABLE ROW LEVEL SECURITY;
CREATE POLICY "era_references_read" ON era_references FOR SELECT USING (auth.uid() IS NOT NULL);

-- 인덱스
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_interviews_project_id ON interviews(project_id);
CREATE INDEX idx_stories_project_id ON stories(project_id);
CREATE INDEX idx_characters_project_id ON characters(project_id);
CREATE INDEX idx_backgrounds_project_id ON backgrounds(project_id);
CREATE INDEX idx_documentaries_project_id ON documentaries(project_id);
CREATE INDEX idx_era_references_years ON era_references(year_start, year_end);

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER interviews_updated_at BEFORE UPDATE ON interviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER stories_updated_at BEFORE UPDATE ON stories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
