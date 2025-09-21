'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UploadCloud, FileText, Video, Mic, Type, File, Loader2 } from 'lucide-react';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

type FileUploadProps = {
  onGenerate: () => void;
};

const FileInput = ({
  id,
  label,
  icon,
  file,
  onFileChange,
  accept,
}: {
  id: string;
  label: string;
  icon: React.ReactNode;
  file: File | null;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  accept: string;
}) => (
    <div className="space-y-2">
        <Label className="flex items-center gap-2 font-semibold">
            {icon}
            {label}
        </Label>
        <div className="relative flex items-center justify-between rounded-lg border bg-secondary/30 p-2 text-sm">
            <Label htmlFor={id} className="absolute inset-0 z-10 h-full w-full cursor-pointer" />
            <Input
              id={id}
              type="file"
              className="sr-only"
              onChange={onFileChange}
              accept={accept}
            />
            {file ? (
                <div className="flex items-center gap-2">
                    <File className="w-4 h-4" />
                    <span className="text-foreground">{file.name}</span>
                </div>
            ) : (
                <span className="text-muted-foreground">No file selected</span>
            )}
            <Button size="sm" variant="outline" className="relative z-20">
                Browse
            </Button>
        </div>
    </div>
);

export default function FileUpload({ onGenerate }: FileUploadProps) {
  const [pitchDeck, setPitchDeck] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handlePitchDeckChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setPitchDeck(event.target.files[0]);
    }
  };
  
  const handleVideoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setVideoFile(event.target.files[0]);
    }
  };
  
  const handleAudioChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setAudioFile(event.target.files[0]);
    }
  };

  const handleUploadClick = async () => {
    setError(null);
    if (!pitchDeck && !videoFile && !audioFile && !additionalInfo.trim()) {
        setError('Please provide at least one data source to upload.');
        return;
    }
    
    setIsLoading(true);

    const formData = new FormData();
    if(pitchDeck) formData.append('pitch_deck', pitchDeck);

    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/upload`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: 'An unknown error occurred' }));
            throw new Error(errorData.detail || 'File upload failed');
        }

        const result = await response.json();
        
        console.log('Upload successful:', result);
        toast({
            title: "Analysis Started",
            description: "Your document has been uploaded and analysis is underway.",
        });

        onGenerate();

    } catch (err: any) {
        const errorMessage = err.message || 'An unexpected error occurred during upload.';
        setError(errorMessage);
        toast({
            variant: "destructive",
            title: "Upload Failed",
            description: errorMessage,
        });
    } finally {
        setIsLoading(false);
    }
  };

  const canGenerate = pitchDeck || videoFile || audioFile || additionalInfo.trim() !== '';

  return (
    <div className="flex flex-col items-center justify-center text-center pt-10">
      <Card className="w-full max-w-2xl shadow-lg animate-in fade-in-50 zoom-in-95 duration-500">
        <CardHeader>
          <div className="mx-auto bg-secondary p-3 rounded-full mb-4">
            <UploadCloud className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="font-headline text-3xl">Create New Analysis</CardTitle>
          <CardDescription>
            Upload documents to generate a comprehensive startup analysis. At least one data source is required.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 text-left">
            <FileInput 
                id="pitch-deck-upload"
                label="Pitch Deck (PDF, PPT)"
                icon={<FileText className="w-5 h-5 text-muted-foreground" />}
                file={pitchDeck}
                onFileChange={handlePitchDeckChange}
                accept=".pdf,.ppt,.pptx"
            />
            <FileInput 
                id="video-upload"
                label="Video (MP4, MOV)"
                icon={<Video className="w-5 h-5 text-muted-foreground" />}
                file={videoFile}
                onFileChange={handleVideoChange}
                accept="video/mp4,video/quicktime"
            />
            <FileInput 
                id="audio-upload"
                label="Audio (MP3, WAV)"
                icon={<Mic className="w-5 h-5 text-muted-foreground" />}
                file={audioFile}
                onFileChange={handleAudioChange}
                accept="audio/mpeg,audio/wav"
            />

            <div className="space-y-2">
                <Label htmlFor="additional-info" className="flex items-center gap-2 font-semibold">
                    <Type className="w-5 h-5 text-muted-foreground" />
                    Additional Information
                </Label>
                <Textarea 
                    id="additional-info"
                    value={additionalInfo}
                    onChange={(e) => setAdditionalInfo(e.target.value)}
                    placeholder="Paste any additional notes, URLs, or context for the AI to consider..."
                    className="min-h-[120px]"
                />
            </div>

            {error && (
                <Alert variant="destructive">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
            
          <Button size="lg" className="w-full font-bold" onClick={handleUploadClick} disabled={!canGenerate || isLoading}>
            {isLoading ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                </>
            ) : (
                'Upload Data'
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
