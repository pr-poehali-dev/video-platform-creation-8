import { useState, useEffect } from 'react';
import { Home, Video, PlaySquare, Clock, Search, User, Settings, Upload } from 'lucide-react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

const mockVideos = [
  { id: 1, title: 'Как создать свой первый канал на YouBube', channel: 'YouBube Академия', views: '125K', time: '2 дня назад', duration: '12:34', thumbnail: 'gradient-primary', isShort: false },
  { id: 2, title: 'Топ 10 фишек редактора видео', channel: 'Креатив Pro', views: '89K', time: '5 дней назад', duration: '18:22', thumbnail: 'gradient-accent', isShort: false },
  { id: 3, title: 'Секрет вирусных роликов', channel: 'Блогер School', views: '234K', time: '1 неделю назад', duration: '9:45', thumbnail: 'gradient-primary', isShort: false },
  { id: 4, title: 'Быстрый монтаж за 60 секунд', channel: 'Быстро и четко', views: '45K', time: '3 часа назад', duration: '0:58', thumbnail: 'gradient-accent', isShort: true },
  { id: 5, title: 'Лайфхак для YouTubers', channel: 'ProTips', views: '67K', time: '1 день назад', duration: '0:42', thumbnail: 'gradient-primary', isShort: true },
  { id: 6, title: 'Обзор новых функций YouBube', channel: 'Tech Review', views: '156K', time: '4 дня назад', duration: '15:30', thumbnail: 'gradient-accent', isShort: false },
];

const Index = () => {
  const [showTutorial, setShowTutorial] = useState(false);
  const [currentTab, setCurrentTab] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('youbube_tutorial_seen');
    if (!hasSeenTutorial) {
      setShowTutorial(true);
    }
  }, []);

  const closeTutorial = () => {
    localStorage.setItem('youbube_tutorial_seen', 'true');
    setShowTutorial(false);
  };

  const filteredVideos = currentTab === 'shorts' 
    ? mockVideos.filter(v => v.isShort)
    : currentTab === 'home'
    ? mockVideos
    : mockVideos.filter(v => !v.isShort);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-2xl font-heading font-bold gradient-text">YouBube</h1>
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
            <Button size="sm" className="gap-2 gradient-primary text-white">
              <Icon name="Upload" size={18} />
              <span className="hidden sm:inline">Загрузить</span>
            </Button>
            <Button variant="ghost" size="icon">
              <Icon name="Settings" size={20} />
            </Button>
            <Button variant="ghost" size="icon">
              <Icon name="User" size={20} />
            </Button>
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

        <div className={`grid gap-6 ${currentTab === 'shorts' ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}>
          {filteredVideos.map((video, idx) => (
            <Card
              key={video.id}
              className="group cursor-pointer hover-lift overflow-hidden animate-scale-in"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <div className={`relative ${currentTab === 'shorts' ? 'aspect-[9/16]' : 'aspect-video'} ${video.thumbnail} flex items-center justify-center`}>
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:scale-110">
                    <Icon name="Play" size={28} className="ml-1 text-primary" />
                  </div>
                </div>
                <Badge className="absolute bottom-2 right-2 bg-black/80 text-white">
                  {video.duration}
                </Badge>
              </div>
              <div className="p-3">
                <div className="flex gap-3">
                  <Avatar className="h-9 w-9 flex-shrink-0">
                    <AvatarFallback className="gradient-primary text-white text-xs">
                      {video.channel[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm line-clamp-2 mb-1">
                      {video.title}
                    </h3>
                    <p className="text-xs text-muted-foreground">{video.channel}</p>
                    <p className="text-xs text-muted-foreground">
                      {video.views} просмотров · {video.time}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
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
                <p className="text-sm opacity-90">Здесь будет обучающее видео</p>
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
    </div>
  );
};

export default Index;
