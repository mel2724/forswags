import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { BookmarkPlus, Trash2, Edit2, Save, X } from "lucide-react";
import { format } from "date-fns";

interface Bookmark {
  id: string;
  content: string;
  timestamp_seconds: number | null;
  created_at: string;
  updated_at: string;
}

interface LessonNotesProps {
  lessonId: string;
}

const LessonNotes = ({ lessonId }: LessonNotesProps) => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [newNote, setNewNote] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBookmarks();
  }, [lessonId]);

  const loadBookmarks = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("course_bookmarks")
        .select("*")
        .eq("lesson_id", lessonId)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBookmarks(data || []);
    } catch (error) {
      console.error("Error loading bookmarks:", error);
      toast.error("Failed to load notes");
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) {
      toast.error("Please enter a note");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from("course_bookmarks").insert({
        user_id: user.id,
        lesson_id: lessonId,
        content: newNote.trim(),
      });

      if (error) throw error;

      toast.success("Note added");
      setNewNote("");
      loadBookmarks();
    } catch (error) {
      console.error("Error adding note:", error);
      toast.error("Failed to add note");
    }
  };

  const handleUpdateNote = async (id: string) => {
    if (!editContent.trim()) {
      toast.error("Note cannot be empty");
      return;
    }

    try {
      const { error } = await supabase
        .from("course_bookmarks")
        .update({ content: editContent.trim() })
        .eq("id", id);

      if (error) throw error;

      toast.success("Note updated");
      setEditingId(null);
      setEditContent("");
      loadBookmarks();
    } catch (error) {
      console.error("Error updating note:", error);
      toast.error("Failed to update note");
    }
  };

  const handleDeleteNote = async (id: string) => {
    if (!confirm("Delete this note?")) return;

    try {
      const { error } = await supabase
        .from("course_bookmarks")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Note deleted");
      loadBookmarks();
    } catch (error) {
      console.error("Error deleting note:", error);
      toast.error("Failed to delete note");
    }
  };

  const startEdit = (bookmark: Bookmark) => {
    setEditingId(bookmark.id);
    setEditContent(bookmark.content);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditContent("");
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">Loading notes...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/80 backdrop-blur border-2 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookmarkPlus className="h-5 w-5 text-primary" />
          Course Notes
        </CardTitle>
        <CardDescription>
          Add notes and bookmarks to remember key points
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Note */}
        <div className="space-y-2">
          <Textarea
            placeholder="Write a note about this lesson..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            rows={3}
          />
          <Button onClick={handleAddNote} className="w-full" size="sm">
            <BookmarkPlus className="h-4 w-4 mr-2" />
            Add Note
          </Button>
        </div>

        {/* Notes List */}
        {bookmarks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <BookmarkPlus className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No notes yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {bookmarks.map((bookmark) => (
              <div
                key={bookmark.id}
                className="p-3 rounded-lg border bg-muted/30"
              >
                {editingId === bookmark.id ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleUpdateNote(bookmark.id)}
                        className="flex-1"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={cancelEdit}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-sm mb-2 whitespace-pre-wrap">
                      {bookmark.content}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {format(new Date(bookmark.created_at), "MMM d, yyyy 'at' h:mm a")}
                      </span>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => startEdit(bookmark)}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteNote(bookmark.id)}
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LessonNotes;
