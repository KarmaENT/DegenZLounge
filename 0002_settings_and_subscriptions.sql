-- Database schema update for DeGeNz Lounge - Add settings and subscription tables

-- Create settings table
CREATE TABLE IF NOT EXISTS user_settings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    theme VARCHAR(20) DEFAULT 'system',
    default_ai_model VARCHAR(50) DEFAULT 'gemini',
    save_history BOOLEAN DEFAULT TRUE,
    default_manager_mode VARCHAR(20) DEFAULT 'collaborative',
    default_conflict_resolution VARCHAR(20) DEFAULT 'manager',
    auto_save_sessions BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Create subscription plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    billing_cycle VARCHAR(20) NOT NULL, -- 'monthly', 'yearly'
    features JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create user subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id INTEGER NOT NULL REFERENCES subscription_plans(id),
    status VARCHAR(20) NOT NULL, -- 'active', 'canceled', 'expired'
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Create agent templates table
CREATE TABLE IF NOT EXISTS agent_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(100) NOT NULL,
    personality VARCHAR(100) NOT NULL,
    specialization VARCHAR(100),
    system_instructions TEXT NOT NULL,
    examples JSONB,
    is_public BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_plan_id ON user_subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_agent_templates_user_id ON agent_templates(user_id);

-- Create triggers to update updated_at timestamp
CREATE TRIGGER IF NOT EXISTS update_user_settings_updated_at
    BEFORE UPDATE ON user_settings
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_subscription_plans_updated_at
    BEFORE UPDATE ON subscription_plans
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_user_subscriptions_updated_at
    BEFORE UPDATE ON user_subscriptions
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_agent_templates_updated_at
    BEFORE UPDATE ON agent_templates
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- Insert sample data
-- Sample user settings
INSERT INTO user_settings (user_id, theme, default_ai_model, save_history, default_manager_mode, default_conflict_resolution, auto_save_sessions)
VALUES (1, 'dark', 'gemini', TRUE, 'collaborative', 'manager', TRUE);

-- Sample subscription plans
INSERT INTO subscription_plans (name, description, price, billing_cycle, features)
VALUES 
('Free', 'Basic access to DeGeNz Lounge features', 0.00, 'monthly', 
 '{"agent_limit": 3, "sandbox_limit": 1, "history_days": 7, "advanced_tools": false}'),
('Pro', 'Enhanced access with more agents and sandboxes', 9.99, 'monthly', 
 '{"agent_limit": 10, "sandbox_limit": 5, "history_days": 30, "advanced_tools": true}'),
('Enterprise', 'Unlimited access for professional teams', 29.99, 'monthly', 
 '{"agent_limit": -1, "sandbox_limit": -1, "history_days": -1, "advanced_tools": true}');

-- Sample user subscription
INSERT INTO user_subscriptions (user_id, plan_id, status, start_date, end_date)
VALUES (1, 2, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '30 days');

-- Sample agent templates
INSERT INTO agent_templates (name, role, personality, specialization, system_instructions, examples, is_public, user_id)
VALUES 
('Market Researcher', 'Research and Analysis', 'Analytical', 'Market Research', 
'You are a market research specialist who excels at gathering and analyzing information about markets, competitors, and consumer behavior. Your primary role is to find relevant data, statistics, and insights to support business decision-making. You should always cite your sources and provide evidence-based recommendations.', 
'[{"input": "What are the current trends in the electric vehicle market?", "output": "Based on my research, the current trends in the electric vehicle market include: 1) Increasing battery range and efficiency, 2) Expansion of charging infrastructure, 3) Growth in electric SUVs and trucks, 4) Government incentives driving adoption, and 5) Integration of advanced autonomous features. According to a 2024 BloombergNEF report, global EV sales are projected to reach 14 million units this year, representing approximately 18% of all vehicle sales worldwide."}]', 
TRUE, 1),

('Social Media Manager', 'Content Creation', 'Creative', 'Social Media', 
'You are a social media manager who specializes in creating engaging content for various platforms. You understand the unique characteristics of different social networks and can tailor content accordingly. Your writing should be concise, engaging, and optimized for each platform while maintaining brand voice consistency.', 
'[{"input": "Create a Twitter/X post announcing our new sustainable product line.", "output": "🌿 Introducing our NEW sustainable collection! 🌎\\n\\nEco-friendly materials. Ethical production. Endless style.\\n\\n♻️ Made from 100% recycled materials\\n🌱 Carbon-neutral shipping\\n💚 5% of profits support reforestation\\n\\nShop now and join the movement: [LINK] #SustainableFashion #EcoFriendly"}]', 
TRUE, 1);
