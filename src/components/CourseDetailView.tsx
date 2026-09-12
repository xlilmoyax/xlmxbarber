/**
 * Vista de detalle de curso para alumnos (reproductor + lista de lecciones + progreso)
 */
import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, PlayCircle, CheckCircle, Clock, Lock, BookOpen, ArrowLeft, X } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { fetchCourseWithSections, fetchStudentProgress, updateLessonProgress, getSignedVideoUrl } from '../lib/courseHelpers';
import VideoPlayer from './CourseVideoPlayer';
import type { Course, CourseSection, CourseLesson, StudentProgress } from '../types';

interface CourseDetailViewProps {
    course: Course;
    onBack: () => void;
    onNavigate?: (screen: string) => void;
}

function formatTime(seconds: number): string {
    if (!seconds) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return m + ':' + String(s).padStart(2, '0');
}

interface LessonItemProps {
    lesson: CourseLesson;
    selectedLesson: CourseLesson | null;
    progress: StudentProgress | undefined;
    onClick: () => void;
    locked: boolean;
}

function LessonItem({ lesson, selectedLesson, progress, onClick, locked }: LessonItemProps) {
    const p = progress;
    const isCurrent = selectedLesson?.id === lesson.id;
    const className = 'w-full px-3 py-2 text-left text-sm rounded-lg transition-colors flex items-center gap-2 ' +
        (isCurrent ? 'bg-amber-50 text-amber-700' : locked ? 'text-zinc-400 bg-zinc-50' : 'text-zinc-600 hover:bg-zinc-50');

    let icon = null;
    if (p?.completed) icon = <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />;
    else if (locked) icon = <Lock className="w-4 h-4 text-zinc-400 flex-shrink-0" />;
    else icon = <PlayCircle className={'w-4 h-4 flex-shrink-0 ' + (p?.completed ? 'text-green-500' : 'text-zinc-400')} />;

    return (
        <button
            key={lesson.id}
            onClick={onClick}
            className={className}
            disabled={locked}
        >
            {icon}
            <span className="truncate flex-1">{lesson.title}</span>
            {lesson.estimated_duration_minutes && <Clock className="w-3 h-3 text-zinc-400 flex-shrink-0" />}
        </button>
    );
}

interface SectionItemProps {
    section: CourseSection;
    selectedLesson: CourseLesson | null;
    progress: StudentProgress[];
    getSectionProgress: (sectionId: string) => { completed: number; total: number };
    getLessonProgress: (lessonId: string) => StudentProgress | undefined;
    handleLessonSelect: (lesson: CourseLesson) => void;
}

function SectionItem({ section, selectedLesson, progress, getSectionProgress, getLessonProgress, handleLessonSelect }: SectionItemProps) {
    const secProgress = getSectionProgress(section.id);
    return (
        <div key={section.id} className="mb-2">
            <button className="w-full px-3 py-2 text-left text-sm font-medium text-zinc-700 hover:bg-zinc-50 rounded-lg flex items-center justify-between">
                <span className="truncate">{section.title}</span>
                <span className="text-xs text-zinc-500">{secProgress.completed}/{secProgress.total}</span>
            </button>
            <div className="ml-4 mt-1 space-y-1">
                {section.lessons?.map((lesson) => (
                    <LessonItem
                        key={lesson.id}
                        lesson={lesson}
                        selectedLesson={null} // will be passed from parent
                        progress={getLessonProgress(lesson.id)}
                        onClick={() => handleLessonSelect(lesson)}
                        locked={false}
                    />
                ))}
            </div>
        </div>
    );
}

interface LessonContentProps {
    selectedLesson: CourseLesson;
    selectedVideo: any;
    setSelectedVideo: (v: any) => void;
    getPrevLesson: (id: string) => CourseLesson | null;
    getNextLesson: (id: string) => CourseLesson | null;
    handleLessonSelect: (l: CourseLesson) => void;
    course: Course;
    user: any;
    progress: StudentProgress[];
    handleLessonComplete: (id: string) => void;
    handleNavigateLesson: (id: string) => void;
    getAllLessons: () => CourseLesson[];
}

function LessonContent({ selectedLesson, selectedVideo, setSelectedVideo, getPrevLesson, getNextLesson, handleLessonSelect, course, user, progress, handleLessonComplete, handleNavigateLesson, getAllLessons }: LessonContentProps) {
    const p = progress.find(x => x.lesson_id === selectedLesson.id);
    const prevLesson = getPrevLesson(selectedLesson.id);
    const nextLesson = getNextLesson(selectedLesson.id);

    return (
        <div className="space-y-6">
            {selectedVideo && (
                <VideoPlayer
                    video={selectedVideo}
                    lesson={selectedLesson}
                    courseId={course.id}
                    userId={user?.id || ''}
                    allLessons={getAllLessons()}
                    onLessonComplete={handleLessonComplete}
                    onNavigateLesson={handleNavigateLesson}
                />
            )}

            <div className="bg-white border border-zinc-200 rounded-xl p-6">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            {selectedLesson.status === 'publicado' ? (
                                <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded">Publicado</span>
                            ) : (
                                <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded">Borrador</span>
                            )}
                        </div>
                        <h2 className="text-2xl font-bold text-zinc-900">{selectedLesson.title}</h2>
                        <p className="text-zinc-500 mt-1">{selectedLesson.description || 'Sin descripción'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {prevLesson && (
                            <button
                                onClick={() => handleLessonSelect(prevLesson)}
                                className="px-4 py-2 border border-zinc-300 text-zinc-700 rounded-lg hover:bg-zinc-50 flex items-center gap-2"
                            >
                                <ChevronLeft className="w-4 h-4" /> Anterior
                            </button>
                        )}
                        {nextLesson && (
                            <button
                                onClick={() => handleLessonSelect(nextLesson)}
                                className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-400 flex items-center gap-2"
                            >
                                Siguiente <ChevronRight className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>

                {selectedVideo && selectedLesson.videos && selectedLesson.videos.length > 1 && (
                    <div className="border-t border-zinc-200 pt-4">
                        <h3 className="font-medium mb-3">Videos de esta lección</h3>
                        <div className="space-y-2">
                            {selectedLesson.videos.map((v: any) => (
                                <button
                                    key={v.id}
                                    onClick={() => setSelectedVideo(v)}
                                    className={'w-full p-3 rounded-lg text-left transition-colors flex items-center gap-3 ' +
                                        (v.id === selectedVideo.id ? 'bg-amber-50 border border-amber-200' : 'hover:bg-zinc-50 border border-zinc-200')
                                    }
                                >
                                    <div className="w-12 h-7 bg-zinc-100 rounded flex items-center justify-center flex-shrink-0">
                                        <PlayCircle className="w-5 h-5 text-amber-500" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-zinc-900 truncate">{v.title}</p>
                                        <p className="text-xs text-zinc-500">{v.duration_seconds ? formatTime(v.duration_seconds) : ''}</p>
                                    </div>
                                    {v.id === selectedVideo.id && <CheckCircle className="w-5 h-5 text-amber-500" />}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {selectedLesson.resources && selectedLesson.resources.length > 0 && (
                    <div className="border-t border-zinc-200 pt-4 mt-4">
                        <h3 className="font-medium mb-3 flex items-center gap-2">
                            <BookOpen className="w-5 h-5" /> Recursos
                        </h3>
                        <div className="space-y-2">
                            {selectedLesson.resources.map((res: any) => (
                                <a key={res.id} href={res.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors">
                                    <span className="px-2 py-1 text-xs bg-zinc-100 text-zinc-700 rounded">{res.type.toUpperCase()}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-zinc-900 truncate">{res.title}</p>
                                        <p className="text-xs text-zinc-500 truncate">{res.url}</p>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-zinc-400" />
                                </a>
                            ))}
                        </div>
                    </div>
                )}

                <div className="mt-6 pt-4 border-t border-zinc-200">
                    <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Tu progreso en esta lección</span>
                        {progress.find(x => x.lesson_id === selectedLesson.id)?.completed && (
                            <span className="flex items-center gap-1 text-green-600 text-sm">
                                <CheckCircle className="w-4 h-4" /> Completada
                            </span>
                        )}
                    </div>
                    <div className="h-2 bg-zinc-200 rounded overflow-hidden">
                        <div className="h-full bg-amber-500 transition-all" style={{ width: progress.find(x => x.lesson_id === selectedLesson.id)?.completed ? '100%' : '0%' }} />
                    </div>
                </div>
            </div>
        </div>
    );
}

function CourseIntro({ course, sections }: { course: Course; sections: CourseSection[] }) {
    const totalLessons = sections.reduce((acc, s) => acc + (s.lessons?.length || 0), 0);
    return (
        <div className="bg-white border border-zinc-200 rounded-xl p-8 text-center">
            <BookOpen className="w-16 h-16 text-amber-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-zinc-900 mb-2">{course.title}</h2>
            <p className="text-zinc-500 mb-6 max-w-2xl mx-auto">{course.full_description}</p>
            <div className="flex items-center justify-center gap-4 text-sm text-zinc-500 mb-6">
                <span>{sections.reduce((acc, s) => acc + (s.lessons?.length || 0), 0)} lecciones</span>
                <span>•</span>
                <span>{sections.length} módulos</span>
            </div>
            <p className="text-zinc-500">Selecciona una lección del menú lateral para comenzar</p>
        </div>
    );
}

export default function CourseDetailView({ course, onBack, onNavigate }: CourseDetailViewProps) {
    const [sections, setSections] = useState<CourseSection[]>([]);
    const [progress, setProgress] = useState<StudentProgress[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedLesson, setSelectedLesson] = useState<CourseLesson | null>(null);
    const [selectedVideo, setSelectedVideo] = useState<any>(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user || null);
        });
        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        loadCourse();
    }, [course.id]);

    const loadCourse = async () => {
        setLoading(true);
        try {
            const courseData = await fetchCourseWithSections(course.id);
            if (courseData) {
                setSections(courseData.sections || []);
                if (user) {
                    const prog = await fetchStudentProgress(course.id, user.id);
                    setProgress(prog);
                }
            }
        } catch (err) {
            console.error('Error cargando curso:', err);
        } finally {
            setLoading(false);
        }
    };

    const getLessonProgress = (lessonId: string) => progress.find(p => p.lesson_id === lessonId);
    const getSectionProgress = (sectionId: string) => {
        const sectionLessons = sections.find(s => s.id === sectionId)?.lessons || [];
        if (sectionLessons.length === 0) return { completed: 0, total: 0 };
        const completed = sectionLessons.filter(l => getLessonProgress(l.id)?.completed).length;
        return { completed, total: sectionLessons.length };
    };
    const getTotalProgress = () => {
        const allLessons = sections.flatMap(s => s.lessons || []);
        if (allLessons.length === 0) return 0;
        const completed = allLessons.filter(l => getLessonProgress(l.id)?.completed).length;
        return Math.round((completed / allLessons.length) * 100);
    };
    const getAllLessons = () => sections.flatMap(s => (s.lessons || []).map(l => ({ ...l, section_id: s.id, section_title: s.title })));
    const getPrevLesson = (currentId: string) => {
        const all = getAllLessons();
        const idx = all.findIndex(l => l.id === currentId);
        return idx > 0 ? all[idx - 1] : null;
    };
    const getNextLesson = (currentId: string) => {
        const all = getAllLessons();
        const idx = all.findIndex(l => l.id === currentId);
        return idx < all.length - 1 ? all[idx + 1] : null;
    };

    const handleLessonSelect = (lesson: CourseLesson) => {
        setSelectedLesson(lesson);
        setSelectedVideo(null);
    };

    const handleLessonComplete = useCallback(async (lessonId: string) => {
        if (user) {
            const prog = await fetchStudentProgress(course.id, user.id);
            setProgress(prog);
        }
    }, [course.id, user]);

    const handleNavigateLesson = useCallback((lessonId: string) => {
        const lesson = getAllLessons().find(l => l.id === lessonId);
        if (lesson) setSelectedLesson(lesson);
    }, [getAllLessons]);

    if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><div className="w-10 h-10 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>;

    return (
        <section className="min-h-screen bg-zinc-50">
            <header className="bg-white border-b border-zinc-200 sticky top-0 z-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <button onClick={onBack} className="flex items-center gap-2 text-zinc-500 hover:text-zinc-700 lg:hidden">
                            <ArrowLeft className="w-5 h-5" /> Volver
                        </button>
                        <div className="flex-1 lg:ml-64">
                            <div className="flex items-center gap-3 mb-1">
                                <h1 className="text-xl font-bold text-zinc-900 truncate">{course.title}</h1>
                                {course.type && (
                                    <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded">
                                        {course.type.charAt(0).toUpperCase() + course.type.slice(1)}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-zinc-500">
                                <span>{sections.reduce((acc, s) => acc + (s.lessons?.length || 0), 0)} lecciones</span>
                                <span>•</span>
                                <span>{getTotalProgress()}% completado</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-2 bg-zinc-200 rounded overflow-hidden">
                                <div className="h-full bg-amber-500 transition-all" style={{ width: getTotalProgress() + '%' }} />
                            </div>
                            <span className="text-sm font-medium text-zinc-700">{getTotalProgress()}%</span>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="flex flex-col lg:flex-row gap-6">
                    <aside className={'lg:w-64 flex-shrink-0 transition-all duration-300 ' + (sidebarOpen ? '' : 'hidden lg:block')}>
                        <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
                            <div className="p-4 border-b border-zinc-200 flex items-center justify-between">
                                <h2 className="font-semibold">Contenido del curso</h2>
                                <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-1 text-zinc-500">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="p-2 max-h-[calc(100vh-200px)] overflow-y-auto">
                                {sections.map((section) => (
                                    <SectionItem
                                        key={section.id}
                                        section={section}
                                        selectedLesson={selectedLesson}
                                        progress={progress}
                                        getSectionProgress={getSectionProgress}
                                        getLessonProgress={getLessonProgress}
                                        handleLessonSelect={handleLessonSelect}
                                    />
                                ))}
                            </div>
                        </div>
                    </aside>

                    <main className="flex-1 min-w-0">
                        {selectedLesson ? (
                            <LessonContent
                                selectedLesson={selectedLesson}
                                selectedVideo={selectedVideo}
                                setSelectedVideo={setSelectedVideo}
                                getPrevLesson={getPrevLesson}
                                getNextLesson={getNextLesson}
                                handleLessonSelect={handleLessonSelect}
                                course={course}
                                user={user}
                                progress={progress}
                                handleLessonComplete={handleLessonComplete}
                                handleNavigateLesson={handleNavigateLesson}
                                getAllLessons={getAllLessons}
                            />
                        ) : (
                            <CourseIntro course={course} sections={sections} />
                        )}
                    </main>
                </div>
            </div>
        </section>
    );
}

