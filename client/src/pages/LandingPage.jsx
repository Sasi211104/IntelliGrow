import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { useUser } from '@clerk/clerk-react';
import { Bot, Code2, FileText, TrendingUp, ArrowRight, CheckCircle2 } from 'lucide-react';

const LandingPage = () => {
    const { isSignedIn } = useUser();

    return (
        <div className="flex flex-col min-h-screen w-full max-w-[100vw] overflow-x-hidden bg-background">
            {/* Hero Section */}
            <section className="relative overflow-hidden pt-16 md:pt-24 lg:pt-32 pb-16 md:pb-24 lg:pb-32 border-b">
                <div className="container px-4 md:px-6">
                    <div className="flex flex-col items-center space-y-6 text-center">
                        <div className="inline-flex items-center rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-bold uppercase tracking-widest text-foreground">
                            <span className="flex h-2 w-2 rounded-full bg-foreground mr-2"></span>
                            Pro Platform v1.0
                        </div>
                        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl text-foreground">
                            Master Your Path with <br className="hidden sm:inline" />
                            AI-Driven Preparation
                        </h1>
                        <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8 font-medium">
                            The professional standard for mock interviews, coding challenges, and career growth.
                            A focused environment built for serious candidates.
                        </p>
                        <div className="flex flex-wrap justify-center gap-4 pt-4">
                            <Link to={isSignedIn ? "/dashboard" : "/sign-in"}>
                                <Button size="lg" className="h-12 px-8 text-sm font-semibold uppercase tracking-wider transition-all hover:opacity-90 shadow-sm rounded-xl">
                                    Start Preparation <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                            <Link to="/about">
                                <Button variant="outline" size="lg" className="h-12 px-8 text-sm font-semibold uppercase tracking-wider border rounded-xl">
                                    Documentation
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="container py-12 md:py-24 lg:py-32 space-y-16 max-w-[100vw] overflow-hidden">
                <div className="text-center space-y-4 max-w-2xl mx-auto">
                    <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">Professional Suite</h2>
                    <p className="text-muted-foreground text-lg italic">
                        Comprehensive tools engineered for every stage of the professional interview process.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    <FeatureCard
                        icon={<Bot className="h-10 w-10 text-foreground" />}
                        title="AI Mock Interviews"
                        description="Intelligent interviewers that provide objective feedback on your performance and technical accuracy."
                    />
                    <FeatureCard
                        icon={<Code2 className="h-10 w-10 text-foreground" />}
                        title="Coding Workspace"
                        description="Professional grade environment for solving complex algorithm challenges with real-time evaluation."
                    />
                    <FeatureCard
                        icon={<FileText className="h-10 w-10 text-foreground" />}
                        title="Resume Optimization"
                        description="Data-driven generation of ATS-compatible documents tailored to industry-specific requirements."
                    />
                    <FeatureCard
                        icon={<TrendingUp className="h-10 w-10 text-foreground" />}
                        title="Market Analytics"
                        description="Strategic insights into industry trends, salary benchmarks, and demand for critical skills."
                    />
                </div>
            </section>

            {/* Benefits / Social Proof */}
            <section className="bg-muted/30 py-12 md:py-24 lg:py-32 border-y">
                <div className="container grid items-center gap-12 lg:grid-cols-2">
                    <div className="space-y-6">
                        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">The Standard for Success</h2>
                        <ul className="space-y-4 pt-4">
                            {[
                                "Objective AI-generated feedback loops",
                                "Isolated sandboxed coding environments",
                                "Enterprise-grade data security and privacy",
                                "Curated specialized problem datasets",
                                "High-performance dark/light workspaces"
                            ].map((item, i) => (
                                <li key={i} className="flex items-center gap-3">
                                    <CheckCircle2 className="h-5 w-5 text-foreground" />
                                    <span className="text-lg font-medium">{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="relative mx-auto w-full max-w-[500px] aspect-square">
                        <div className="flex h-full w-full flex-col items-center justify-center rounded-[2.5rem] bg-background border border-border shadow-xl p-8">
                            <div className="text-center space-y-6">
                                <div>
                                    <div className="text-5xl font-bold text-foreground tracking-tight">100+</div>
                                    <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mt-2">DSA Assessments</div>
                                </div>
                                <div className="h-px w-8 bg-border mx-auto opacity-50" />
                                <div>
                                    <div className="text-5xl font-bold text-foreground tracking-tight">500+</div>
                                    <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mt-2">Professional Sessions</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

// Helper Component for Features
const FeatureCard = ({ icon, title, description }) => {
    return (
        <div className="group relative overflow-hidden rounded-[2rem] border border-border bg-background p-8 text-foreground transition-all hover:bg-muted/10 hover:border-primary/20 shadow-sm">
            <div className="mb-6 rounded-2xl bg-muted w-fit p-4 border border-border/50 group-hover:bg-background transition-colors">
                {icon}
            </div>
            <h3 className="font-bold text-xl mb-3 tracking-tight">{title}</h3>
            <p className="text-muted-foreground leading-relaxed text-sm font-medium">
                {description}
            </p>
        </div>
    );
};

export default LandingPage;
