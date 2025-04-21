-- Initial database schema for DeGeNz Lounge

-- Drop tables if they exist
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS agent_sessions;
DROP TABLE IF EXISTS sandboxes;
DROP TABLE IF EXISTS agents;
DROP TABLE IF EXISTS users;

-- Create users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(256) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create agents table
CREATE TABLE agents (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(100) NOT NULL,
    personality VARCHAR(100) NOT NULL,
    specialization VARCHAR(100),
    system_instructions TEXT NOT NULL,
    examples JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE
);

-- Create sandboxes table
CREATE TABLE sandboxes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    mode VARCHAR(50) DEFAULT 'collaborative',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE
);

-- Create agent_sessions table (junction table for agents in sandboxes)
CREATE TABLE agent_sessions (
    id SERIAL PRIMARY KEY,
    sandbox_id INTEGER NOT NULL REFERENCES sandboxes(id) ON DELETE CASCADE,
    agent_id INTEGER NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    is_manager BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(sandbox_id, agent_id)
);

-- Create messages table
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    sandbox_id INTEGER NOT NULL REFERENCES sandboxes(id) ON DELETE CASCADE,
    sender_type VARCHAR(20) NOT NULL, -- 'user', 'agent', 'manager'
    sender_id INTEGER, -- user_id or agent_id
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_agents_user_id ON agents(user_id);
CREATE INDEX idx_sandboxes_user_id ON sandboxes(user_id);
CREATE INDEX idx_agent_sessions_sandbox_id ON agent_sessions(sandbox_id);
CREATE INDEX idx_agent_sessions_agent_id ON agent_sessions(agent_id);
CREATE INDEX idx_messages_sandbox_id ON messages(sandbox_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to update updated_at timestamp
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_agents_updated_at
    BEFORE UPDATE ON agents
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_sandboxes_updated_at
    BEFORE UPDATE ON sandboxes
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- Insert sample data
-- Sample user
INSERT INTO users (username, email, password_hash)
VALUES ('demo', 'demo@example.com', '$2b$12$1JE/BtmCfhWoKlPhMujJIe0g0KA.C9G./XbUeKdWoP1riMYTNGZae'); -- password: password123

-- Sample agents
INSERT INTO agents (name, role, personality, specialization, system_instructions, examples, user_id)
VALUES 
('Researcher', 'Research and Analysis', 'Analytical', 'Market Research', 
'You are a research specialist who excels at gathering and analyzing information. Your primary role is to find relevant data, statistics, and insights to support decision-making. You should always cite your sources and provide evidence-based recommendations.', 
'[{"input": "What are the current trends in sustainable fashion?", "output": "Based on my research, the current trends in sustainable fashion include: 1) Use of recycled materials, 2) Circular fashion models, 3) Transparency in supply chains, 4) Water conservation technologies, and 5) Plant-based alternatives to animal products. According to a 2024 McKinsey report, 67% of consumers now consider sustainability when making fashion purchases, up from 45% in 2020."}]', 
1),

('Copywriter', 'Content Creation', 'Creative', 'Marketing Copy', 
'You are a creative copywriter who specializes in crafting compelling marketing messages. Your writing should be engaging, persuasive, and tailored to the target audience. Focus on benefits rather than features and use emotional appeals when appropriate.', 
'[{"input": "Write a slogan for eco-friendly shoes made from recycled ocean plastic.", "output": "\"Walk On Waves: Every Step Saves Our Seas\" - This slogan connects the product (shoes) with its source material (ocean plastic) while emphasizing the environmental impact. It creates an emotional image of walking on the very waves you\'re helping to protect."}]', 
1),

('Designer', 'Visual Design', 'Creative', 'Packaging Design', 
'You are a visual designer who specializes in creating attractive and functional designs. Your work should balance aesthetics with usability and align with brand guidelines. Consider sustainability, accessibility, and cultural context in your design recommendations.', 
'[{"input": "Suggest packaging ideas for eco-friendly shoes.", "output": "For eco-friendly shoes, I recommend: 1) Minimalist shoebox made from recycled cardboard with soy-based inks, 2) Reusable cotton drawstring bag that can be repurposed, 3) Modular packaging that transforms into a shoe rack or storage solution, 4) Seed-embedded packaging that can be planted after use. Each option should use earth tones and natural textures with clear sustainability messaging and QR codes linking to impact metrics."}]', 
1);

-- Sample sandbox
INSERT INTO sandboxes (name, description, mode, user_id)
VALUES ('Eco-Friendly Shoe Launch', 'Planning session for new eco-friendly shoe product launch', 'collaborative', 1);

-- Add agents to sandbox
INSERT INTO agent_sessions (sandbox_id, agent_id, is_manager)
VALUES 
(1, 1, false), -- Researcher
(1, 2, false), -- Copywriter
(1, 3, false); -- Designer

-- Sample messages
INSERT INTO messages (sandbox_id, sender_type, sender_id, content)
VALUES 
(1, 'user', 1, 'I need to plan a marketing campaign for our new eco-friendly shoe line made from recycled ocean plastic.'),
(1, 'manager', 0, 'I''ll help coordinate our team to develop a comprehensive marketing plan for your eco-friendly shoe line. Let me assign specific tasks to each specialist.'),
(1, 'manager', 0, '@Researcher: Please analyze the current market for sustainable footwear and identify key consumer segments and competitors.'),
(1, 'agent', 1, 'I''ll conduct a thorough market analysis for sustainable footwear. Based on preliminary research, the global sustainable footwear market was valued at $7.5 billion in 2023 and is projected to reach $12.8 billion by 2027. Key consumer segments include environmentally conscious millennials (35%), Gen Z (28%), and health-focused Gen X (22%). Major competitors include Allbirds, Veja, and Adidas with their Parley line. I''ll provide a more detailed report on consumer preferences, price points, and distribution channels.'),
(1, 'manager', 0, '@Copywriter: Please develop potential slogans and key messaging that highlights the ocean plastic recycling aspect of the shoes.'),
(1, 'agent', 2, 'Here are some potential slogans for the eco-friendly shoe line:\n\n1. "Ocean Soles: Every Step Saves Our Seas"\n2. "From Waves to Pathways: Walk the Change"\n3. "Tread Lightly, Impact Greatly"\n4. "Plastic Waste to Perfect Wear"\n5. "Step Forward, Ocean Plastic Backward"\n\nKey messaging should emphasize:\n- Each pair recycles X plastic bottles from oceans\n- Comfort meets conservation\n- Walking in these shoes actively reduces ocean pollution\n- Style that doesn''t sacrifice sustainability\n- Part of proceeds support ocean cleanup initiatives');
