import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import AuthModal from '@/components/AuthModal';
import UploadModal from '@/components/UploadModal';
import VideoPlayer from '@/components/VideoPlayer';

interface Video {
  id: number;
  title: string;
  video_url: string;
  thumbnail_url?: string;
  duration: number;
  is_short: boolean;
  views_count: number;
  created_at: string;
  user: {
    id: number;
    username: string;
    display_name: string;
    avatar_url?: string;
  };
}

const Index = () => {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [showTutorial, setShowTutorial] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [currentTab, setCurrentTab] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('youbube_tutorial_seen');
    if (!hasSeenTutorial && !user) {
      setShowTutorial(true);
    }
  }, [user]);

  useEffect(() => {
    loadVideos();
  }, [currentTab]);

  const loadVideos = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (currentTab === 'shorts') {
        params.append('is_short', 'true');
      }
      
      const response = await fetch(`https://functions.poehali.dev/57bee18d-e91a-47cd-b31a-bcc1ecc7ea56?${params}`);
      const data = await response.json();
      setVideos(data.videos || []);
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить видео',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const closeTutorial = () => {
    localStorage.setItem('youbube_tutorial_seen', 'true');
    setShowTutorial(false);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatViews = (count: number) => {
    if (count === 0) return '0 просмотров';
    if (count === 1) return '1 просмотр';
    if (count < 1000) return `${count} просмотров`;
    if (count < 1000000) return `${(count / 1000).toFixed(1)}K просмотров`;
    return `${(count / 1000000).toFixed(1)}M просмотров`;
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins} минут назад`;
    if (diffHours < 24) return `${diffHours} часов назад`;
    if (diffDays === 1) return '1 день назад';
    if (diffDays < 7) return `${diffDays} дней назад`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} недель назад`;
    return `${Math.floor(diffDays / 30)} месяцев назад`;
  };

  const handleVideoClick = (video: Video) => {
    setSelectedVideo(video);
  };

  const handleUploadClick = () => {
    if (!user) {
      setShowAuthModal(true);
      toast({
        title: 'Требуется авторизация',
        description: 'Войдите или зарегистрируйтесь, чтобы загрузить видео'
      });
    } else {
      setShowUploadModal(true);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-2xl font-heading font-bold gradient-text cursor-pointer" onClick={() => setCurrentTab('home')}>
              YouBube
            </h1>
            <nav className="hidden md:flex gap-1">
              <Button
                variant={currentTab === 'home' ? 'default' : 'ghost'}
                onClick={() => setCurrentTab('home')}
                className="gap-2"
              >
                <Icon name="Home" size={18} />
                Главная
              </Button>
              <Button
                variant={currentTab === 'shorts' ? 'default' : 'ghost'}
                onClick={() => setCurrentTab('shorts')}
                className="gap-2"
              >
                <Icon name="PlaySquare" size={18} />
                Shorts
              </Button>
              <Button
                variant={currentTab === 'subscriptions' ? 'default' : 'ghost'}
                onClick={() => setCurrentTab('subscriptions')}
                className="gap-2"
              >
                <Icon name="Video" size={18} />
                Подписки
              </Button>
              <Button
                variant={currentTab === 'history' ? 'default' : 'ghost'}
                onClick={() => setCurrentTab('history')}
                className="gap-2"
              >
                <Icon name="Clock" size={18} />
                История
              </Button>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative hidden sm:block">
              <Icon name="Search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Поиск видео и каналов..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64 lg:w-96"
              />
            </div>
            <Button size="sm" className="gap-2 gradient-primary text-white" onClick={handleUploadClick}>
              <Icon name="Upload" size={18} />
              <span className="hidden sm:inline">Загрузить</span>
            </Button>
            <Button variant="ghost" size="icon">
              <Icon name="Settings" size={20} />
            </Button>
            {user ? (
              <Button variant="ghost" size="icon" onClick={logout}>
                <Icon name="LogOut" size={20} />
              </Button>
            ) : (
              <Button variant="ghost" size="icon" onClick={() => setShowAuthModal(true)}>
                <Icon name="User" size={20} />
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container py-8">
        {currentTab === 'shorts' && (
          <div className="mb-8 animate-slide-up">
            <h2 className="text-3xl font-heading font-bold mb-2">Shorts</h2>
            <p className="text-muted-foreground">Короткие вертикальные видео до 60 секунд</p>
          </div>
        )}

        {loading ? (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Card key={i} className="overflow-hidden animate-pulse">
                <div className="aspect-video bg-muted"></div>
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-muted rounded"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </div>
              </Card>
            ))}
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center py-20">
            <Icon name="Video" size={64} className="mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-2xl font-heading font-bold mb-2">Видео не найдены</h3>
            <p className="text-muted-foreground mb-6">Будьте первым, кто загрузит видео на YouBube!</p>
            <Button className="gradient-primary text-white" onClick={handleUploadClick}>
              <Icon name="Upload" size={18} className="mr-2" />
              Загрузить видео
            </Button>
          </div>
        ) : (
          <div className={`grid gap-6 ${currentTab === 'shorts' ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}>
            {videos.map((video, idx) => (
              <Card
                key={video.id}
                className="group cursor-pointer hover-lift overflow-hidden animate-scale-in"
                style={{ animationDelay: `${idx * 50}ms` }}
                onClick={() => handleVideoClick(video)}
              >
                <div className={`relative ${currentTab === 'shorts' ? 'aspect-[9/16]' : 'aspect-video'} ${video.thumbnail_url ? '' : 'gradient-primary'} flex items-center justify-center bg-muted`}>
                  {video.thumbnail_url ? (
                    <img src={video.thumbnail_url} alt={video.title} className="w-full h-full object-cover" />
                  ) : (
                    <Icon name="Video" size={48} className="text-white opacity-50" />
                  )}
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:scale-110">
                      <Icon name="Play" size={28} className="ml-1 text-primary" />
                    </div>
                  </div>
                  <Badge className="absolute bottom-2 right-2 bg-black/80 text-white">
                    {formatDuration(video.duration)}
                  </Badge>
                </div>
                <div className="p-3">
                  <div className="flex gap-3">
                    <Avatar className="h-9 w-9 flex-shrink-0">
                      <AvatarFallback className="gradient-primary text-white text-xs">
                        {video.user.display_name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm line-clamp-2 mb-1">
                        {video.title}
                      </h3>
                      <p className="text-xs text-muted-foreground">{video.user.display_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatViews(video.views_count)} · {formatTimeAgo(video.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Dialog open={showTutorial} onOpenChange={setShowTutorial}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-heading gradient-text">
              Добро пожаловать на YouBube! 🎉
            </DialogTitle>
            <DialogDescription className="text-base">
              Давайте быстро покажем, как пользоваться платформой
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="aspect-video gradient-accent rounded-lg flex items-center justify-center">
              <div className="text-center text-white">
                <Icon name="Play" size={64} className="mx-auto mb-4 opacity-80" />
                <p className="text-lg font-semibold">Видео-туториал</p>
                <p className="text-sm opacity-90">Добро пожаловать на YouBube!</p>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="flex gap-4 items-start p-4 rounded-lg bg-muted/50">
                <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center flex-shrink-0">
                  <Icon name="Video" size={20} className="text-white" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Смотрите видео</h4>
                  <p className="text-sm text-muted-foreground">
                    Выбирайте из тысяч видео и shorts от авторов со всего мира
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start p-4 rounded-lg bg-muted/50">
                <div className="w-10 h-10 rounded-full gradient-accent flex items-center justify-center flex-shrink-0">
                  <Icon name="Upload" size={20} className="text-white" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Загружайте контент</h4>
                  <p className="text-sm text-muted-foreground">
                    Создайте канал и делитесь своими видео с миллионами зрителей
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start p-4 rounded-lg bg-muted/50">
                <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center flex-shrink-0">
                  <Icon name="Heart" size={20} className="text-white" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Взаимодействуйте</h4>
                  <p className="text-sm text-muted-foreground">
                    Ставьте лайки, комментируйте и подписывайтесь на любимые каналы
                  </p>
                </div>
              </div>
            </div>

            <Button onClick={closeTutorial} className="w-full gradient-primary text-white" size="lg">
              Понятно, начнём! 🚀
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AuthModal open={showAuthModal} onClose={() => setShowAuthModal(false)} onSuccess={() => {
        setShowAuthModal(false);
        loadVideos();
      }} />
      
      <UploadModal open={showUploadModal} onClose={() => setShowUploadModal(false)} onSuccess={() => {
        setShowUploadModal(false);
        loadVideos();
      }} />

      {selectedVideo && (
        <VideoPlayer video={selectedVideo} onClose={() => setSelectedVideo(null)} onUpdate={loadVideos} />
      )}
    </div>
  );
};

export default Index;
