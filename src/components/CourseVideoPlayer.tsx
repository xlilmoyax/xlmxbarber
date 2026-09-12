/**
 * Reproductor de video estilo YouTube para cursos
 * Controles: play/pause, volumen, barra de progreso, velocidad, calidad, fullscreen
 * Resume desde última posición, marcar completado, navegación lección ant/sig
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, FastForward, SkipBack, Settings, CheckCircle, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { updateLessonProgress, getSignedVideoUrl } from '../lib/courseHelpers';
import type { CourseVideo, CourseLesson, StudentProgress } from '../types';

interface VideoPlayerProps {
    video: CourseVideo;
    lesson: CourseLesson;
    courseId: string;
    userId: string;
    allLessons: CourseLesson[]; // para navegación ant/sig
    onLessonComplete?: (lessonId: string) => void;
    onNavigateLesson?: (lessonId: string) => void;
}

export default function VideoPlayer({
    video,
    lesson,
    courseId,
    userId,
    allLessons,
    onLessonComplete,
    onNavigateLesson,
}: VideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const progressRef = useRef<HTMLDivElement>(null);

    // Estado del reproductor
    const [playing, setPlaying] = useState(false);
    const [muted, setMuted] = useState(false);
    const [volume, setVolume] = useState(1);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [buffered, setBuffered] = useState(0);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [quality, setQuality] = useState<'auto' | '1080' | '720' | '480'>('auto');
    const [fullscreen, setFullscreen] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [showSettings, setShowSettings] = useState(false);
    const [progress, setProgress] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [completed, setCompleted] = useState(false);
    const [lastPosition, setLastPosition] = useState(0);

    // Referencias para timeouts
    const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const progressUpdateRef = useRef<NodeJS.Timeout | null>(null);

    // Cargar video firmado
    useEffect(() => {
        if (!video.storage_path) { setError('No hay archivo de video'); setIsLoading(false); return; }
        setIsLoading(true);
        setError(null);
        getSignedVideoUrl(video.storage_path, 7200).then(({ url, error }) => {
            if (error) { setError(error); setIsLoading(false); }
            else { videoRef.current?.load(); setIsLoading(false); }
        });
    }, [video.storage_path]);

    // Restaurar última posición
    useEffect(() => {
        if (lastPosition > 0 && videoRef.current && !playing) {
            videoRef.current.currentTime = lastPosition;
        }
    }, [lastPosition]);

    // Obtener progreso guardado al montar
    useEffect(() => {
        if (!userId) return;
        supabase.from('student_progress')
            .select('watched_seconds, total_seconds, last_position_seconds, completed')
            .eq('user_id', userId)
            .eq('lesson_id', lesson.id)
            .maybeSingle()
            .then(({ data }) => {
                if (data) {
                    setLastPosition(data.last_position_seconds || 0);
                    setCompleted(data.completed || false);
                }
            });
    }, [userId, lesson.id]);

    // Guardar progreso periódicamente
    useEffect(() => {
        if (!playing || !userId) return;
        progressUpdateRef.current = setInterval(() => {
            if (videoRef.current) {
                const pos = videoRef.current.currentTime;
                setLastPosition(pos);
                updateLessonProgress({
                    user_id: userId,
                    course_id: courseId,
                    lesson_id: lesson.id,
                    video_id: video.id,
                    watched_seconds: Math.round(pos),
                    total_seconds: Math.round(duration),
                    completed: false,
                });
            }
        }, 10000); // cada 10 segundos
        return () => { if (progressUpdateRef.current) clearInterval(progressUpdateRef.current); };
    }, [playing, userId, courseId, lesson.id, video.id, duration]);

    // Eventos del video
    const handleLoadedMetadata = () => {
        if (videoRef.current) {
            setDuration(videoRef.current.duration);
            if (lastPosition > 0 && lastPosition < videoRef.current.duration) {
                videoRef.current.currentTime = lastPosition;
            }
        }
        setIsLoading(false);
    };

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            setCurrentTime(videoRef.current.currentTime);
            setProgress((videoRef.current.currentTime / videoRef.current.duration) * 100);
        }
    };

    const handleProgress = () => {
        if (videoRef.current && videoRef.current.buffered.length > 0) {
            setBuffered((videoRef.current.buffered.end(videoRef.current.buffered.length - 1) / videoRef.current.duration) * 100);
        }
    };

    const handleEnded = () => {
        setPlaying(false);
        if (!completed && userId) {
            updateLessonProgress({
                user_id: userId,
                course_id: courseId,
                lesson_id: lesson.id,
                video_id: video.id,
                watched_seconds: Math.round(duration),
                total_seconds: Math.round(duration),
                completed: true,
            });
            setCompleted(true);
            onLessonComplete?.(lesson.id);
            // Auto-siguiente lección
            const next = getNextLesson();
            if (next) setTimeout(() => onNavigateLesson?.(next.id), 3000);
        }
    };

    const handleError = () => {
        setError('Error reproduciendo el video');
        setIsLoading(false);
    };

    const handleWaiting = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);

    // Controles
    const togglePlay = () => setPlaying(p => !p);
    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const v = parseFloat(e.target.value);
        setVolume(v);
        if (videoRef.current) videoRef.current.volume = v;
        setMuted(v === 0);
    };
    const toggleMute = () => {
        if (videoRef.current) {
            videoRef.current.muted = !muted;
            setMuted(!muted);
        }
    };
    const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (videoRef.current && progressRef.current) {
            const rect = progressRef.current.getBoundingClientRect();
            const percent = (e.clientX - rect.left) / rect.width;
            videoRef.current.currentTime = percent * videoRef.current.duration;
        }
    };
    const setSpeed = (rate: number) => {
        setPlaybackRate(rate);
        if (videoRef.current) videoRef.current.playbackRate = rate;
        setShowSettings(false);
    };
    const setQualityLevel = (q: 'auto' | '1080' | '720' | '480') => {
        setQuality(q);
        setShowSettings(false);
        // Aquí se podría cambiar la fuente del video si hay múltiples calidades
    };
    const toggleFullscreen = () => {
        const player = videoRef.current?.parentElement?.parentElement as HTMLElement;
        if (!fullscreen) {
            player?.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
        setFullscreen(!fullscreen);
    };
    const handleFullscreenChange = () => {
        setFullscreen(!!document.fullscreenElement);
    };

    useEffect(() => {
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    // Auto-ocultar controles
    useEffect(() => {
        if (playing) {
            setShowControls(true);
            if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
            controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
        }
        return () => { if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current); };
    }, [playing]);

    // Navegación lecciones
    const getCurrentLessonIndex = () => allLessons.findIndex(l => l.id === lesson.id);
    const getPrevLesson = () => {
        const idx = getCurrentLessonIndex();
        return idx > 0 ? allLessons[idx - 1] : null;
    };
    const getNextLesson = () => {
        const idx = getCurrentLessonIndex();
        return idx < allLessons.length - 1 ? allLessons[idx + 1] : null;
    };
    const goToLesson = (l: CourseLesson | null) => l && onNavigateLesson?.(l.id);

    const formatTime = (sec: number) => {
        if (isNaN(sec)) return '0:00';
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    // Teclas
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (!videoRef.current) return;
            switch (e.key) {
                case ' ': case 'k': e.preventDefault(); togglePlay(); break;
                case 'ArrowLeft': e.preventDefault(); videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10); break;
                case 'ArrowRight': e.preventDefault(); videoRef.current.currentTime = Math.min(duration, videoRef.current.currentTime + 10); break;
                case 'ArrowUp': e.preventDefault(); setVolume(v => Math.min(1, v + 0.1)); break;
                case 'ArrowDown': e.preventDefault(); setVolume(v => Math.max(0, v - 0.1)); break;
                case 'm': toggleMute(); break;
                case 'f': toggleFullscreen(); break;
                case '>': case '.': setPlaybackRate(r => Math.min(2, r + 0.25)); break;
                case '<': case ',': setPlaybackRate(r => Math.max(0.25, r - 0.25)); break;
            }
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [duration]);

    if (error) {
        return (
            <div className="aspect-video bg-zinc-900 rounded-xl flex items-center justify-center text-white">
                <div className="text-center p-4">
                    <AlertCircle className="w-12 h-12 mx-auto mb-2 text-red-400" />
                    <p className="font-medium">{error}</p>
                    <p className="text-sm text-zinc-400 mt-1">Intenta recargar la página</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative bg-black rounded-xl overflow-hidden" onMouseEnter={() => setShowControls(true)} onMouseLeave={() => playing && setShowControls(false)}>
            {/* Video */}
            <video
                ref={videoRef}
                className="w-full h-full"
                onLoadedMetadata={handleLoadedMetadata}
                onTimeUpdate={handleTimeUpdate}
                onProgress={handleProgress}
                onEnded={handleEnded}
                onError={handleError}
                onWaiting={handleWaiting}
                onCanPlay={handleCanPlay}
                onClick={togglePlay}
                playsInline
                crossOrigin="anonymous"
            >
                <source src={video.playback_id ? `https://stream.mux.com/${video.playback_id}.m3u8` : ''} type="application/x-mpegURL" />
            </video>

            {/* Buffer */}
            <div className="absolute bottom-0 left-0 h-1 bg-white/30" style={{ width: `${buffered}%` }} />

            {/* Overlay loading */}
            {isLoading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                    <div className="w-10 h-10 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
                </div>
            )}

            {/* Overlay play grande cuando pausado */}
            {!playing && !isLoading && !error && (
                <button onClick={togglePlay} className="absolute inset-0 flex items-center justify-center z-5 bg-black/30 hover:bg-black/40 transition-colors">
                    <Play className="w-16 h-16 text-white/90 drop-shadow-lg" />
                </button>
            )}

            {/* Completado overlay */}
            {completed && !playing && (
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-5">
                    <div className="text-center">
                        <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-2" />
                        <p className="text-xl font-medium text-white">¡Lección completada!</p>
                        {getNextLesson() && (
                            <button onClick={() => goToLesson(getNextLesson())} className="mt-4 px-6 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-400">
                                Siguiente lección →
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Controles */}
            {showControls && (
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 via-black/60 to-transparent z-10 transition-opacity duration-300">
                    {/* Barra de progreso */}
                    <div className="relative h-1.5 mb-2 cursor-pointer" ref={progressRef} onClick={handleProgressClick}>
                        <div className="absolute top-0 left-0 h-full bg-white/30 rounded" style={{ width: `${buffered}%` }} />
                        <div className="absolute top-0 left-0 h-full bg-amber-500 rounded" style={{ width: `${progress}%` }} />
                        <div className="absolute top-1/2 left-0 w-3 h-3 -translate-x-1/2 -translate-y-1/2 bg-amber-500 rounded-full transform" style={{ left: `${progress}%` }} />
                    </div>
                    <div className="flex items-center justify-between text-white text-sm px-1">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                    </div>

                    {/* Controles principales */}
                    <div className="flex items-center justify-between gap-4">
                        {/* Izquierda */}
                        <div className="flex items-center gap-3">
                            <button onClick={togglePlay} className="p-2 text-white hover:text-amber-400 transition-colors" aria-label={playing ? 'Pausar' : 'Reproducir'}>
                                {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                            </button>
                            <button onClick={() => { if (videoRef.current) videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10); }} className="p-2 text-white hover:text-amber-400" aria-label="Retroceder 10s">
                                <SkipBack className="w-5 h-5" />
                            </button>
                            <button onClick={() => { if (videoRef.current) videoRef.current.currentTime = Math.min(duration, videoRef.current.currentTime + 10); }} className="p-2 text-white hover:text-amber-400" aria-label="Avanzar 10s">
                                <FastForward className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Centro: tiempo */}
                        <div className="flex items-center gap-2 text-xs text-white/80 min-w-[120px] justify-center">
                            <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
                        </div>

                        {/* Derecha */}
                        <div className="flex items-center gap-3">
                            {/* Velocidad y calidad */}
                            <div className="relative">
                                <button onClick={() => setShowSettings(!showSettings)} className="flex items-center gap-1 p-2 text-white hover:text-amber-400" aria-label="Configuración">
                                    <Settings className="w-5 h-5" />
                                </button>
                                {showSettings && (
                                    <div className="absolute bottom-full right-0 mb-2 bg-zinc-900 rounded-lg p-2 shadow-lg border border-zinc-700 z-20 min-w-[140px]">
                                        <div className="px-3 py-1 text-xs text-zinc-400 border-b border-zinc-700">Velocidad</div>
                                        {[0.5, 0.75, 1, 1.25, 1.5, 2].map(r => (
                                            <button key={r} onClick={() => setSpeed(r)} className={`w-full px-3 py-1.5 text-sm text-left rounded ${playbackRate === r ? 'bg-amber-500 text-black' : 'text-white hover:bg-zinc-800'}`}>
                                                {r}x
                                            </button>
                                        ))}
                                        <div className="px-3 py-1 text-xs text-zinc-400 border-t border-b border-zinc-700 mt-2">Calidad</div>
                                        {['auto', '1080', '720', '480'].map(q => (
                                            <button key={q} onClick={() => setQualityLevel(q as any)} className={`w-full px-3 py-1.5 text-sm text-left rounded ${quality === q ? 'bg-amber-500 text-black' : 'text-white hover:bg-zinc-800'}`}>
                                                {q === 'auto' ? 'Auto' : `${q}p`}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Volumen */}
                            <div className="flex items-center gap-2">
                                <button onClick={toggleMute} className="p-2 text-white hover:text-amber-400" aria-label={muted ? 'Activar sonido' : 'Silenciar'}>
                                    {muted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                                </button>
                                <input
                                    type="range"
                                    min="0" max="1" step="0.1"
                                    value={muted ? 0 : volume}
                                    onChange={handleVolumeChange}
                                    className="w-20 h-1.5 appearance-none bg-zinc-700 rounded accent-amber-500 cursor-pointer"
                                />
                            </div>

                            {/* Pantalla completa */}
                            <button onClick={toggleFullscreen} className="p-2 text-white hover:text-amber-400" aria-label={fullscreen ? 'Salir pantalla completa' : 'Pantalla completa'}>
                                {fullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Barra superior con info lección */}
            <div className="absolute top-0 left-0 right-0 p-3 bg-gradient-to-b from-black/70 to-transparent z-10 pointer-events-none">
                <div className="flex items-center justify-between pointer-events-auto">
                    <div className="flex items-center gap-3">
                        <h3 className="font-medium text-white truncate max-w-[300px]">{lesson.title}</h3>
                        {completed && <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />}
                    </div>
                    <div className="flex items-center gap-2">
                        {getPrevLesson() && (
                            <button onClick={() => goToLesson(getPrevLesson())} className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg flex items-center gap-1">
                                <ChevronLeft className="w-4 h-4" /> Ant.
                            </button>
                        )}
                        {getNextLesson() && (
                            <button onClick={() => goToLesson(getNextLesson())} className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-white text-sm rounded-lg flex items-center gap-1">
                                Sig. <ChevronRight className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Importar supabase al final para no romper el lint
import { supabase } from '../lib/supabaseClient';
import { AlertCircle } from 'lucide-react';