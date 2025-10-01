import { useEffect, useRef, useState, useCallback } from "react";
import { Canvas, PencilBrush, Circle } from "fabric";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { 
  Pencil, 
  Circle as CircleIcon, 
  Eraser, 
  Trash2, 
  Mic, 
  Square,
  Play,
  Pause
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Annotation {
  id: string;
  timestamp_ms: number;
  annotation_type: 'drawing' | 'voice' | 'text';
  data: any;
}

interface VideoAnnotationProps {
  videoUrl: string;
  evaluationId: string;
  onAnnotationSave: (annotation: Omit<Annotation, 'id'>) => Promise<void>;
  existingAnnotations?: Annotation[];
}

export default function VideoAnnotation({
  videoUrl,
  evaluationId,
  onAnnotationSave,
  existingAnnotations = []
}: VideoAnnotationProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<Canvas | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
  const [activeTool, setActiveTool] = useState<'select' | 'draw' | 'circle' | 'eraser'>('select');
  const [drawColor, setDrawColor] = useState('#FF0000');
  const [brushSize, setBrushSize] = useState(3);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [annotations, setAnnotations] = useState<Annotation[]>(existingAnnotations);
  
  const { toast } = useToast();

  // Initialize fabric canvas
  useEffect(() => {
    if (!canvasRef.current || !videoRef.current) return;

    const canvas = new Canvas(canvasRef.current, {
      width: videoRef.current.offsetWidth,
      height: videoRef.current.offsetHeight,
      isDrawingMode: false,
      selection: true,
    });

    fabricCanvasRef.current = canvas;

    return () => {
      canvas.dispose();
    };
  }, []);

  // Handle video resize
  useEffect(() => {
    const handleResize = () => {
      if (fabricCanvasRef.current && videoRef.current) {
        fabricCanvasRef.current.setWidth(videoRef.current.offsetWidth);
        fabricCanvasRef.current.setHeight(videoRef.current.offsetHeight);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Update drawing tool
  useEffect(() => {
    if (!fabricCanvasRef.current) return;

    const canvas = fabricCanvasRef.current;
    canvas.isDrawingMode = activeTool === 'draw';
    
    if (activeTool === 'draw') {
      const brush = new PencilBrush(canvas);
      brush.color = drawColor;
      brush.width = brushSize;
      canvas.freeDrawingBrush = brush;
    } else if (activeTool === 'circle') {
      canvas.isDrawingMode = false;
    } else if (activeTool === 'eraser') {
      const brush = new PencilBrush(canvas);
      brush.color = '#FFFFFF';
      brush.width = brushSize * 2;
      canvas.freeDrawingBrush = brush;
      canvas.isDrawingMode = true;
    } else {
      canvas.isDrawingMode = false;
    }
  }, [activeTool, drawColor, brushSize]);

  // Handle circle drawing
  const handleAddCircle = useCallback(() => {
    if (!fabricCanvasRef.current) return;

    const circle = new Circle({
      left: 100,
      top: 100,
      radius: 50,
      fill: 'transparent',
      stroke: drawColor,
      strokeWidth: brushSize,
    });
    
    fabricCanvasRef.current.add(circle);
    fabricCanvasRef.current.setActiveObject(circle);
  }, [drawColor, brushSize]);

  // Clear canvas
  const handleClearCanvas = useCallback(() => {
    if (!fabricCanvasRef.current) return;
    fabricCanvasRef.current.clear();
    toast({
      title: "Canvas cleared",
      description: "All drawings have been removed",
    });
  }, [toast]);

  // Save current canvas as annotation
  const handleSaveDrawing = useCallback(async () => {
    if (!fabricCanvasRef.current || !videoRef.current) return;

    const canvas = fabricCanvasRef.current;
    const currentTimeMs = Math.floor(videoRef.current.currentTime * 1000);
    
    const canvasData = canvas.toJSON();
    
    await onAnnotationSave({
      timestamp_ms: currentTimeMs,
      annotation_type: 'drawing',
      data: {
        canvas: canvasData,
        color: drawColor,
      }
    });

    toast({
      title: "Drawing saved",
      description: `Saved at ${videoRef.current.currentTime.toFixed(1)}s`,
    });
  }, [drawColor, onAnnotationSave, toast]);

  // Audio recording
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        
        reader.onloadend = async () => {
          const base64Audio = reader.result as string;
          const currentTimeMs = Math.floor((videoRef.current?.currentTime || 0) * 1000);
          
          await onAnnotationSave({
            timestamp_ms: currentTimeMs,
            annotation_type: 'voice',
            data: {
              audio: base64Audio,
              duration: audioChunksRef.current.length,
            }
          });

          toast({
            title: "Voice comment saved",
            description: "Audio recording has been saved",
          });
        };
        
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Recording failed",
        description: "Could not access microphone",
        variant: "destructive",
      });
    }
  }, [onAnnotationSave, toast]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  // Video controls
  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  // Update current time
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, []);

  return (
    <div className="space-y-4">
      {/* Video and Canvas Container */}
      <Card className="overflow-hidden">
        <div ref={containerRef} className="relative bg-black">
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 pointer-events-auto"
            style={{ touchAction: 'none' }}
          />
        </div>

        {/* Video Controls */}
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Button size="icon" variant="outline" onClick={togglePlay}>
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <span className="text-sm text-muted-foreground">
              {currentTime.toFixed(1)}s
            </span>
          </div>
        </div>
      </Card>

      {/* Annotation Tools */}
      <Card className="p-4">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={activeTool === 'select' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTool('select')}
            >
              <Square className="h-4 w-4 mr-2" />
              Select
            </Button>
            <Button
              variant={activeTool === 'draw' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTool('draw')}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Draw
            </Button>
            <Button
              variant={activeTool === 'circle' ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setActiveTool('circle');
                handleAddCircle();
              }}
            >
              <CircleIcon className="h-4 w-4 mr-2" />
              Circle
            </Button>
            <Button
              variant={activeTool === 'eraser' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTool('eraser')}
            >
              <Eraser className="h-4 w-4 mr-2" />
              Eraser
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearCanvas}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>

          {/* Drawing Settings */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Color</label>
            <div className="flex gap-2">
              {['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#FFFFFF'].map((color) => (
                <button
                  key={color}
                  className="w-8 h-8 rounded border-2"
                  style={{
                    backgroundColor: color,
                    borderColor: drawColor === color ? '#000' : '#ccc'
                  }}
                  onClick={() => setDrawColor(color)}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Brush Size: {brushSize}px</label>
            <Slider
              value={[brushSize]}
              onValueChange={([value]) => setBrushSize(value)}
              min={1}
              max={20}
              step={1}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 border-t">
            <Button onClick={handleSaveDrawing} className="flex-1">
              Save Drawing
            </Button>
            <Button
              variant={isRecording ? 'destructive' : 'outline'}
              onClick={isRecording ? stopRecording : startRecording}
              className="flex-1"
            >
              <Mic className="h-4 w-4 mr-2" />
              {isRecording ? 'Stop Recording' : 'Record Voice'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Annotations Timeline */}
      {annotations.length > 0 && (
        <Card className="p-4">
          <h3 className="font-semibold mb-3">Saved Annotations</h3>
          <div className="space-y-2">
            {annotations.map((annotation) => (
              <div
                key={annotation.id}
                className="flex items-center justify-between p-2 bg-muted rounded"
              >
                <span className="text-sm">
                  {annotation.annotation_type === 'drawing' ? '🎨' : '🎤'} {' '}
                  {(annotation.timestamp_ms / 1000).toFixed(1)}s
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}