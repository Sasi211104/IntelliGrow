import React, { useState } from 'react';
import { useApi } from '../hooks/useApi';
import Editor from '@monaco-editor/react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Loader2, Play, Terminal, Sparkles, RefreshCw, Languages, CheckCircle2, XCircle, AlertCircle, Info, ChevronRight, ChevronUp, ChevronDown, Code2, FileText, History, Copy, RotateCcw, Check, CloudUpload } from 'lucide-react';
import { useTheme } from '../components/theme-provider';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "../components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";

const CircularProgress = ({ progress, size = 100, strokeWidth = 6, indeterminate = false, children }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = indeterminate ? circumference * 0.7 : circumference - (progress / 100) * circumference;

    return (
        <div className={cn("relative flex items-center justify-center", indeterminate && "animate-pulse")} style={{ width: size, height: size }}>
            <svg className={cn("transform -rotate-90", indeterminate && "animate-spin-slow")} width={size} height={size}>
                <circle
                    className="text-muted/10"
                    strokeWidth={strokeWidth}
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                />
                {!indeterminate && (
                    <circle
                        className="text-foreground transition-all duration-500 ease-in-out"
                        strokeWidth={strokeWidth}
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="transparent"
                        r={radius}
                        cx={size / 2}
                        cy={size / 2}
                    />
                )}
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
                {children ? children : (
                    <span className="text-xl font-bold tabular-nums leading-none tracking-tight">
                        {indeterminate ? "?" : Math.round(progress)}<span className="text-[10px] opacity-40 ml-0.5">%</span>
                    </span>
                )}
            </div>
        </div>
    );
};

const CodingWorkspace = () => {
    const api = useApi();
    const { theme } = useTheme();

    const monacoTheme = theme === 'dark' ? 'vs-dark' : 'light';

    const [problem, setProblem] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isRunning, setIsRunning] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [executionStatus, setExecutionStatus] = useState('idle'); // idle, running, success, error
    const [sessionId, setSessionId] = useState(null);
    const [totalProblems, setTotalProblems] = useState(0);
    const [targetIndex, setTargetIndex] = useState('');
    const [consoleHeight, setConsoleHeight] = useState(350);
    const [isResizing, setIsResizing] = useState(false);

    const [isConsoleOpen, setIsConsoleOpen] = useState(true);

    const toggleConsole = () => {
        setIsConsoleOpen(prev => !prev);
    };

    const [language, setLanguage] = useState('javascript');
    const [code, setCode] = useState('// Generate problem to start');

    const handleMouseDown = (e) => {
        setIsResizing(true);
        e.preventDefault();
    };

    React.useEffect(() => {
        if (isResizing) return;

        if (!targetIndex) {
            setProblem(null);
            return;
        }

        const numIdx = parseInt(targetIndex, 10);
        if (isNaN(numIdx)) return;

        const isWithinRange = numIdx >= 1 && numIdx <= totalProblems;
        const delay = isWithinRange ? 150 : 600;

        const autoTrigger = setTimeout(() => {
            if (isWithinRange) {
                generateProblem(targetIndex);
            } else if (targetIndex.length > 0) {
                setProblem(null);
                toast.error(`Problem ${targetIndex} is out of range (1-${totalProblems})`);
            }
        }, delay);

        return () => clearTimeout(autoTrigger);
    }, [targetIndex, totalProblems, isResizing]);

    React.useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isResizing) return;
            const newHeight = window.innerHeight - e.clientY;
            if (newHeight > 100 && newHeight < window.innerHeight * 0.8) {
                setConsoleHeight(newHeight);
            }
        };
        const handleMouseUp = () => setIsResizing(false);

        if (isResizing) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing]);

    React.useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await api.get('/interview/dsa/stats');
                setTotalProblems(data.totalProblems || 0);
            } catch (error) {
                console.error("Stats Fetch Error:", error);
            }
        };
        fetchStats();
    }, []);

    const formatDescription = (desc) => {
        if (!desc) return '';
        let cleaned = desc;
        cleaned = cleaned.replace(/([0-9a-zA-Z)]+)\s*(\^|\*\*)\s*([0-9]+)/g, '$1<sup>$3</sup>');
        cleaned = cleaned.replace(/[`]/g, '');
        cleaned = cleaned.replace(/^(Description|### Description|## Description)\s*/i, '');
        cleaned = cleaned.replace(/### (.*?) ###/g, '<h4 class="text-foreground font-bold uppercase tracking-wider text-[11px] mt-6 mb-2 border-l-2 border-primary pl-3">$1</h4>');
        cleaned = cleaned.replace(/### (.*?)$/gm, '<h4 class="text-foreground font-bold uppercase tracking-wider text-[11px] mt-6 mb-2 border-l-2 border-primary pl-3">$1</h4>');
        cleaned = cleaned.replace(/(Example \d+:)/g, '<strong class="font-bold text-foreground block mt-4 mb-2">$1</strong>');
        cleaned = cleaned.replace(/(<h4.*?>.*?<\/h4>)\s*\1/g, '$1');
        cleaned = cleaned.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>');
        cleaned = cleaned.replace(/\*([^*]+)\*/g, '<strong class="font-bold">$1</strong>');
        cleaned = cleaned.replace(/^-\s*/gm, '• ');
        if (!cleaned.includes('<p>')) {
            cleaned = cleaned.split('\n\n').filter(p => p.trim()).map(p => `<p class="mb-4">${p.trim().replace(/\n/g, '<br/>')}</p>`).join('');
        }
        return cleaned;
    };

    const [lastAction, setLastAction] = useState(null);
    const [runResults, setRunResults] = useState([]);
    const [compileError, setCompileError] = useState(null);
    const [submitProgress, setSubmitProgress] = useState({ current: 0, passed: 0, total: 0 });
    const [allResults, setAllResults] = useState([]);
    const [verdict, setVerdict] = useState({ status: '', passed: 0, total: 0, failedCase: null });
    const [submissionHistory, setSubmissionHistory] = useState([]);
    const [leftPanelTab, setLeftPanelTab] = useState('description');
    const [selectedSubmission, setSelectedSubmission] = useState(null);

    const handleCopyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        toast.success("Code copied to clipboard!");
    };

    const handleRestoreToEditor = (sub) => {
        setLanguage(sub.language);
        setCode(sub.code);
        setSelectedSubmission(null);
        toast.success(`Restored ${sub.language} solution to editor`);
    };

    const fetchSubmissionHistory = async () => {
        if (!problem) return;
        try {
            const data = await api.get(`/code/submissions/${problem.id || problem._id}`);
            setSubmissionHistory(data || []);
        } catch (error) {
            console.error("Fetch Submission History Error:", error);
        }
    };

    const generateProblem = async (idx) => {
        if (idx !== undefined && idx !== '') {
            const numIdx = parseInt(idx, 10);
            if (isNaN(numIdx) || numIdx < 1 || numIdx > totalProblems) {
                toast.error(`Please try between the range of 1 to ${totalProblems}`);
                setTargetIndex('');
                return;
            }
        }
        setIsLoading(true);
        try {
            const payload = {};
            if (idx !== undefined && idx !== '') payload.problemIndex = idx;
            const data = await api.post('/interview/dsa', payload);
            if (data.problem) {
                setProblem(data.problem);
                setSessionId(data.sessionId);
                const starter = data.problem.starter_code?.[language] || `// Write your solution for: ${data.problem.title}`;
                setCode(starter);
                setRunResults([]);
                setVerdict({ status: '', passed: 0, total: 0, failedCase: null });
                setExecutionStatus('idle');
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to generate problem.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAction = async (type = 'run') => {
        const isRun = type === 'run';
        if (isRun) setIsRunning(true);
        else setIsSubmitting(true);

        setLastAction(type);
        setExecutionStatus('running');
        setCompileError(null);
        setAllResults([]);

        if (isRun) {
            setRunResults([]);
        } else {
            setSubmitProgress({ current: 0, passed: 0, total: 0 });
            setVerdict({ status: 'Initializing...', passed: 0, total: 0, failedCase: null });
        }

        const payload = { language, code, problemId: problem?.id || problem?._id, sessionId: sessionId };

        try {
            const endpoint = isRun ? '/code/run' : '/code/submit';
            const rawResponse = await api.post(endpoint, payload);
            const data = rawResponse.data || rawResponse.result || rawResponse;
            const finalData = data.data || data;
            const stderr = finalData.run?.stderr || finalData.stderr || (finalData.run?.code !== 0 && finalData.run?.output && !finalData.results) || null;

            if (stderr) {
                setCompileError(stderr);
                setExecutionStatus('error');
                if (!isRun) {
                    setVerdict({ status: 'Runtime Error', passed: 0, total: 0, failedCase: null });
                    setIsSubmitting(false);
                } else {
                    setIsRunning(false);
                }
                return;
            }

            const results = finalData.results || data.results || rawResponse.results || [];
            const criticalError = results.find(r => r.stderr || (r.code !== undefined && r.code !== 0));
            if (criticalError) {
                const errTitle = criticalError.stderr || criticalError.error || "Unknown Runtime Error";
                setCompileError(errTitle);
                setExecutionStatus('error');
                if (!isRun) {
                    setVerdict({ status: 'Runtime Error', passed: 0, total: 0, failedCase: null });
                    setIsSubmitting(false);
                } else {
                    setIsRunning(false);
                }
                return;
            }

            if (isRun) {
                const mapped = results.map(res => ({
                    input: res.input || "N/A",
                    userOutput: res.output || res.userOutput || res.stdout || "N/A",
                    expectedOutput: res.expected || res.expectedOutput || "N/A",
                    passed: res.passed ?? (String(res.output).trim() === String(res.expected).trim())
                }));
                let currentIdx = 0;
                const total = mapped.length;
                const interval = setInterval(() => {
                    if (currentIdx < total) {
                        setRunResults(prev => [...prev, mapped[currentIdx]]);
                        currentIdx++;
                    } else {
                        clearInterval(interval);
                        setExecutionStatus(mapped.every(r => r.passed) ? 'success' : 'error');
                        setIsRunning(false);
                    }
                }, 150);
            } else {
                let mappedResults = results.map(res => ({
                    input: res.input || "N/A",
                    userOutput: res.output || res.userOutput || res.stdout || "N/A",
                    expectedOutput: res.expected || res.expectedOutput || "N/A",
                    passed: res.passed ?? (String(res.output).trim() === String(res.expected).trim())
                }));
                if (mappedResults.length === 0 && finalData.failure) {
                    const f = finalData.failure;
                    mappedResults = [{ input: f.input || "N/A", userOutput: f.actual || f.error || "N/A", expectedOutput: f.expected || "N/A", passed: false }];
                }
                const status = finalData.status || data.status || finalData.finalStatus || (finalData.run?.code === 0 ? 'Accepted' : 'Error') || "Unknown";
                const total = mappedResults.length || 0;
                setSubmitProgress({ current: 0, passed: 0, total });
                let currentIdx = 0;
                let runningPassed = 0;
                const interval = setInterval(() => {
                    if (currentIdx < total) {
                        if (mappedResults[currentIdx].passed) runningPassed++;
                        currentIdx++;
                        setSubmitProgress({ current: currentIdx, passed: runningPassed, total });
                    } else {
                        clearInterval(interval);
                        setAllResults(mappedResults);
                        const finalPassed = mappedResults.filter(r => r.passed).length;
                        const firstFail = mappedResults.find(r => !r.passed);
                        setVerdict({
                            status,
                            passed: finalPassed,
                            total,
                            failedCase: firstFail ? { index: mappedResults.indexOf(firstFail) + 1, input: firstFail.input, userOutput: firstFail.userOutput, expectedOutput: firstFail.expectedOutput } : null
                        });
                        if (status === 'Accepted' || (finalPassed > 0 && finalPassed === total)) {
                            setExecutionStatus('success');
                            toast.success("Accepted!");
                        } else {
                            setExecutionStatus('error');
                            toast.error(`Submission: ${status}`);
                        }
                        setIsSubmitting(false);
                    }
                }, 200);
            }
        } catch (error) {
            console.error(error);
            setCompileError(error.message || 'An error occurred during execution.');
            setExecutionStatus('error');
            toast.error(type === 'run' ? "Execution failed." : "Submission failed.");
            setIsSubmitting(false);
        } finally {
            if (isRun) setIsRunning(false);
        }
    };

    const handleLanguageChange = (newLang) => {
        setLanguage(newLang);
        if (problem?.starter_code?.[newLang]) setCode(problem.starter_code[newLang]);
    };

    return (
        <div className={cn("container h-[calc(100vh-4rem)] max-w-[1600px] py-6 grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 overflow-hidden relative", isResizing && "select-none cursor-ns-resize")}>
            <style>{`
                input[type=number]::-webkit-inner-spin-button, 
                input[type=number]::-webkit-outer-spin-button { 
                    -webkit-appearance: none; 
                    margin: 0; 
                }
                input[type=number] { 
                    -moz-appearance: textfield; 
                }
            `}</style>
            <div className="flex flex-col space-y-4 h-full min-h-[400px]">
                <Card className="flex-1 flex flex-col overflow-hidden border-border shadow-xl rounded-2xl">
                    <CardHeader className="flex flex-col space-y-4 pb-4 border-b bg-muted/5">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <CardTitle className="text-xl flex items-center gap-3 font-bold tracking-tight text-foreground/90">
                                    {problem ? problem.title : "Coding Workspace"}
                                </CardTitle>
                                {problem && (
                                    <Badge
                                        className={cn(
                                            "text-[10px] font-bold tracking-tight h-5 px-2 rounded-full border-none pointer-events-none hover:bg-transparent",
                                            problem.difficulty === 'Easy' ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" :
                                                problem.difficulty === 'Medium' ? "bg-amber-500/10 text-amber-500" :
                                                    "bg-red-500/10 text-red-500"
                                        )}
                                    >
                                        {problem.difficulty}
                                    </Badge>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="hidden sm:flex flex-col items-end mr-1">
                                    <span className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">Problem Pool</span>
                                    <span className="text-[10px] font-bold">{totalProblems} TOTAL</span>
                                </div>
                                <div className="flex items-center">
                                    <input
                                        type="number"
                                        placeholder="No."
                                        value={targetIndex}
                                        onChange={(e) => setTargetIndex(e.target.value)}
                                        className={cn(
                                            "w-12 h-8 border rounded-lg bg-background text-center text-[10px] font-bold focus:outline-none placeholder:opacity-40",
                                            targetIndex && (parseInt(targetIndex, 10) < 1 || parseInt(targetIndex, 10) > totalProblems)
                                                ? "border-destructive text-destructive bg-destructive/5"
                                                : "border-border focus:border-primary/40"
                                        )}
                                        title={targetIndex && (parseInt(targetIndex, 10) < 1 || parseInt(targetIndex, 10) > totalProblems) ? `Please enter between 1 and ${totalProblems}` : ""}
                                        min="1"
                                        max={totalProblems}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-6">
                            <button
                                onClick={() => setLeftPanelTab('description')}
                                className={cn(
                                    "flex items-center gap-2 text-[11px] font-semibold tracking-wide transition-all relative pb-2",
                                    leftPanelTab === 'description' ? "text-primary" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <FileText className={cn("h-3.5 w-3.5", leftPanelTab === 'description' ? "text-primary" : "text-blue-500/70")} /> Description
                                {leftPanelTab === 'description' && <div className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-primary rounded-full" />}
                            </button>
                            <button
                                onClick={() => { setLeftPanelTab('submissions'); fetchSubmissionHistory(); }}
                                className={cn(
                                    "flex items-center gap-2 text-[11px] font-semibold tracking-wide transition-all relative pb-2",
                                    leftPanelTab === 'submissions' ? "text-primary" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <History className={cn("h-3.5 w-3.5", leftPanelTab === 'submissions' ? "text-primary" : "text-blue-500/70")} /> Submissions
                                {leftPanelTab === 'submissions' && <div className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-primary rounded-full" />}
                            </button>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                        {problem ? (
                            leftPanelTab === 'description' ? (
                                <div className="space-y-8 animate-in fade-in duration-300">
                                    <div
                                        className="text-foreground/80 leading-relaxed font-sans text-[14px] description-content"
                                        dangerouslySetInnerHTML={{ __html: formatDescription(problem.description) }}
                                    />
                                    <style>{`
                                            .description-content p { margin-bottom: 1rem; }
                                            .description-content strong { font-weight: 600; color: hsl(var(--foreground)); }
                                            .description-content pre { background: hsl(var(--muted)/0.3); padding: 1.25rem; border-radius: 0.5rem; margin: 1.5rem 0; font-family: 'JetBrains Mono', monospace; overflow-x: auto; border: 1px solid hsl(var(--border)); color: hsl(var(--foreground)); }
                                            .description-content img { max-width: 100%; height: auto; border-radius: 0.5rem; margin: 1.5rem 0; border: 1px solid hsl(var(--border)); padding: 0.5rem; }
                                            .description-content ul, .description-content ol { margin: 1rem 0; padding-left: 1.5rem; }
                                            .description-content li { margin-bottom: 0.5rem; }
                                            .description-content code { background: hsl(var(--muted)); padding: 0.2rem 0.4rem; border-radius: 0.375rem; font-family: monospace; font-size: 0.9em; border: 1px solid hsl(var(--border)); }
                                        `}</style>
                                </div>
                            ) : (
                                <div className="space-y-4 animate-in fade-in duration-300">
                                    <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-6">Submission History</div>
                                    {submissionHistory.length === 0 ? (
                                        <div className="text-center py-12 text-muted-foreground text-sm font-medium italic opacity-50">No previous submissions found.</div>
                                    ) : (
                                        <div className="space-y-3">
                                            {submissionHistory.map((sub) => (
                                                <div
                                                    key={sub.id}
                                                    onClick={() => setSelectedSubmission(sub)}
                                                    className="group flex items-center justify-between p-4 bg-muted/10 border border-border rounded-xl hover:border-primary/30 hover:bg-muted/20 transition-all cursor-pointer"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className={cn("h-10 w-1 rounded-full", sub.status === 'Accepted' ? "bg-green-500" : "bg-red-500/40")} />
                                                        <div className="space-y-1">
                                                            <div className={cn("text-xs font-semibold uppercase tracking-tight", sub.status === 'Accepted' ? "text-green-600 dark:text-green-400" : "text-muted-foreground")}>{sub.status}</div>
                                                            <div className="text-[10px] font-medium text-muted-foreground/50">{new Date(sub.created_at).toLocaleString()}</div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-6">
                                                        <div className="text-right">
                                                            <div className="text-[10px] font-bold text-muted-foreground uppercase">{sub.language}</div>
                                                            <div className="text-[10px] font-medium text-muted-foreground/40">{sub.execution_time}ms</div>
                                                        </div>
                                                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-all" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <Dialog open={!!selectedSubmission} onOpenChange={() => setSelectedSubmission(null)}>
                                        <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0 overflow-hidden">
                                            <DialogHeader className="p-6 border-b bg-muted/5">
                                                <div className="flex items-center justify-between">
                                                    <div className="space-y-1.5 text-left">
                                                        <DialogTitle>Submission Details</DialogTitle>
                                                        <div className="flex items-center gap-3">
                                                            <Badge variant={selectedSubmission?.status === 'Accepted' ? "success" : "destructive"} className="text-[10px] font-bold px-2 rounded-full">
                                                                {selectedSubmission?.status}
                                                            </Badge>
                                                            <span className="text-[11px] font-medium text-muted-foreground">
                                                                {selectedSubmission && new Date(selectedSubmission.created_at).toLocaleString()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2 mr-8">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-8 rounded-lg font-bold text-[11px] text-muted-foreground hover:text-foreground"
                                                            onClick={() => handleCopyToClipboard(selectedSubmission?.code)}
                                                        >
                                                            <Copy className="h-3.5 w-3.5 mr-2" /> Copy
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-8 rounded-md font-bold text-[11px] text-muted-foreground hover:text-foreground"
                                                            onClick={() => handleRestoreToEditor(selectedSubmission)}
                                                        >
                                                            <RotateCcw className="h-3.5 w-3.5 mr-2" /> Restore
                                                        </Button>
                                                    </div>
                                                </div>
                                            </DialogHeader>
                                            <div className="flex-1 overflow-hidden relative bg-[#1e1e1e]">
                                                <Editor
                                                    height="100%"
                                                    language={selectedSubmission?.language === 'cpp' ? 'cpp' : selectedSubmission?.language}
                                                    theme="vs-dark"
                                                    value={selectedSubmission?.code || ''}
                                                    options={{
                                                        readOnly: true,
                                                        minimap: { enabled: false },
                                                        fontSize: 13,
                                                        fontFamily: "'JetBrains Mono', monospace",
                                                        scrollBeyondLastLine: false,
                                                        automaticLayout: true,
                                                        padding: { top: 20 },
                                                        renderLineHighlight: 'all',
                                                        lineNumbers: 'on',
                                                        folding: true
                                                    }}
                                                />
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            )
                        ) : (
                            <div className="flex h-full flex-col items-center justify-center text-center space-y-4 p-12 text-muted-foreground">
                                <div className="p-4 rounded-full bg-muted shadow-inner"><Code2 className="h-10 w-10 text-muted-foreground/30" /></div>
                                <div className="max-w-xs space-y-1">
                                    <h3 className="text-lg font-bold text-foreground/80">Coding Workspace</h3>
                                    <p className="text-sm opacity-60">Generate problem to start</p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card >
            </div >

            <div className="flex flex-col space-y-4 h-full min-h-[500px]">
                <Card className="flex-1 flex flex-col overflow-hidden border-border shadow-md rounded-xl">
                    <div className="flex items-center justify-between p-3 px-4 bg-muted/10 border-b">
                        <div className="flex items-center space-x-4">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-9 px-3 border border-border bg-background rounded-md text-[11px] font-bold tracking-tight hover:bg-muted/50 transition-all flex items-center justify-between min-w-[140px]"
                                    >
                                        <div className="flex items-center gap-2">
                                            {language === 'javascript' && 'JavaScript / Node'}
                                            {language === 'python' && 'Python 3.x'}
                                            {language === 'java' && 'Java 17 / JDK'}
                                            {language === 'cpp' && 'C++ 20 / GCC'}
                                        </div>
                                        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground ml-2 opacity-50" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="w-[180px] bg-background border-border rounded-lg shadow-xl p-1">
                                    <DropdownMenuItem onClick={() => handleLanguageChange('javascript')} className="flex items-center justify-between px-3 py-2 text-[11px] font-bold cursor-pointer rounded-md">
                                        JavaScript / Node {language === 'javascript' && <Check className="h-3 w-3 text-primary" />}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleLanguageChange('python')} className="flex items-center justify-between px-3 py-2 text-[11px] font-bold cursor-pointer rounded-md">
                                        Python 3.x {language === 'python' && <Check className="h-3 w-3 text-primary" />}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleLanguageChange('java')} className="flex items-center justify-between px-3 py-2 text-[11px] font-bold cursor-pointer rounded-md">
                                        Java 17 / JDK {language === 'java' && <Check className="h-3 w-3 text-primary" />}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleLanguageChange('cpp')} className="flex items-center justify-between px-3 py-2 text-[11px] font-bold cursor-pointer rounded-md">
                                        C++ 20 / GCC {language === 'cpp' && <Check className="h-3 w-3 text-primary" />}
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            {(isRunning || isSubmitting) && (
                                <div className="flex items-center gap-2.5 text-[11px] font-bold text-primary tracking-wide animate-pulse">
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    {isRunning ? 'Processing...' : 'Evaluating...'}
                                </div>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleAction('run')}
                                disabled={isRunning || isSubmitting || !problem}
                                className="h-9 px-5 rounded-md font-bold text-[10px] tracking-[0.1em] uppercase border-2 border-border bg-background shadow-sm hover:bg-muted active:translate-y-[1px] transition-all"
                            >
                                <Play className="h-3.5 w-3.5 mr-2" /> Run
                            </Button>
                            <Button
                                size="sm"
                                onClick={() => handleAction('submit')}
                                disabled={isRunning || isSubmitting || !problem}
                                className="h-9 px-5 rounded-md font-bold text-[10px] tracking-[0.1em] uppercase bg-foreground text-background hover:bg-foreground/90 active:translate-y-[1px] transition-all shadow-md shadow-foreground/5"
                            >
                                <CloudUpload className="h-4 w-4 mr-2" /> Submit
                            </Button>
                        </div>
                    </div>

                    <div className={cn("flex-1 relative bg-[#1e1e1e] min-h-0", isResizing && "pointer-events-none")}>
                        <Editor
                            height="100%"
                            language={language === 'cpp' ? 'cpp' : language}
                            theme={monacoTheme}
                            value={code}
                            onChange={(val) => setCode(val)}
                            options={{ minimap: { enabled: false }, fontSize: 13, fontFamily: "'JetBrains Mono', monospace", scrollBeyondLastLine: false, automaticLayout: true, padding: { top: 20 }, renderLineHighlight: 'all', hideCursorInOverviewRuler: true }}
                        />
                    </div>

                    <div
                        className={cn(
                            "bg-background text-foreground flex flex-col border-t border-border relative z-50",
                            !isConsoleOpen && "transition-all duration-300"
                        )}
                        style={{ height: isConsoleOpen ? `${consoleHeight}px` : '44px', flexShrink: 0 }}
                    >
                        {isConsoleOpen && (
                            <div
                                onMouseDown={handleMouseDown}
                                className="absolute -top-3 left-0 right-0 h-6 cursor-ns-resize z-[60] group/resize"
                            >
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-[2px] rounded-full bg-border/60 group-hover/resize:bg-primary/50 transition-all duration-200" />
                            </div>
                        )}
                        <div className="h-11 flex items-center justify-between px-5 select-none border-b border-border/10">
                            <div
                                className="flex items-center gap-2 px-2 -ml-2 py-1.5 rounded-md"
                            >
                                <Terminal className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1.5">Test Result</span>
                            </div>
                            <button
                                onClick={toggleConsole}
                                className="p-2 -mr-2 cursor-pointer hover:bg-muted/50 rounded-md text-muted-foreground hover:text-foreground transition-colors"
                                title={isConsoleOpen ? "Collapse" : "Expand"}
                            >
                                {isConsoleOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                            </button>
                        </div>

                        {isConsoleOpen && (
                            <div
                                className="flex flex-col overflow-hidden animate-in slide-in-from-bottom-1 duration-200"
                                style={{ height: `${consoleHeight - 44}px` }}
                            >
                                <div className="flex-1 p-6 overflow-y-auto custom-scrollbar font-sans text-sm">
                                    <div className="space-y-8">
                                        {compileError ? (
                                            <div className="space-y-4">
                                                <div className="bg-destructive/10 text-destructive px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider border border-destructive/20 flex items-center gap-2"><AlertCircle className="h-3.5 w-3.5" /> Runtime / Compilation Error</div>
                                                <div className="bg-muted/50 p-4 rounded-lg border border-border/50"><pre className="text-destructive font-mono text-[12px] whitespace-pre-wrap leading-relaxed">{compileError}</pre></div>
                                            </div>
                                        ) : isSubmitting || (lastAction === 'submit' && !allResults.length && submitProgress.total > 0) ? (
                                            <div className="h-full flex flex-col items-center justify-center space-y-6 py-8">
                                                <CircularProgress progress={(submitProgress.current / (submitProgress.total || 1)) * 100} size={110} indeterminate={submitProgress.total === 0}>
                                                    <div className="flex flex-col items-center justify-center">
                                                        {submitProgress.total === 0 ? <span className="text-xl font-bold opacity-20">...</span> : (
                                                            <>
                                                                <span key={submitProgress.passed} className="text-3xl font-bold tabular-nums tracking-tight animate-pop">{submitProgress.passed}</span>
                                                                <span className="text-[9px] font-bold text-muted-foreground mt-0.5 opacity-60">PASSED</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </CircularProgress>
                                                <div className="flex flex-col items-center space-y-1.5">
                                                    {submitProgress.total === 0 ? <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground animate-pulse">Initializing...</div> : (
                                                        <>
                                                            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">Evaluating Test Cases</div>
                                                            <div className="text-[11px] font-mono font-medium text-muted-foreground/60">{submitProgress.current} / {submitProgress.total}</div>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        ) : isRunning ? (
                                            <div className="h-full flex flex-col items-center justify-center py-12 space-y-4 opacity-40"><Loader2 className="h-8 w-8 animate-spin text-primary" /><span className="font-semibold text-[11px] text-muted-foreground tracking-widest uppercase">Executing...</span></div>
                                        ) : (lastAction === 'run' || (lastAction === 'submit' && allResults.length > 0)) ? (
                                            <div className="space-y-8">
                                                {lastAction === 'submit' && verdict.status && (
                                                    <div className="space-y-6 animate-in fade-in duration-500">
                                                        <div className="flex items-center justify-between border-b pb-6 px-2">
                                                            <div className="space-y-2">
                                                                <div className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">Verdict</div>
                                                                <div className={cn("text-3xl font-bold tracking-tight", verdict.status === 'Accepted' ? "text-green-500" : "text-destructive")}>{verdict.status}</div>
                                                            </div>
                                                            <div className="text-right space-y-2">
                                                                <div className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">Efficiency</div>
                                                                <div className="text-2xl font-bold tabular-nums text-foreground/80">{verdict.passed} / {verdict.total}</div>
                                                            </div>
                                                        </div>
                                                        {verdict.failedCase && (
                                                            <div className="space-y-4 px-2">
                                                                <div className="flex items-center gap-2"><div className="h-4 w-1 bg-destructive rounded-full" /><span className="text-[11px] font-bold text-destructive/80">Failed at Case {verdict.failedCase.index}</span></div>
                                                                <div className="grid grid-cols-1 gap-3">
                                                                    <div className="bg-muted/40 p-3 rounded-lg border border-border/40 space-y-1.5"><span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">Input</span><pre className="text-foreground font-medium text-xs break-all whitespace-pre-wrap">{verdict.failedCase.input}</pre></div>
                                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                                        <div className="bg-destructive/5 p-3 rounded-lg border border-destructive/10 space-y-1.5"><span className="text-[9px] text-destructive font-bold uppercase tracking-wider">Your Output</span><pre className="text-destructive/80 font-bold text-xs break-all whitespace-pre-wrap">{verdict.failedCase.userOutput}</pre></div>
                                                                        <div className="bg-muted/20 p-3 rounded-lg border border-border/40 space-y-1.5"><span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider opacity-60">Expected</span><pre className="text-foreground font-bold text-xs break-all whitespace-pre-wrap">{verdict.failedCase.expectedOutput}</pre></div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                                {lastAction === 'run' && (
                                                    <div className="space-y-6">
                                                        {runResults.map((res, idx) => res && (
                                                            <div key={idx} className="space-y-3 bg-muted/20 p-4 rounded-xl border border-border/40 hover:bg-muted/30 transition-all">
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center gap-3"><div className={cn("h-6 w-1 rounded-full", res.passed ? "bg-green-500" : "bg-destructive/40")} /><span className="text-[11px] font-bold text-muted-foreground">Test Case {idx + 1}</span></div>
                                                                    <Badge variant={res.passed ? "secondary" : "destructive"} className={cn("text-[9px] font-bold px-2 rounded-md h-5", res.passed && "bg-green-500/10 text-green-600 border-none")}>{res.passed ? "PASSED" : "FAILED"}</Badge>
                                                                </div>
                                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-[11px]">
                                                                    <div className="space-y-1.5"><span className="text-[8px] text-muted-foreground font-bold uppercase tracking-wider">Input</span><pre className="text-foreground font-medium break-all whitespace-pre-wrap">{res.input}</pre></div>
                                                                    <div className="space-y-1.5 border-l border-border/30 pl-4"><span className="text-[8px] text-muted-foreground font-bold uppercase tracking-wider">Output</span><pre className={cn("font-bold break-all whitespace-pre-wrap", res.passed ? "text-foreground" : "text-destructive")}>{res.userOutput}</pre></div>
                                                                    <div className="space-y-1.5 border-l border-border/30 pl-4"><span className="text-[8px] text-muted-foreground font-bold uppercase tracking-wider opacity-60">Expected</span><pre className="text-foreground font-bold break-all whitespace-pre-wrap opacity-80">{res.expectedOutput}</pre></div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="h-full flex items-center justify-center text-muted-foreground text-[11px] font-medium tracking-widest uppercase opacity-30 italic"></div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </div >
    );
};

export default CodingWorkspace;
