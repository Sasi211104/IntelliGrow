import React, { useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useApi } from '../hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Link } from 'react-router-dom';
import { Activity, Code, FileText, TrendingUp, Loader2, ArrowRight, Zap, Trophy, Target } from 'lucide-react';
import { cn } from '../lib/utils';

const Dashboard = () => {
    const { user } = useUser();
    const api = useApi();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const data = await api.get('/interview/history');
                setHistory(data);
            } catch (error) {
                console.error("Failed to load history", error);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

    return (
        <div className="container py-8 space-y-12 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="relative overflow-hidden rounded-2xl bg-foreground p-10 border border-border shadow-xl">
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="space-y-3">
                        <div className="inline-block px-3 py-1 bg-background text-foreground text-[10px] font-bold uppercase tracking-wider rounded-md mb-2">
                            Active Session
                        </div>
                        <h1 className="text-4xl font-bold tracking-tight text-background leading-none">
                            Welcome back, {user?.firstName}
                        </h1>
                        <p className="text-background/70 text-lg font-medium max-w-md">
                            Your professional development performance metrics and daily assessment modules are ready.
                        </p>
                    </div>
                    <Link to="/interview">
                        <Button size="lg" className="gap-2 bg-background text-foreground hover:bg-background/90 font-bold uppercase tracking-wider text-xs h-12 px-8 rounded-md shadow-md transition-all hover:opacity-90">
                            Launch Challenge <ArrowRight className="h-4 w-4" />
                        </Button>
                    </Link>
                </div>
                {/* Minimal background elements */}
                <div className="absolute top-1/2 right-10 -translate-y-1/2 opacity-5 pointer-events-none">
                    <Activity className="h-64 w-64" />
                </div>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <DashboardCard
                    to="/interview"
                    icon={<Activity className="h-6 w-6" />}
                    title="Interview Prep"
                    subtitle="Assessment Quiz"
                />
                <DashboardCard
                    to="/coding"
                    icon={<Code className="h-6 w-6" />}
                    title="Coding Labs"
                    subtitle="Algorithm Practice"
                />
                <DashboardCard
                    to="/resume"
                    icon={<FileText className="h-6 w-6" />}
                    title="Documentation"
                    subtitle="Resume Optimization"
                />
                <DashboardCard
                    to="/market"
                    icon={<TrendingUp className="h-6 w-6" />}
                    title="Market Analytics"
                    subtitle="Industry Benchmarks"
                />
            </div>

            {/* Recent Activity Section */}
            <div className="grid gap-6">
                <Card className="border-border shadow-xl rounded-2xl overflow-hidden">
                    <CardHeader className="bg-muted/30 border-b p-6">
                        <CardTitle className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-foreground">
                            <Trophy className="h-4 w-4" /> Performance History
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="flex h-[300px] items-center justify-center">
                                <Loader2 className="h-8 w-8 animate-spin text-foreground" />
                            </div>
                        ) : history.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                                <div className="p-5 rounded-2xl bg-muted border border-border">
                                    <Activity className="h-8 w-8 text-foreground/20" />
                                </div>
                                <div className="space-y-1">
                                    <p className="font-bold uppercase tracking-widest text-sm">No diagnostic data</p>
                                    <p className="text-sm text-muted-foreground italic">Complete an evaluation to initialize history tracking.</p>
                                </div>
                                <Link to="/interview" className="pt-4">
                                    <Button variant="outline" size="sm" className="font-bold border border-border rounded-xl uppercase tracking-tighter text-xs">Begin Evaluation</Button>
                                </Link>
                            </div>
                        ) : (
                            <div className="divide-y divide-border">
                                {history.map((attempt) => (
                                    <div key={attempt.id} className="flex items-center justify-between p-6 hover:bg-muted/20 transition-all group">
                                        <div className="flex items-center gap-6">
                                            <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-foreground text-background font-bold text-sm tracking-tight shadow-md">
                                                {attempt.topic.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div className="space-y-1">
                                                <p className="font-bold text-lg tracking-tight group-hover:underline">{attempt.topic}</p>
                                                <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                                    <Badge variant="outline" className="px-2 py-0.5 rounded-full bg-muted text-foreground border border-border">
                                                        {attempt.difficulty}
                                                    </Badge>
                                                    <span>•</span>
                                                    <span>{new Date(attempt.created_at).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right flex items-center gap-6">
                                            <div className="space-y-0.5">
                                                <div className="text-2xl font-bold text-foreground tabular-nums">
                                                    {attempt.score} <span className="text-muted-foreground text-sm font-normal">/ {attempt.total_questions}</span>
                                                </div>
                                                <div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Verification Score</div>
                                            </div>
                                            <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

// Helper Component for Dashboard Activity Cards
const DashboardCard = ({ to, icon, title, subtitle }) => {
    return (
        <Link to={to} className="group cursor-pointer">
            <Card className="h-full transition-all duration-300 border-border hover:border-primary/20 hover:bg-muted/5 rounded-xl shadow-sm hover:shadow-xl overflow-hidden">
                <CardContent className="p-8 flex flex-col items-center text-center space-y-6">
                    <div className="p-5 rounded-xl bg-muted text-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-all border border-border">
                        {icon}
                    </div>
                    <div className="space-y-2">
                        <h3 className="font-bold text-lg tracking-tight group-hover:text-primary transition-colors">{title}</h3>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{subtitle}</p>
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
};

export default Dashboard;
