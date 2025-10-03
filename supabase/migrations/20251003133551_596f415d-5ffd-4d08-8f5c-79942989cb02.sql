-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  reputation_score DECIMAL(3,2) DEFAULT 0.0,
  completed_deals INTEGER DEFAULT 0,
  response_time_hours INTEGER DEFAULT 24,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create requests table
CREATE TABLE public.requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  offer_type TEXT NOT NULL CHECK (offer_type IN ('skill', 'item', 'money')),
  offer_value TEXT NOT NULL,
  prerequisites TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled')),
  views INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create badges table
CREATE TABLE public.badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  icon TEXT NOT NULL,
  description TEXT NOT NULL,
  criteria TEXT NOT NULL
);

-- Create user_badges table
CREATE TABLE public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- Create deals table
CREATE TABLE public.deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  accepter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'disputed', 'cancelled')),
  prerequisite_completed BOOLEAN DEFAULT false,
  requester_rating INTEGER CHECK (requester_rating >= 1 AND requester_rating <= 5),
  accepter_rating INTEGER CHECK (accepter_rating >= 1 AND accepter_rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for requests
CREATE POLICY "Requests are viewable by everyone"
  ON public.requests FOR SELECT
  USING (true);

CREATE POLICY "Users can create requests"
  ON public.requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own requests"
  ON public.requests FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own requests"
  ON public.requests FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for badges
CREATE POLICY "Badges are viewable by everyone"
  ON public.badges FOR SELECT
  USING (true);

-- RLS Policies for user_badges
CREATE POLICY "User badges are viewable by everyone"
  ON public.user_badges FOR SELECT
  USING (true);

-- RLS Policies for deals
CREATE POLICY "Users can view their own deals"
  ON public.deals FOR SELECT
  USING (auth.uid() = requester_id OR auth.uid() = accepter_id);

CREATE POLICY "Users can create deals"
  ON public.deals FOR INSERT
  WITH CHECK (auth.uid() = accepter_id);

CREATE POLICY "Users can update their deals"
  ON public.deals FOR UPDATE
  USING (auth.uid() = requester_id OR auth.uid() = accepter_id);

-- Trigger for profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_requests_updated_at
  BEFORE UPDATE ON public.requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_deals_updated_at
  BEFORE UPDATE ON public.deals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Insert default badges
INSERT INTO public.badges (name, icon, description, criteria) VALUES
('trusted', 'Award', 'Verified and trusted trader', '100% completion rate for 5+ deals'),
('fast-responder', 'Zap', 'Lightning fast responses', 'Average response time under 2 hours'),
('skill-master', 'Star', 'Master of their craft', 'Multiple 5-star ratings in one category'),
('fair-trader', 'Shield', 'Fair and honest', 'Helped resolve disputes as mediator'),
('prerequisite-ready', 'CheckCircle', 'Always prepared', 'Always fulfills prerequisites on time');