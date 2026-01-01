import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';

interface Video {
  id: number;
  title: string;
  description?: string;
  video_url: string;
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

interface Comment {
  id: number;
  content: string;
  created_at: string;
  user: {
    id: number;
    username: string;
    display_name: string;
    avatar_url?: string;
  };
}

interface VideoPlayerProps {
  video: Video;
  onClose: () => void;
  onUpdate: () => void;
}

const VideoPlayer = ({ video, onClose, onUpdate }: VideoPlayerProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [liked, setLiked] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (video) {
      recordView();
      loadComments();
      if (user) {
        checkSubscription();
      }
    }
  }, [video, user]);

  const recordView = async () => {
    try {
      await fetch('https://functions.poehali.dev/84855cd8-6074-46c9-af9f-613a6511fa27', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'view',
          video_id: video.id,
          user_id: user?.id || null
        })
      });
      onUpdate();
    } catch (error) {
      console.error('Failed to record view:', error);
    }
  };

  const checkSubscription = async () => {
    if (!user || user.id === video.user.id) return;
    
    try {
      const params = new URLSearchParams({
        action: 'check_subscription',
        subscriber_id: user.id.toString(),
        channel_id: video.user.id.toString()
      });
      
      const response = await fetch(`https://functions.poehali.dev/84855cd8-6074-46c9-af9f-613a6511fa27?${params}`);
      const data = await response.json();
      setSubscribed(data.subscribed);
    } catch (error) {
      console.error('Failed to check subscription:', error);
    }
  };

  const loadComments = async () => {
    try {
      const params = new URLSearchParams({
        action: 'comment',
        video_id: video.id.toString()
      });
      
      const response = await fetch(`https://functions.poehali.dev/84855cd8-6074-46c9-af9f-613a6511fa27?${params}`);
      const data = await response.json();
      setComments(data.comments || []);
    } catch (error) {
      console.error('Failed to load comments:', error);
    }
  };

  const handleLike = async () => {
    if (!user) {
      toast({
        title: 'Требуется авторизация',
        description: 'Войдите, чтобы поставить лайк'
      });
      return;
    }

    try {
      const response = await fetch('https://functions.poehali.dev/84855cd8-6074-46c9-af9f-613a6511fa27', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'like',
          video_id: video.id,
          user_id: user.id
        })
      });

      const data = await response.json();
      setLiked(data.liked);
      setLikesCount(data.likes_count);
      onUpdate();
    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleSubscribe = async () => {
    if (!user) {
      toast({
        title: 'Требуется авторизация',
        description: 'Войдите, чтобы подписаться'
      });
      return;
    }

    if (user.id === video.user.id) {
      toast({
        title: 'Ошибка',
        description: 'Нельзя подписаться на свой канал'
      });
      return;
    }

    try {
      const response = await fetch('https://functions.poehali.dev/84855cd8-6074-46c9-af9f-613a6511fa27', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'subscribe',
          subscriber_id: user.id,
          channel_id: video.user.id
        })
      });

      const data = await response.json();
      setSubscribed(data.subscribed);
      toast({
        title: data.subscribed ? 'Подписка оформлена' : 'Подписка отменена',
        description: data.subscribed ? `Вы подписались на ${video.user.display_name}` : ''
      });
    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: 'Требуется авторизация',
        description: 'Войдите, чтобы комментировать'
      });
      return;
    }

    if (!newComment.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('https://functions.poehali.dev/84855cd8-6074-46c9-af9f-613a6511fa27', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'comment',
          video_id: video.id,
          user_id: user.id,
          content: newComment
        })
      });

      if (response.ok) {
        setNewComment('');
        loadComments();
        toast({
          title: 'Комментарий добавлен'
        });
      }
    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins} мин назад`;
    if (diffHours < 24) return `${diffHours} ч назад`;
    return `${diffDays} дн назад`;
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] p-0">
        <div className="grid grid-cols-1 lg:grid-cols-3 h-full">
          <div className="lg:col-span-2 bg-black flex items-center justify-center">
            <video
              src={video.video_url}
              controls
              autoPlay
              className="w-full h-full max-h-[90vh] object-contain"
            />
          </div>

          <div className="flex flex-col h-full border-l">
            <div className="p-4 border-b space-y-4">
              <h2 className="text-xl font-heading font-bold line-clamp-2">{video.title}</h2>
              
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback className="gradient-primary text-white">
                      {video.user.display_name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{video.user.display_name}</p>
                    <p className="text-sm text-muted-foreground">@{video.user.username}</p>
                  </div>
                </div>
                {user?.id !== video.user.id && (
                  <Button
                    size="sm"
                    className={subscribed ? 'bg-muted text-foreground' : 'gradient-primary text-white'}
                    onClick={handleSubscribe}
                  >
                    {subscribed ? 'Подписан' : 'Подписаться'}
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  className={`gap-2 ${liked ? 'text-red-500 border-red-500' : ''}`}
                  onClick={handleLike}
                >
                  <Icon name={liked ? 'Heart' : 'Heart'} size={18} className={liked ? 'fill-current' : ''} />
                  {likesCount > 0 ? likesCount : 'Лайк'}
                </Button>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Icon name="Eye" size={16} />
                  {video.views_count} просмотров
                </div>
              </div>

              {video.description && (
                <p className="text-sm text-muted-foreground">{video.description}</p>
              )}
            </div>

            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                <h3 className="font-semibold">{comments.length} комментариев</h3>
                
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {comment.user.display_name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{comment.user.display_name}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatTimeAgo(comment.created_at)}
                        </span>
                      </div>
                      <p className="text-sm mt-1">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="p-4 border-t">
              <form onSubmit={handleAddComment} className="space-y-2">
                <Textarea
                  placeholder="Добавить комментарий..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={2}
                  disabled={!user}
                />
                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    size="sm" 
                    disabled={!user || !newComment.trim() || loading}
                    className="gradient-primary text-white"
                  >
                    {loading ? 'Отправка...' : 'Комментировать'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VideoPlayer;
