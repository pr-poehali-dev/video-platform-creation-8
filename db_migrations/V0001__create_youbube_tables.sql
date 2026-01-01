-- Создание таблиц для видео-платформы YouBube

-- Таблица пользователей
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100),
    channel_description TEXT,
    avatar_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица видео
CREATE TABLE IF NOT EXISTS videos (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    video_url VARCHAR(500) NOT NULL,
    thumbnail_url VARCHAR(500),
    duration INTEGER NOT NULL,
    is_short BOOLEAN DEFAULT false,
    views_count INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица комментариев
CREATE TABLE IF NOT EXISTS comments (
    id SERIAL PRIMARY KEY,
    video_id INTEGER REFERENCES videos(id),
    user_id INTEGER REFERENCES users(id),
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица лайков
CREATE TABLE IF NOT EXISTS likes (
    id SERIAL PRIMARY KEY,
    video_id INTEGER REFERENCES videos(id),
    user_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(video_id, user_id)
);

-- Таблица подписок
CREATE TABLE IF NOT EXISTS subscriptions (
    id SERIAL PRIMARY KEY,
    subscriber_id INTEGER REFERENCES users(id),
    channel_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(subscriber_id, channel_id)
);

-- Таблица просмотров для отслеживания в реальном времени
CREATE TABLE IF NOT EXISTS views (
    id SERIAL PRIMARY KEY,
    video_id INTEGER REFERENCES videos(id),
    user_id INTEGER REFERENCES users(id),
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_videos_user_id ON videos(user_id);
CREATE INDEX IF NOT EXISTS idx_videos_created_at ON videos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_video_id ON comments(video_id);
CREATE INDEX IF NOT EXISTS idx_likes_video_id ON likes(video_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_subscriber ON subscriptions(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_channel ON subscriptions(channel_id);
CREATE INDEX IF NOT EXISTS idx_views_video_id ON views(video_id);