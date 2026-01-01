import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';

interface UploadModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const UploadModal = ({ open, onClose, onSuccess }: UploadModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isShort, setIsShort] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('video/')) {
        setVideoFile(file);
      } else {
        toast({
          title: 'Ошибка',
          description: 'Пожалуйста, выберите видео файл',
          variant: 'destructive'
        });
      }
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !videoFile) {
      toast({
        title: 'Ошибка',
        description: 'Выберите видео файл',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(videoFile);
      
      reader.onload = async () => {
        const base64 = reader.result?.toString().split(',')[1];
        
        const video = document.createElement('video');
        video.src = URL.createObjectURL(videoFile);
        video.onloadedmetadata = async () => {
          const duration = Math.floor(video.duration);
          
          const response = await fetch('https://functions.poehali.dev/57bee18d-e91a-47cd-b31a-bcc1ecc7ea56', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'upload',
              user_id: user.id,
              title,
              description,
              video_data: base64,
              duration,
              is_short: isShort
            })
          });

          const data = await response.json();
          
          if (!response.ok) {
            throw new Error(data.error || 'Upload failed');
          }

          toast({
            title: 'Успешно!',
            description: 'Видео загружено на платформу'
          });

          setTitle('');
          setDescription('');
          setIsShort(false);
          setVideoFile(null);
          onSuccess();
        };
      };
    } catch (error: any) {
      toast({
        title: 'Ошибка загрузки',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-heading gradient-text">
            Загрузить видео
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleUpload} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="video-file">Видео файл *</Label>
            <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer">
              <input
                type="file"
                id="video-file"
                accept="video/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="video-file" className="cursor-pointer">
                {videoFile ? (
                  <div className="space-y-2">
                    <Icon name="CheckCircle" size={48} className="mx-auto text-green-500" />
                    <p className="font-semibold">{videoFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(videoFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Icon name="Upload" size={48} className="mx-auto text-muted-foreground" />
                    <p className="font-semibold">Нажмите для выбора видео</p>
                    <p className="text-sm text-muted-foreground">MP4, WebM, или другие форматы</p>
                  </div>
                )}
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="video-title">Название *</Label>
            <Input
              id="video-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Введите название видео"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="video-description">Описание</Label>
            <Textarea
              id="video-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Расскажите о вашем видео..."
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <Label htmlFor="is-short" className="font-semibold">Короткое видео (Short)</Label>
              <p className="text-sm text-muted-foreground">Вертикальное видео до 60 секунд</p>
            </div>
            <Switch
              id="is-short"
              checked={isShort}
              onCheckedChange={setIsShort}
            />
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Отмена
            </Button>
            <Button 
              type="submit" 
              className="flex-1 gradient-primary text-white" 
              disabled={loading || !videoFile || !title}
            >
              {loading ? 'Загрузка...' : 'Загрузить видео'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UploadModal;
