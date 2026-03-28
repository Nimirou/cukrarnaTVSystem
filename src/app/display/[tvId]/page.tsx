"use client";

import { useEffect, useState, useCallback, useRef, use } from "react";

interface ContentItem {
  path: string;
  mimeType: string;
  filename: string;
}

interface DisplayContent {
  mode: string;
  interval: number;
  updatedAt: string;
  items: ContentItem[];
}

export default function DisplayPage({
  params,
}: {
  params: Promise<{ tvId: string }>;
}) {
  const { tvId } = use(params);
  const [content, setContent] = useState<DisplayContent | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fadeIn, setFadeIn] = useState(true);
  const [error, setError] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const lastUpdatedRef = useRef<string>("");

  const fetchContent = useCallback(async () => {
    try {
      const res = await fetch(`/api/displays/${tvId}/content`);
      if (res.ok) {
        const data = await res.json();
        if (data.updatedAt !== lastUpdatedRef.current) {
          lastUpdatedRef.current = data.updatedAt;
          setCurrentIndex(0);
          setFadeIn(true);
        }
        setContent(data);
        setError(false);
      }
    } catch {
      setError(true);
    }
  }, [tvId]);

  // SSE connection
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

    const connect = () => {
      eventSource = new EventSource(`/api/events/${tvId}`);

      eventSource.onopen = () => {
        fetchContent();
      };

      eventSource.onmessage = () => {
        fetchContent();
      };

      eventSource.onerror = () => {
        eventSource?.close();
        reconnectTimeout = setTimeout(connect, 5000);
      };
    };

    connect();

    return () => {
      eventSource?.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [tvId, fetchContent]);

  // Register service worker for offline support
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // SW registration failed, offline cache won't work
      });
    }
  }, []);

  const advance = useCallback(() => {
    setFadeIn(false);
    setTimeout(() => {
      setCurrentIndex((prev) =>
        content ? (prev + 1) % content.items.length : 0
      );
      setFadeIn(true);
    }, 500);
  }, [content]);

  // Slideshow logic
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!content || content.mode !== "slideshow" || content.items.length <= 1) {
      return;
    }

    const item = content.items[currentIndex];
    const isVideo = item?.mimeType.startsWith("video/");

    // For videos in slideshow, wait for the video to end
    if (isVideo) {
      const video = videoRef.current;
      if (video) {
        const handleEnded = () => {
          advance();
        };
        video.addEventListener("ended", handleEnded);
        return () => video.removeEventListener("ended", handleEnded);
      }
    }

    // For images, use the interval
    intervalRef.current = setInterval(() => {
      advance();
    }, content.interval * 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [content, currentIndex, advance]);

  if (error && !content) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <p className="text-zinc-600 text-sm">Čekám na připojení k serveru...</p>
      </div>
    );
  }

  if (!content || content.items.length === 0) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center gap-3">
        <p className="text-zinc-400 text-lg">Není zvolen žádný obrázek</p>
        <p className="text-zinc-600 text-sm">Přiřazení obsahu provedete v administraci</p>
      </div>
    );
  }

  const currentItem = content.items[currentIndex] || content.items[0];
  const isVideoItem = currentItem.mimeType.startsWith("video/");

  return (
    <div className="fixed inset-0 bg-black overflow-hidden cursor-none">
      <div
        className={`w-full h-full transition-opacity duration-500 ${
          fadeIn ? "opacity-100" : "opacity-0"
        }`}
      >
        {isVideoItem ? (
          <video
            ref={videoRef}
            key={currentItem.path}
            src={currentItem.path}
            autoPlay
            loop={content.mode === "video"}
            muted
            playsInline
            className="w-full h-full object-contain"
          />
        ) : (
          <img
            key={currentItem.path}
            src={currentItem.path}
            alt=""
            className="w-full h-full object-contain"
          />
        )}
      </div>
    </div>
  );
}
