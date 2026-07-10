import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Loader2 } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';

const INDUSTRIES = [
    "Technology", "Financial Services", "Healthcare", "Manufacturing",
    "Retail", "Media", "Education", "Energy", "Professional Services",
    "Telecommunications", "Transport"
];

const SPECIALIZATIONS = [
    "Software Development", "IT Services", "Cybersecurity", "Cloud Computing",
    "Artificial Intelligence", "Data Science", "Internet Technologies",
    "Robotics", "Quantum Computing", "Blockchain", "IoT"
];

const EXPERIENCE_LEVELS = [
    "Fresher", "1-2 years", "3-5 years", "5+ years"
];

const CompleteProfile = () => {
    const { user } = useUser();
    const api = useApi();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        industry: '',
        specialization: '',
        years_of_experience: '',
        skills: '',
        bio: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const profileData = {
                email: user.primaryEmailAddress?.emailAddress,
                full_name: user.fullName,
                industry: formData.industry,
                specialization: formData.specialization,
                years_of_experience: formData.years_of_experience,
                skills: formData.skills.split(',').map(s => s.trim()).filter(s => s),
                bio: formData.bio
            };

            await api.post('/user/profile', profileData);
            navigate('/market');
        } catch (error) {
            console.error("Failed to update profile", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container max-w-2xl py-20 animate-in fade-in">
            <div className="space-y-6 text-center mb-10">
                <h1 className="text-3xl font-bold tracking-tight">Complete Your Profile</h1>
                <p className="text-muted-foreground">
                    Select your industry to get personalized daily insights and recommendations.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8 bg-card p-8 rounded-xl border border-border shadow-sm">

                <div className="space-y-4">
                    <label className="text-sm font-medium">Industry</label>
                    <Select
                        value={formData.industry}
                        onValueChange={(val) => setFormData({ ...formData, industry: val })}
                        required
                    >
                        <SelectTrigger><SelectValue placeholder="Select Industry" /></SelectTrigger>
                        <SelectContent>
                            {INDUSTRIES.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-4">
                    <label className="text-sm font-medium">Specialization</label>
                    <Select
                        value={formData.specialization}
                        onValueChange={(val) => setFormData({ ...formData, specialization: val })}
                        required
                    >
                        <SelectTrigger><SelectValue placeholder="Select Specialization" /></SelectTrigger>
                        <SelectContent>
                            {SPECIALIZATIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-4">
                    <label className="text-sm font-medium">Years of Experience</label>
                    <Select
                        value={formData.years_of_experience}
                        onValueChange={(val) => setFormData({ ...formData, years_of_experience: val })}
                        required
                    >
                        <SelectTrigger><SelectValue placeholder="Select Experience" /></SelectTrigger>
                        <SelectContent>
                            {EXPERIENCE_LEVELS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-4">
                    <label className="text-sm font-medium">Skills (Comma separated)</label>
                    <Input
                        placeholder="React, Node.js, Python..."
                        value={formData.skills}
                        onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                        required
                    />
                </div>

                <div className="space-y-4">
                    <label className="text-sm font-medium">Professional Bio</label>
                    <Textarea
                        placeholder="Tell us a bit about yourself..."
                        value={formData.bio}
                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        rows={4}
                    />
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Save & Continue to Insights
                </Button>
            </form>
        </div>
    );
};

export default CompleteProfile;
