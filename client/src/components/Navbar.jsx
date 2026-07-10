import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useUser, UserButton, SignInButton } from '@clerk/clerk-react';
import { Button } from './ui/button';
import { ModeToggle } from './mode-toggle';
import { Menu, X, Rocket, LayoutDashboard, Code2, FileText, TrendingUp, BookOpen } from 'lucide-react';
import { cn } from '../lib/utils';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";

const Navbar = () => {
    const { isSignedIn } = useUser();
    const location = useLocation();
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navLinks = [
        { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/interview', label: 'Interview Prep', icon: BookOpen },
        { href: '/coding', label: 'Workspace', icon: Code2 },
        { href: '/resume', label: 'Resume', icon: FileText },
        { href: '/market', label: 'Insights', icon: TrendingUp },
    ];

    return (
        <header className={cn(
            "fixed top-0 w-full z-50 transition-all duration-300 border-b border-transparent",
            scrolled ? "bg-background/80 backdrop-blur-md border-border/50 shadow-sm" : "bg-transparent"
        )}>
            <div className="container flex h-16 items-center justify-between px-4 md:px-6">
                {/* Logo Area */}
                <div className="flex items-center gap-2">
                    <Link to="/" className="flex items-center gap-2 group">
                        <div className="p-2 rounded-xl bg-primary text-primary-foreground transition-all shadow-md group-hover:shadow-lg">
                            <Rocket className="h-5 w-5" />
                        </div>
                        <span className="font-bold text-xl tracking-tight text-foreground">
                            IntelliGrow
                        </span>
                    </Link>
                </div>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center gap-1">
                    {navLinks.map((link) => {
                        const Icon = link.icon;
                        const isActive = location.pathname === link.href;
                        return (
                            <Link
                                key={link.href}
                                to={link.href}
                                className={cn(
                                    "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 group",
                                    isActive
                                        ? "bg-primary text-primary-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                )}
                            >
                                <Icon className={cn("h-3.5 w-3.5", isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground")} />
                                {link.label}
                            </Link>
                        )
                    })}
                </nav>

                {/* Right Side Actions */}
                <div className="flex items-center gap-3">
                    <ModeToggle />

                    {isSignedIn ? (
                        <div className="flex items-center gap-2 pl-2 border-l border-border">
                            <UserButton
                                afterSignOutUrl="/"
                                appearance={{
                                    elements: {
                                        avatarBox: "h-9 w-9 ring-2 ring-primary/10 hover:ring-primary/30 transition-all rounded-xl"
                                    }
                                }}
                            />
                        </div>
                    ) : (
                        <SignInButton mode="modal">
                            <Button size="sm" className="hidden md:flex gap-2 font-bold uppercase tracking-wider text-[10px] rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-all shadow-md">
                                Log In
                            </Button>
                        </SignInButton>
                    )}

                    {/* Mobile Menu Trigger */}
                    <div className="md:hidden">
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="md:hidden">
                                    <Menu className="h-5 w-5" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="right" className="w-[300px] border-l border-border rounded-l-[2.5rem]">
                                <SheetHeader className="mb-8 text-left">
                                    <SheetTitle className="flex items-center gap-2">
                                        <div className="p-2 rounded-xl bg-primary text-primary-foreground">
                                            <Rocket className="h-5 w-5" />
                                        </div>
                                        <span className="font-bold tracking-tight">IntelliGrow</span>
                                    </SheetTitle>
                                </SheetHeader>
                                <div className="flex flex-col gap-2">
                                    {navLinks.map((link) => {
                                        const Icon = link.icon;
                                        const isActive = location.pathname === link.href;
                                        return (
                                            <Link
                                                key={link.href}
                                                to={link.href}
                                                className={cn(
                                                    "px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-3",
                                                    isActive
                                                        ? "bg-primary text-primary-foreground"
                                                        : "text-muted-foreground hover:bg-muted"
                                                )}
                                            >
                                                <Icon className="h-5 w-5" />
                                                {link.label}
                                            </Link>
                                        )
                                    })}
                                    {!isSignedIn && (
                                        <div className="pt-4 mt-4 border-t border-border">
                                            <SignInButton mode="modal">
                                                <Button className="w-full font-bold uppercase tracking-wider text-xs bg-primary text-primary-foreground hover:opacity-90 rounded-xl">Log In</Button>
                                            </SignInButton>
                                        </div>
                                    )}
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Navbar;
