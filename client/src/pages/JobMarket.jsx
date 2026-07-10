import React, { useEffect, useState } from 'react';
import { useApi } from '../hooks/useApi';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, Loader2, Briefcase, Zap, AlertCircle, BarChart3, Globe, Award } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, AreaChart, Area } from 'recharts';

const JobMarket = () => {
    const api = useApi();
    const navigate = useNavigate();
    const [insights, setInsights] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchInsights();
    }, []);

    const fetchInsights = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await api.get('/insights');
            setInsights(data);
        } catch (error) {
            console.error("Failed to load insights", error);
            if (error?.response?.status === 400 && error?.response?.data?.redirectTo) {
                navigate(error.response.data.redirectTo);
            } else {
                setError("Failed to load insights. Please try again later.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-[80vh] items-center justify-center animate-in fade-in">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <p className="text-sm font-medium text-muted-foreground animate-pulse">Analyzing Market Trends...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
                <AlertCircle className="h-10 w-10 text-destructive" />
                <p className="text-lg font-medium text-destructive">{error}</p>
                <Button onClick={fetchInsights} variant="outline">Retry Analysis</Button>
            </div>
        );
    }

    if (!insights) return null;

    // Prepare data for charts
    const salaryData = insights.salary_ranges?.map(role => ({
        name: role.role.split(' ')[0], // Short name for X-axis
        min: role.min / 1000,
        median: role.median / 1000,
        max: role.max / 1000,
        fullRole: role.role
    })) || [];

    const demandColor = insights.market_overview?.demand_level === 'High' ? 'text-emerald-500' :
        insights.market_overview?.demand_level === 'Medium' ? 'text-yellow-500' : 'text-red-500';

    return (
        <div className="container max-w-7xl py-12 space-y-8 animate-in fade-in transition-all duration-500 pt-20">

            {/* Header Section */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 border-b border-border/40 pb-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest">
                        <Globe className="h-4 w-4" /> Global Intelligence
                    </div>
                    <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">Market Insights</h1>
                    <p className="text-muted-foreground text-lg max-w-2xl">
                        Real-time analytics and personalized benchmarks for your industry specialization.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex flex-col items-end mr-4 hidden sm:flex">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Last Updated</span>
                        <span className="font-mono text-xs">{new Date().toLocaleDateString()}</span>
                    </div>
                    <Button onClick={fetchInsights} size="lg" className="shadow-lg hover:shadow-primary/20 transition-all">
                        <Zap className="h-4 w-4 mr-2" /> Refresh Data
                    </Button>
                </div>
            </div>

            {/* Overview Grid */}
            {insights.market_overview && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Outlook Card */}
                    <Card className="bg-card/50 backdrop-blur-sm border-border/60 hover:border-primary/50 transition-colors">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Market Outlook</CardTitle>
                            <BarChart3 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{insights.market_overview.outlook}</div>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {insights.market_overview.summary}
                            </p>
                        </CardContent>
                    </Card>

                    {/* Growth Rate Card */}
                    <Card className="bg-card/50 backdrop-blur-sm border-border/60 hover:border-primary/50 transition-colors">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Growth Rate</CardTitle>
                            <TrendingUp className="h-4 w-4 text-emerald-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-emerald-500 flex items-baseline gap-2">
                                {insights.market_overview.growth_rate}
                                <span className="text-xs text-muted-foreground font-normal text-foreground">YoY</span>
                            </div>
                            <Progress value={parseInt(insights.market_overview.growth_rate) || 50} className="h-1 mt-3" indicatorClassName="bg-emerald-500" />
                        </CardContent>
                    </Card>

                    {/* Demand Level Card */}
                    <Card className="bg-card/50 backdrop-blur-sm border-border/60 hover:border-primary/50 transition-colors">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Demand Level</CardTitle>
                            <Award className={`h-4 w-4 ${demandColor}`} />
                        </CardHeader>
                        <CardContent>
                            <div className={`text-2xl font-bold ${demandColor}`}>{insights.market_overview.demand_level}</div>
                            <div className="flex gap-1 mt-3">
                                {['Low', 'Medium', 'High'].map((level, i) => (
                                    <div key={level} className={`h-1.5 flex-1 rounded-full ${(level === 'Low' && ['Low', 'Medium', 'High'].includes(insights.market_overview.demand_level)) ||
                                            (level === 'Medium' && ['Medium', 'High'].includes(insights.market_overview.demand_level)) ||
                                            (level === 'High' && ['High'].includes(insights.market_overview.demand_level))
                                            ? (demandColor.replace('text-', 'bg-'))
                                            : 'bg-muted'
                                        }`} />
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Salary Chart & Trends */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Salary Chart Section */}
                    <Card className="border-border/60 shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <DollarSign className="h-5 w-5 text-primary" />
                                Salary Benchmarks (Annual USD)
                            </CardTitle>
                            <CardDescription>Comparison of Minimum, Median, and Maximum salaries by role.</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[400px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={salaryData} barSize={20} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.4} />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                                        tickFormatter={(value) => `$${value}k`}
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'hsl(var(--muted))', opacity: 0.2 }}
                                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                                        formatter={(value) => [`$${value},000`, '']}
                                        labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 'bold' }}
                                    />
                                    <Bar dataKey="min" stackId="a" fill="hsl(var(--primary))" opacity={0.3} radius={[0, 0, 4, 4]} />
                                    <Bar dataKey="median" stackId="a" fill="hsl(var(--primary))" opacity={0.7} />
                                    <Bar dataKey="max" stackId="a" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Key Trends Grid */}
                    {insights.key_trends && (
                        <div className="space-y-4">
                            <h3 className="text-xl font-bold tracking-tight flex items-center gap-2">
                                <TrendingUp className="h-5 w-5 text-primary" /> Industry Trends
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {insights.key_trends.map((trend, i) => (
                                    <div key={i} className="flex items-start gap-4 p-5 bg-card border border-border/50 rounded-xl hover:bg-muted/30 transition-all hover:scale-[1.01]">
                                        <div className="p-2 bg-primary/10 rounded-full shrink-0">
                                            <TrendingUp className="h-4 w-4 text-primary" />
                                        </div>
                                        <div>
                                            <p className="font-medium leading-relaxed text-sm md:text-base">{trend}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: Skills & Roles */}
                <div className="space-y-6">
                    {/* Top Skills Cloud */}
                    <Card className="border-border/60">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Award className="h-4 w-4 text-primary" /> Top Trending Skills
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-wrap gap-2">
                            {insights.top_skills?.map((skill, i) => (
                                <Badge key={i} variant="secondary" className="px-3 py-1.5 text-sm font-medium hover:bg-primary hover:text-primary-foreground transition-colors cursor-default">
                                    {skill}
                                </Badge>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Recommended Skills */}
                    <Card className="border-primary/20 bg-primary/5">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg text-primary">
                                <Zap className="h-4 w-4" /> Recommended for You
                            </CardTitle>
                            <CardDescription className="text-xs">Based on your experience gap analysis.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {insights.recommended_skills?.map((skill, i) => (
                                <div key={i} className="flex items-center justify-between p-2 bg-background/50 rounded-lg border border-border/50">
                                    <span className="text-sm font-medium">{skill}</span>
                                    <Badge variant="outline" className="text-[10px] h-5">High Impact</Badge>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default JobMarket;
