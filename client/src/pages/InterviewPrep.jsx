import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { useApi } from '../hooks/useApi';
import { Button } from '../components/ui/button';
import { Loader2, CheckCircle2, XCircle, BrainCircuit, ArrowRight, Sparkles, Terminal, ChevronDown, ChevronRight, Hash, Layers, Cpu } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

const InterviewPrep = () => {
    const api = useApi();
    const [step, setStep] = useState('setup'); // setup, loading, quiz, result
    const [setup, setSetup] = useState({ topic: '', difficulty: 'Medium' });
    const [quiz, setQuiz] = useState([]);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState({}); // { questionId: selectedOption }
    const [score, setScore] = useState(0);
    const [sessionId, setSessionId] = useState(null);

    const handleStart = async () => {
        if (!setup.topic.trim()) {
            toast.error("Enter topic");
            return;
        }
        setStep('loading');
        try {
            const data = await api.post('/interview/mcq', setup);
            if (data.questions && Array.isArray(data.questions)) {
                setQuiz(data.questions);
                setSessionId(data.sessionId);
                setStep('quiz');
            } else {
                toast.error("Generation failed");
                setStep('setup');
            }
        } catch (error) {
            console.error(error);
            toast.error("Quiz error");
            setStep('setup');
        }
    };

    const handleOptionSelect = (option) => {
        setAnswers({ ...answers, [currentQuestion]: option });
    };

    const handleNext = () => {
        if (currentQuestion < quiz.length - 1) {
            setCurrentQuestion(currentQuestion + 1);
        } else {
            calculateResult();
        }
    };

    const calculateResult = async () => {
        let newScore = 0;
        quiz.forEach((q, index) => {
            if (answers[index] === q.correct_answer) {
                newScore++;
            }
        });
        setScore(newScore);
        setStep('result');

        try {
            await api.post('/interview/result', {
                sessionId: sessionId,
                topic: setup.topic,
                difficulty: setup.difficulty,
                score: newScore,
                totalQuestions: quiz.length,
                questions: quiz
            });
        } catch (error) {
            console.error("Save failed", error);
        }
    };

    // --- SHARED COMPONENTS ---
    const MetadataLabel = ({ children, icon: Icon }) => (
        <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground">
            {Icon && <Icon className="h-2.5 w-2.5" />}
            {children}
        </div>
    );

    // --- SETUP VIEW ---
    if (step === 'setup') {
        return (
            <div className="flex flex-col items-center pt-20 pb-12 px-10 bg-background min-h-[calc(100vh-64px)] overflow-hidden">
                <div className="w-full max-w-[480px] space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {/* Minimal Branding */}
                    <div className="space-y-4">
                        <div className="h-8 w-8 bg-foreground rounded flex items-center justify-center shadow-2xl">
                            <Cpu className="h-4 w-4 text-background" />
                        </div>
                        <div className="space-y-1">
                            <h1 className="text-[18px] font-bold tracking-tight text-foreground">Interview Prep</h1>
                            <MetadataLabel>Skill Assessment</MetadataLabel>
                        </div>
                    </div>

                    {/* Frameless Form */}
                    <div className="space-y-12">
                        <div className="space-y-10">
                            <div className="group space-y-3">
                                <MetadataLabel icon={Hash}>Focus Domain</MetadataLabel>
                                <input
                                    className="w-full bg-transparent border-none outline-none text-[16px] p-0 font-bold focus:ring-0 placeholder:text-muted-foreground/50 transition-all text-foreground shadow-none ring-0"
                                    placeholder="Enter focus domain (e.g. OS, Distributed Systems)..."
                                    value={setup.topic}
                                    autoFocus
                                    onChange={(e) => setSetup({ ...setup, topic: e.target.value })}
                                />
                                <div className="h-[2px] w-full bg-border group-focus-within:bg-primary transition-colors" />
                            </div>

                            <div className="space-y-4">
                                <MetadataLabel icon={Layers}>Complexity Level</MetadataLabel>
                                <div className="flex gap-1">
                                    {['Easy', 'Medium', 'Hard'].map((lvl) => (
                                        <button
                                            key={lvl}
                                            onClick={() => setSetup({ ...setup, difficulty: lvl })}
                                            className={cn(
                                                "px-5 h-8 rounded-md text-[11px] font-black uppercase tracking-widest transition-all border",
                                                setup.difficulty === lvl
                                                    ? lvl === 'Easy' ? "bg-emerald-500 text-white border-emerald-600 shadow-lg shadow-emerald-500/20"
                                                        : lvl === 'Medium' ? "bg-amber-500 text-white border-amber-600 shadow-lg shadow-amber-500/20"
                                                            : "bg-rose-500 text-white border-rose-600 shadow-lg shadow-rose-500/20"
                                                    : "text-muted-foreground border-border hover:border-foreground/30 hover:bg-muted"
                                            )}
                                        >
                                            {lvl}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="pt-4">
                            <button
                                onClick={handleStart}
                                disabled={!setup.topic}
                                className="inline-flex items-center gap-2 px-6 h-10 bg-foreground text-background font-bold text-[10px] uppercase tracking-[0.2em] hover:opacity-90 active:scale-[0.98] transition-all rounded shadow-md disabled:opacity-20"
                            >
                                Start Assessment
                                <ArrowRight className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        );
    }

    // --- LOADING VIEW ---
    if (step === 'loading') {
        return (
            <div className="flex h-[calc(100vh-64px)] items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                        <div className="h-10 w-10 rounded-full border border-border/40 animate-ping absolute" />
                        <div className="h-10 w-10 flex items-center justify-center bg-foreground text-background rounded-full relative">
                            <Cpu className="h-4 w-4 animate-pulse" />
                        </div>
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground/40 animate-pulse">Initializing Domain</span>
                </div>
            </div>
        );
    }

    // --- QUIZ VIEW ---
    if (step === 'quiz') {
        const question = quiz[currentQuestion];
        const progress = (currentQuestion / quiz.length) * 100;

        return (
            <div className="flex flex-col h-[calc(100vh-64px)] bg-background overflow-hidden">
                {/* Frameless Top Navigation */}
                <div className="w-full h-14 flex items-center px-8 border-b border-border bg-muted/5">
                    <div className="flex items-center gap-2 flex-1">
                        <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Domain:</span>
                        <span className="text-[11px] font-black uppercase tracking-widest text-foreground underline underline-offset-4 decoration-border">{setup.topic}</span>
                        <div className="h-4 w-px bg-border mx-2" />
                        <span className={cn(
                            "text-[11px] font-black uppercase tracking-widest",
                            setup.difficulty === 'Easy' ? "text-emerald-500" : setup.difficulty === 'Medium' ? "text-amber-500" : "text-rose-500"
                        )}>{setup.difficulty} level</span>
                    </div>
                    <div className="text-[11px] font-black tabular-nums tracking-widest text-foreground px-3 py-1 bg-muted rounded border border-border">
                        {currentQuestion + 1} / {quiz.length}
                    </div>
                </div>

                {/* Micro Progress Bar */}
                <div className="h-[4px] w-full bg-border/20">
                    <div className="h-full bg-emerald-500 transition-all duration-700 shadow-[0_0_10px_rgba(16,185,129,0.2)]" style={{ width: `${progress}%` }} />
                </div>

                <main className="flex-1 flex flex-col items-center pt-12 pb-12 overflow-y-auto px-8">
                    <div className="w-full space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                        {/* Question */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-foreground" />
                                    <MetadataLabel>Question {currentQuestion + 1}</MetadataLabel>
                                </div>
                                {answers[currentQuestion] && (
                                    <button
                                        onClick={() => {
                                            const newAnswers = { ...answers };
                                            delete newAnswers[currentQuestion];
                                            setAnswers(newAnswers);
                                        }}
                                        className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500/60 hover:text-red-500 transition-all flex items-center gap-1.5 px-3 py-1 bg-red-500/5 rounded border border-red-500/10"
                                    >
                                        <XCircle className="h-3 w-3" />
                                        Clear Selection
                                    </button>
                                )}
                            </div>
                            <div className="text-[15px] font-bold tracking-tight text-foreground leading-relaxed">
                                <ReactMarkdown
                                    rehypePlugins={[rehypeRaw]}
                                    components={{
                                        p: ({ node, ...props }) => <div className="mb-4 last:mb-0" {...props} />,
                                        code: ({ node, inline, className, children, ...props }) => {
                                            if (inline) {
                                                return <code className="bg-muted px-1.5 py-0.5 rounded text-[0.9em] font-mono font-bold" {...props}>{children}</code>;
                                            }
                                            return (
                                                <div className="relative my-4 rounded-lg overflow-hidden bg-slate-950 border border-slate-800 shadow-sm">
                                                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-900/50 border-b border-white/5">
                                                        <div className="flex gap-1.5">
                                                            <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/50" />
                                                            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/20 border border-amber-500/50" />
                                                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/20 border border-emerald-500/50" />
                                                        </div>
                                                        <span className="ml-2 text-[10px] font-mono text-slate-500 uppercase tracking-wider">code snippet</span>
                                                    </div>
                                                    <pre className="p-4 overflow-x-auto text-[13px] font-mono leading-relaxed text-slate-300">
                                                        <code {...props}>{children}</code>
                                                    </pre>
                                                </div>
                                            );
                                        }
                                    }}
                                >
                                    {question.question}
                                </ReactMarkdown>
                            </div>

                        </div>

                        {/* Options Vertical List */}
                        <div className="flex flex-col gap-2 w-full">
                            {question.options.map((option, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleOptionSelect(option)}
                                    className={cn(
                                        "group flex items-center gap-4 p-4 text-left transition-all border-2 rounded-lg",
                                        answers[currentQuestion] === option
                                            ? "border-foreground bg-foreground/5 shadow-inner"
                                            : "border-border hover:border-foreground/30 hover:bg-muted/50"
                                    )}
                                >
                                    <div className={cn(
                                        "w-6 h-6 rounded flex items-center justify-center text-[11px] font-black shrink-0 border-2 transition-all",
                                        answers[currentQuestion] === option
                                            ? "bg-foreground text-background border-foreground"
                                            : "border-border text-muted-foreground group-hover:border-foreground/50"
                                    )}>
                                        {String.fromCharCode(65 + idx)}
                                    </div>
                                    <span className={cn(
                                        "text-[14px] font-semibold leading-relaxed tracking-tight transition-colors flex-1",
                                        answers[currentQuestion] === option ? "text-foreground" : "text-foreground/80 group-hover:text-foreground"
                                    )}>
                                        {option}
                                    </span>
                                </button>
                            ))}
                        </div>

                        {/* Controls */}
                        <div className="flex items-center justify-between pt-6">
                            <div className="flex items-center gap-6">
                                <button
                                    onClick={() => { if (currentQuestion > 0) setCurrentQuestion(v => v - 1) }}
                                    disabled={currentQuestion === 0}
                                    className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground disabled:opacity-0 transition-all flex items-center gap-1.5"
                                >
                                    <ChevronDown className="rotate-90 h-3 w-3" />
                                    Previous
                                </button>
                            </div>
                            <button
                                onClick={handleNext}
                                disabled={!answers[currentQuestion]}
                                className="group/next px-8 h-10 bg-foreground text-background font-bold text-[10px] uppercase tracking-[0.2em] rounded shadow-md hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-20 flex items-center gap-2"
                            >
                                {currentQuestion === quiz.length - 1 ? 'Submit Assessment' : 'Next'}
                                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover/next:translate-x-1 group-active/next:translate-x-2" />
                            </button>
                        </div>
                    </div >
                </main >
            </div >
        );
    }

    // --- RESULT VIEW ---
    if (step === 'result') {
        const percentage = Math.round((score / quiz.length) * 100);

        return (
            <div className="flex flex-col items-center pt-24 pb-24 bg-background min-h-[calc(100vh-64px)] overflow-y-auto px-12">
                <div className="w-full space-y-20 animate-in fade-in duration-1000">
                    {/* Minimal Results Header */}
                    <div className="flex items-end justify-between border-b border-border/10 pb-12">
                        <div className="space-y-4">
                            <h2 className="text-[20px] font-bold tracking-tight text-foreground">Diagnostic Summary</h2>
                            <div className="flex items-center gap-4">
                                <Badge variant="outline" className="h-5 text-[9px] font-black uppercase rounded-sm border-border/40 text-muted-foreground/40">{setup.topic}</Badge>
                                <div className="h-3 w-px bg-border/20" />
                                <span className={cn("text-[10px] font-black uppercase tracking-widest", percentage >= 60 ? "text-emerald-500" : "text-red-500")}>
                                    {percentage >= 60 ? 'Status: Certified' : 'Status: Fail'}
                                </span>
                            </div>
                        </div>
                        <div className="text-right space-y-1">
                            <div className="text-[48px] font-black tabular-nums tracking-tighter leading-none">{percentage}%</div>
                            <MetadataLabel>Assessment Accuracy</MetadataLabel>
                        </div>
                    </div>

                    {/* Frameless Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
                        <div className="space-y-2">
                            <MetadataLabel icon={CheckCircle2}>Resolved</MetadataLabel>
                            <p className="text-[15px] font-bold tabular-nums">{score} / {quiz.length}</p>
                        </div>
                        <div className="space-y-2">
                            <MetadataLabel icon={Terminal}>Rank</MetadataLabel>
                            <p className="text-[15px] font-bold uppercase tracking-widest">{percentage >= 80 ? 'Elite' : percentage >= 60 ? 'Senior' : 'Junior'}</p>
                        </div>
                        <div className="space-y-2 col-span-2">
                            <MetadataLabel icon={Cpu}>Processor</MetadataLabel>
                            <p className="text-[15px] font-bold uppercase tracking-widest text-muted-foreground/60 overflow-hidden text-ellipsis">IntelliGrow-AI v4</p>
                        </div>
                    </div>

                    {/* Audit Log Style Questions */}
                    <div className="space-y-12">
                        <div className="flex items-center gap-4">
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/20">System Verification Logs</span>
                            <div className="h-px flex-1 bg-border/10" />
                        </div>

                        <div className="space-y-16">
                            {quiz.map((q, idx) => {
                                const isCorrect = answers[idx] === q.correct_answer;
                                return (
                                    <div key={idx} className="space-y-6 group">
                                        <div className="flex gap-8">
                                            <span className="text-[11px] font-black tabular-nums text-muted-foreground pt-1">0{idx + 1}</span>
                                            <div className="flex-1 space-y-6">
                                                <div className="space-y-4">
                                                    <h4 className="text-[15px] font-bold leading-relaxed tracking-tight text-foreground max-w-2xl">{q.question}</h4>

                                                    <div className="flex items-center gap-4 text-[11px] font-bold uppercase tracking-tight">
                                                        <div className={cn("flex items-center gap-2", isCorrect ? "text-emerald-500" : "text-red-500")}>
                                                            <div className={cn("h-1 w-1 rounded-full", isCorrect ? "bg-emerald-500" : "bg-red-500")} />
                                                            {answers[idx] || 'NULL'}
                                                        </div>
                                                        {!isCorrect && (
                                                            <div className="text-muted-foreground/60 flex items-center gap-2">
                                                                <ArrowRight className="h-3 w-3" />
                                                                <span className="text-emerald-500 font-black">{q.correct_answer}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="text-[12px] leading-relaxed text-muted-foreground/60 font-medium max-w-xl border-l-2 border-border/10 pl-4 py-1 italic whitespace-pre-wrap">
                                                    {q.explanation}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Final Actions */}
                    <div className="pt-20 border-t border-border/10 flex justify-center gap-4">
                        <button
                            onClick={() => setStep('setup')}
                            className="px-8 h-10 border border-border/40 text-[10px] font-bold uppercase tracking-[0.2em] rounded hover:bg-muted/30 transition-all text-foreground/60 hover:text-foreground"
                        >
                            Reset Assessment
                        </button>
                        <Link to="/dashboard">
                            <button className="px-8 h-10 bg-foreground text-background text-[10px] font-bold uppercase tracking-[0.2em] rounded shadow-xl hover:opacity-90 transition-all">
                                Exit Interface
                            </button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return null;
};

export default InterviewPrep;
