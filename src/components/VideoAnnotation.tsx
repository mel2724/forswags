import { useEffect, useRef, useState } from "react";
import { Canvas as FabricCanvas, Circle } from "fabric";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import { 
  Pencil, 
  Circle as CircleIcon, 
  Undo, 
  Trash2,
  Mic,
  Square,
  Play,
  Pause
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Annotation {
  id: string;
  timestamp_ms: number;
  annotation_type: 'drawing' | 'voice' | 'text';
  data: any;
}

interface VideoAnnotationProps {
  videoUrl: string;
  evaluationId: string;
  isReadOnly?: boolean;
}

export default function VideoAnnotation({ videoUrl, evaluationId, isReadOnly = false }: VideoAnnotationProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [activeTool, setActiveTool] = useState<'select' | 'draw' | 'circle' | 'erase'>('select');
  const [drawColor, setDrawColor] = useState("#FF0000");
  const [lineWidth, setLineWidth] = useState(3);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current || !videoRef.current) return;

    const video = videoRef.current;
    const canvas = new FabricCanvas(canvasRef.current, {
      width: video.offsetWidth,
      height: video.offsetHeight,
      selection: activeTool === 'select',
      backgroundColor: 'transparent',
    });

    canvas.freeDrawingBrush.color = drawColor;
    canvas.freeDrawingBrush.width = lineWidth;
    canvas.isDrawingMode = activeTool === 'draw';

    setFabricCanvas(canvas);

    return () => {
      canvas.dispose();
    };
  }, []);

  // Update canvas when video size changes
  useEffect(() => {
    if (!fabricCanvas || !videoRef.current) return;

    const handleResize = () => {
      const video = videoRef.current!;
      fabricCanvas.setDimensions({
        width: video.offsetWidth,
        height: video.offsetHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [fabricCanvas]);

  // Update drawing settings
  useEffect(() => {
    if (!fabricCanvas) return;

    fabricCanvas.isDrawingMode = activeTool === 'draw';
    fabricCanvas.selection = activeTool === 'select';
    
    if (fabricCanvas.freeDrawingBrush) {
      fabricCanvas.freeDrawingBrush.color = drawColor;
      fabricCanvas.freeDrawingBrush.width = lineWidth;
    }
  }, [fabricCanvas, activeTool, drawColor, lineWidth]);

  // Video time update
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime * 1000);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, []);

  // Load annotations
  useEffect(() => {
    loadAnnotations();
  }, [evaluationId]);

  const loadAnnotations = async () => {
    try {
      const { data, error } = await supabase
        .from('evaluation_annotations')
        .select('*')
        .eq('evaluation_id', evaluationId)
        .order('timestamp_ms');

      if (error) throw error;
      
      const typedData = (data || []).map(item => ({
        ...item,
        annotation_type: item.annotation_type as 'drawing' | 'voice' | 'text'
      }));
      
      setAnnotations(typedData);
    } catch (error) {
      console.error('Error loading annotations:', error);
    }
  };

  const handleToolClick = (tool: typeof activeTool) => {
    setActiveTool(tool);

    if (tool === 'circle' && fabricCanvas) {
      const circle = new Circle({
        left: 100,
        top: 100,
        radius: 50,
        fill: 'transparent',
        stroke: drawColor,
        strokeWidth: lineWidth,
      });
      fabricCanvas.add(circle);
      fabricCanvas.setActiveObject(circle);
    }
  };

  const handleClear = () => {
    if (!fabricCanvas) return;
    fabricCanvas.clear();
  };

  const handleUndo = () => {
    if (!fabricCanvas) return;
    const objects = fabricCanvas.getObjects();
    if (objects.length > 0) {
      fabricCanvas.remove(objects[objects.length - 1]);
    }
  };

  const saveDrawing = async () => {
    if (!fabricCanvas) return;

    try {
      const drawingData = fabricCanvas.toJSON();
      
      const { error } = await supabase
        .from('evaluation_annotations')
        .insert({
          evaluation_id: evaluationId,
          timestamp_ms: Math.floor(currentTime),
          annotation_type: 'drawing',
          data: drawingData,
        });

      if (error) throw error;

      toast({
        title: "Drawing saved",
        description: "Annotation saved at current timestamp",
      });

      handleClear();
      loadAnnotations();
    } catch (error) {
      console.error('Error saving drawing:', error);
      toast({
        title: "Error",
        description: "Failed to save drawing",
        variant: "destructive",
      });
    }
  };

  const startRecording = async () => {
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
        await saveVoiceAnnotation(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      
      toast({
        title: "Recording started",
        description: "Speak your comments now",
      });
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Error",
        description: "Failed to access microphone",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const saveVoiceAnnotation = async (audioBlob: Blob) => {
    try {
      // Upload audio to storage
      const fileName = `${evaluationId}/${Date.now()}.webm`;
      const { error: uploadError } = await supabase.storage
        .from('media-assets')
        .upload(fileName, audioBlob);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('media-assets')
        .getPublicUrl(fileName);

      // Save annotation
      const { error } = await supabase
        .from('evaluation_annotations')
        .insert({
          evaluation_id: evaluationId,
          timestamp_ms: Math.floor(currentTime),
          annotation_type: 'voice',
          data: { audioUrl: publicUrl },
        });

      if (error) throw error;

      toast({
        title: "Voice comment saved",
        description: "Audio annotation saved successfully",
      });

      loadAnnotations();
    } catch (error) {
      console.error('Error saving voice annotation:', error);
      toast({
        title: "Error",
        description: "Failed to save voice annotation",
        variant: "destructive",
      });
    }
  };

  const togglePlayPause = () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
  };

  return (
    <div className="space-y-4">
      {/* Video and Canvas Container */}
      <div ref={containerRef} className="relative bg-black rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          controls={false}
          className="w-full"
          src={videoUrl}
        >
          Your browser does not support the video tag.
        </video>
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full pointer-events-auto"
          style={{ zIndex: 10 }}
        />
      </div>

      {/* Custom Controls */}
      <Card className="p-4">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Button 
            size="icon" 
            variant="outline"
            onClick={togglePlayPause}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <span className="text-sm text-muted-foreground">
            {Math.floor(currentTime / 1000)}s
          </span>
        </div>

        {!isReadOnly && (
          <>
            {/* Drawing Tools */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <Button
                size="sm"
                variant={activeTool === 'select' ? 'default' : 'outline'}
                onClick={() => handleToolClick('select')}
              >
                <Square className="h-4 w-4 mr-2" />
                Select
              </Button>
              <Button
                size="sm"
                variant={activeTool === 'draw' ? 'default' : 'outline'}
                onClick={() => handleToolClick('draw')}
              >
                <Pencil className="h-4 w-4 mr-2" />
                Draw
              </Button>
              <Button
                size="sm"
                variant={activeTool === 'circle' ? 'default' : 'outline'}
                onClick={() => handleToolClick('circle')}
              >
                <CircleIcon className="h-4 w-4 mr-2" />
                Circle
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleUndo}
              >
                <Undo className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleClear}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                onClick={saveDrawing}
              >
                Save Drawing
              </Button>
            </div>

            {/* Drawing Settings */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Color</label>
                <input
                  type="color"
                  value={drawColor}
                  onChange={(e) => setDrawColor(e.target.value)}
                  className="w-full h-10 rounded cursor-pointer"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Line Width: {lineWidth}px</label>
                <Slider
                  value={[lineWidth]}
                  onValueChange={([value]) => setLineWidth(value)}
                  min={1}
                  max={10}
                  step={1}
                />
              </div>
            </div>

            {/* Voice Recording */}
            <div className="flex items-center gap-2">
              <Button
                variant={isRecording ? 'destructive' : 'default'}
                onClick={isRecording ? stopRecording : startRecording}
              >
                <Mic className="h-4 w-4 mr-2" />
                {isRecording ? 'Stop Recording' : 'Record Voice Comment'}
              </Button>
              {isRecording && (
                <span className="text-sm text-destructive animate-pulse">
                  Recording...
                </span>
              )}
            </div>
          </>
        )}

        {/* Annotations Timeline */}
        {annotations.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <h3 className="text-sm font-medium mb-2">Annotations</h3>
            <div className="space-y-2">
              {annotations.map((annotation) => (
                <div key={annotation.id} className="text-xs flex items-center gap-2 p-2 bg-muted rounded">
                  <span className="font-medium">
                    {Math.floor(annotation.timestamp_ms / 1000)}s
                  </span>
                  <span className="text-muted-foreground">
                    {annotation.annotation_type === 'drawing' ? '✏️ Drawing' : '🎤 Voice'}
                  </span>
                  {annotation.annotation_type === 'voice' && annotation.data.audioUrl && (
                    <audio controls className="h-6 ml-auto">
                      <source src={annotation.data.audioUrl} type="audio/webm" />
                    </audio>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}