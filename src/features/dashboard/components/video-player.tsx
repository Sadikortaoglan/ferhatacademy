"use client";
import { useEffect, useRef, useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { markLessonStarted, updateLessonProgress, markLessonCompleted } from "@/features/dashboard/actions/progress";

interface VideoPlayerProps {
  lessonId: string;
  videoProvider: string;
  videoExternalId: string;
  initialCompleted?: boolean;
}

declare global {
  interface Window {
    YT: {
      Player: new (el: HTMLElement | string, opts: object) => YTPlayer;
      PlayerState: { PLAYING: number; ENDED: number; PAUSED: number };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface YTPlayer {
  getCurrentTime(): number;
  getDuration(): number;
  destroy(): void;
}

export function VideoPlayer({
  lessonId,
  videoProvider,
  videoExternalId,
  initialCompleted = false,
}: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [completed, setCompleted] = useState(initialCompleted);
  const [markingComplete, setMarkingComplete] = useState(false);

  const handleComplete = useCallback(async () => {
    if (completed) return;
    setMarkingComplete(true);
    try {
      await markLessonCompleted(lessonId);
      setCompleted(true);
    } finally {
      setMarkingComplete(false);
    }
  }, [lessonId, completed]);

  useEffect(() => {
    markLessonStarted(lessonId).catch(() => {});
  }, [lessonId]);

  useEffect(() => {
    if (videoProvider !== "YOUTUBE" || !containerRef.current) return;

    const startProgressTimer = (player: YTPlayer) => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      progressTimerRef.current = setInterval(async () => {
        const duration = player.getDuration();
        const current = player.getCurrentTime();
        if (duration > 0) {
          const percent = Math.round((current / duration) * 100);
          await updateLessonProgress(lessonId, percent).catch(() => {});
          if (percent >= 90) {
            await markLessonCompleted(lessonId).catch(() => {});
            setCompleted(true);
          }
        }
      }, 30000);
    };

    const stopProgressTimer = () => {
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }
    };

    const initPlayer = () => {
      if (!containerRef.current) return;
      const div = document.createElement("div");
      containerRef.current.appendChild(div);
      playerRef.current = new window.YT.Player(div, {
        videoId: videoExternalId,
        playerVars: { rel: 0, modestbranding: 1 },
        events: {
          onStateChange: (event: { data: number }) => {
            const { PLAYING, ENDED } = window.YT.PlayerState;
            if (event.data === PLAYING) {
              startProgressTimer(playerRef.current!);
            } else {
              stopProgressTimer();
              if (event.data === ENDED) {
                handleComplete();
              }
            }
          },
        },
      });
    };

    if (window.YT?.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = initPlayer;
      if (!document.getElementById("yt-iframe-api")) {
        const tag = document.createElement("script");
        tag.id = "yt-iframe-api";
        tag.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(tag);
      }
    }

    return () => {
      stopProgressTimer();
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [lessonId, videoProvider, videoExternalId, handleComplete]);

  if (videoProvider === "YOUTUBE") {
    return (
      <div className="space-y-3">
        <div className="aspect-video w-full rounded-lg overflow-hidden bg-black" ref={containerRef} />
        <div className="flex justify-end">
          {completed ? (
            <div className="flex items-center gap-2 text-sm text-success font-medium">
              <CheckCircle2 className="h-4 w-4" />
              Tamamlandı
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={handleComplete}
              disabled={markingComplete}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              {markingComplete ? "..." : "Tamamlandı Olarak İşaretle"}
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (videoProvider === "VIMEO") {
    return (
      <div className="space-y-3">
        <div className="aspect-video w-full rounded-lg overflow-hidden bg-black">
          <iframe
            src={`https://player.vimeo.com/video/${videoExternalId}`}
            title="Lesson video"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
        </div>
        <div className="flex justify-end">
          {completed ? (
            <div className="flex items-center gap-2 text-sm text-success font-medium">
              <CheckCircle2 className="h-4 w-4" />
              Tamamlandı
            </div>
          ) : (
            <Button variant="outline" size="sm" onClick={handleComplete} disabled={markingComplete}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              {markingComplete ? "..." : "Tamamlandı Olarak İşaretle"}
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="aspect-video w-full rounded-lg bg-muted flex items-center justify-center">
      <p className="text-muted-foreground text-sm">Video player not configured for this provider.</p>
    </div>
  );
}
