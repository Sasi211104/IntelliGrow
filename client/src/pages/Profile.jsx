import React, { useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useApi } from '../hooks/useApi';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const Profile = () => {
    const { user, isLoaded } = useUser();
    const api = useApi();
    const [profile, setProfile] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        role_interest: '',
        experience_level: 'student',
        skills: '',
    });

    useEffect(() => {
        if (isLoaded && user) {
            fetchProfile();
        }
    }, [isLoaded, user]);

    const fetchProfile = async () => {
        try {
            const data = await api.get('/user/profile');
            setProfile(data);
            setFormData({
                role_interest: data.role_interest || '',
                experience_level: data.experience_level || 'student',
                skills: Array.isArray(data.skills) ? data.skills.join(', ') : '',
            });
        } catch (error) {
            console.log("Profile not found, user needs to create one.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            // Parse skills string to array
            const skillsArray = formData.skills.split(',').map(s => s.trim()).filter(s => s.length > 0);

            const payload = {
                email: user.primaryEmailAddress.emailAddress,
                full_name: user.fullName,
                role_interest: formData.role_interest,
                experience_level: formData.experience_level,
                skills: skillsArray
            };

            const updatedProfile = await api.post('/user/profile', payload);
            setProfile(updatedProfile);
            toast.success("Profile saved successfully!");
        } catch (error) {
            console.error(error);
            toast.error("Failed to save profile.");
        } finally {
            setIsSaving(false);
        }
    };

    if (!isLoaded || isLoading) {
        return <div className="flex h-[50vh] items-center justify-center animate-in fade-in"><Loader2 className="h-12 w-12 animate-spin text-foreground" /></div>;
    }

    return (
        <div className="container max-w-3xl mx-auto py-12 px-4 md:py-20 pt-28 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Card className="border border-border rounded-2xl shadow-xl overflow-hidden">
                <CardHeader className="space-y-4 p-10 bg-muted/20 border-b border-border">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Identity Management</div>
                    <CardTitle className="text-4xl font-bold tracking-tight leading-none">User Profile</CardTitle>
                    <CardDescription className="text-sm font-medium tracking-wide text-muted-foreground pt-2">Configure your professional parameters for tailored intelligence.</CardDescription>
                </CardHeader>
                <CardContent className="p-10 space-y-12">
                    <form onSubmit={handleSubmit} className="space-y-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-foreground/60">Verified Full Name</label>
                                <input
                                    className="flex h-12 w-full rounded-xl border border-border bg-muted/30 px-5 py-2 text-sm font-semibold tracking-wide opacity-70 cursor-not-allowed"
                                    value={user?.fullName || ''}
                                    disabled
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-foreground/60">Registered Email Address</label>
                                <input
                                    className="flex h-12 w-full rounded-xl border border-border bg-muted/30 px-5 py-2 text-sm font-semibold tracking-wide opacity-70 cursor-not-allowed"
                                    value={user?.primaryEmailAddress?.emailAddress || ''}
                                    disabled
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-foreground/60">Target Career Domain</label>
                            <input
                                className="flex h-12 w-full rounded-xl border border-input bg-background px-5 py-2 text-sm font-semibold placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/20 transition-all font-medium"
                                placeholder="e.g. Senior Systems Architect"
                                value={formData.role_interest}
                                onChange={(e) => setFormData({ ...formData, role_interest: e.target.value })}
                                required
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-foreground/60">Experience Threshold</label>
                            <div className="relative">
                                <select
                                    className="flex h-12 w-full rounded-xl border border-input bg-background px-5 py-2 text-sm font-semibold tracking-wide focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/20 transition-all appearance-none cursor-pointer"
                                    value={formData.experience_level}
                                    onChange={(e) => setFormData({ ...formData, experience_level: e.target.value })}
                                >
                                    <option value="student">Student / Intern</option>
                                    <option value="entry">Entry Level</option>
                                    <option value="mid">Associate / Mid-Level</option>
                                    <option value="senior">Senior / Lead</option>
                                </select>
                                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">
                                    <div className="border-t-4 border-x-4 border-x-transparent border-t-foreground/40 h-0 w-0" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-foreground/60">Core Competencies (Comma Separated)</label>
                            <textarea
                                className="flex min-h-[160px] w-full rounded-xl border border-input bg-background px-5 py-4 text-sm font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/20 transition-all resize-none leading-relaxed"
                                placeholder="React, TypeScript, Kubernetes, AWS..."
                                value={formData.skills}
                                onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                            />
                        </div>

                        <div className="pt-6">
                            <Button type="submit" size="lg" className="w-full md:w-auto h-12 px-12 bg-primary text-primary-foreground hover:opacity-90 font-bold uppercase tracking-widest text-xs rounded-xl shadow-lg transition-all active:scale-95" disabled={isSaving}>
                                {isSaving && <Loader2 className="mr-3 h-5 w-5 animate-spin" />}
                                Finalize Profile
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default Profile;

