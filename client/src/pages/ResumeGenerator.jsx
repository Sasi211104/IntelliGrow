import React, { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { useUser } from '@clerk/clerk-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../components/ui/card';
import { Loader2, FileText, Printer, FileType, Sparkles, PenTool, History, Check, XCircle, ChevronLeft, ChevronRight, ChevronDown, Trash2, Wand2 } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

const LOCATION_DATA = {
    "India": ["Andhra Pradesh", "Telangana", "Karnataka", "Tamil Nadu", "Maharashtra", "Delhi", "Uttar Pradesh", "West Bengal", "Kerala", "Gujarat", "Rajasthan", "Punjab", "Haryana", "Madhya Pradesh", "Bihar", "Odisha", "Other"],
    "United States": ["California", "New York", "Texas", "Florida", "Illinois", "Washington", "Georgia", "New Jersey", "Virginia", "Massachusetts", "Ohio", "Michigan", "Other"],
    "United Kingdom": ["Greater London", "South East", "North West", "West Midlands", "South West", "Scotland", "Wales", "Northern Ireland", "Other"],
    "Canada": ["Ontario", "Quebec", "British Columbia", "Alberta", "Manitoba", "Nova Scotia", "Other"],
    "Australia": ["New South Wales", "Victoria", "Queensland", "Western Australia", "South Australia", "Other"],
    "Germany": ["Bavaria", "Berlin", "Hamburg", "Hesse", "Saxony", "Other"],
    "Other": ["Other State/Province"]
};
const COUNTRIES = Object.keys(LOCATION_DATA);

const RESUME_STYLES = `
    @import url('https://fonts.googleapis.com/css2?family=Spectral:wght@400;500;700&display=swap');
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    
    .resume-render-root { 
        font-family: 'Spectral', serif; 
        line-height: 1.4; 
        text-align: justify; 
        color: #000; 
        background: #fff;
        font-size: 10.5pt;
        padding: 0.5in;
    }

    .resume-render-root .header { text-align: center; border-bottom: none; padding-bottom: 2px; margin-bottom: 10px; }
    .resume-render-root .full-name { font-size: 24pt; font-weight: 700; text-transform: uppercase; margin-bottom: 2px; letter-spacing: 0.05em; color: #000; }
    .resume-render-root .contact-info { font-family: 'Inter', sans-serif; font-size: 8.5pt; display: flex; justify-content: center; gap: 10px; color: #444; font-weight: 500; margin-bottom: 1px; }
    .resume-render-root .contact-info svg { height: 9px; width: 9px; margin-right: 3px; vertical-align: middle; }
    .resume-render-root .section-title { font-family: 'Inter', sans-serif; font-size: 11pt; font-weight: 700; text-transform: uppercase; color: #000; border-bottom: 1px solid #000; margin-top: 10px; margin-bottom: 5px; padding-bottom: 2px; display: flex; align-items: center; }
    .resume-render-root .entry { margin-bottom: 6px; }
    .resume-render-root .entry-header, .resume-render-root .tech-stack-row { display: flex; justify-content: space-between; align-items: baseline; }
    .resume-render-root .company, .resume-render-root .school { font-weight: 700; font-size: 10.5pt; }
    .resume-render-root .location { font-style: normal; font-size: 9.5pt; }
    .resume-render-root .role, .resume-render-root .degree, .resume-render-root .tech-stack { font-style: normal; font-weight: 600; font-size: 9.5pt; }
    .resume-render-root .date { font-family: 'Inter', sans-serif; font-size: 9pt; font-weight: 700; }
    .resume-render-root ul { 
        margin: 2px 0 0 0; 
        padding-left: 20px !important; 
        list-style-type: disc !important;
    }
    .resume-render-root li { 
        display: list-item !important;
        margin-bottom: 1px; 
    }
    .resume-render-root .skills-section { display: flex; flex-direction: column; gap: 2px; }
    .resume-render-root .skill-group { margin-bottom: 0px; line-height: 1.2; text-align: justify; }
    .resume-render-root .skill-label { font-weight: 700; margin-right: 2px; }
    .resume-render-root a { color: #000; text-decoration: none; transition: all 0.2s; }
    .resume-render-root a:hover { text-decoration: underline; color: #2563eb; }
    .resume-render-root .entry-links { display: flex; gap: 6px; font-size: 9pt; font-weight: 500; }
    .resume-render-root .entry-links a { font-weight: 700; color: #2563eb; text-decoration: none; border-bottom: 1px solid transparent; }
    .resume-render-root .entry-links a:hover { border-bottom: 1px solid #2563eb; }
    
    @media print {
        body { padding: 0 !important; margin: 0 !important; }
        .resume-render-root { padding: 0 !important; }
    }
`;

const CustomSelect = ({ value, onChange, options, placeholder }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = React.useRef(null);

    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative w-full" ref={containerRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "w-full h-10 text-sm bg-background border rounded-lg px-4 flex items-center justify-between transition-all",
                    isOpen ? "border-primary ring-4 ring-primary/5 shadow-sm" : "hover:border-primary/50"
                )}
            >
                <span className={cn(!value && "text-muted-foreground/50")}>
                    {value || placeholder}
                </span>
                <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform duration-200", isOpen && "rotate-180")} />
            </button>

            {isOpen && (
                <div className="absolute z-[100] w-full mt-1.5 bg-background border border-border rounded-xl shadow-2xl py-1.5 animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-200 max-h-[160px] overflow-y-auto custom-scrollbar">
                    {options.map((option) => (
                        <button
                            key={option}
                            type="button"
                            onClick={() => {
                                onChange(option);
                                setIsOpen(false);
                            }}
                            className={cn(
                                "w-full text-left px-4 py-2 text-sm transition-colors hover:bg-primary/5",
                                value === option ? "bg-primary/10 text-primary font-bold" : "text-foreground/80"
                            )}
                        >
                            {option}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

const ResumeGenerator = () => {
    const api = useApi();
    const { user } = useUser();
    const [isGenerating, setIsGenerating] = useState(false);
    const [activeTab, setActiveTab] = useState('resume');
    const [viewMode, setViewMode] = useState('edit'); // 'edit' | 'preview'
    const [wizardStep, setWizardStep] = useState(0);
    const [resumeData, setResumeData] = useState({
        personal: { fullName: user?.fullName || '', email: user?.primaryEmailAddress?.emailAddress || '', phone: '', linkedin: '', github: '', portfolio: '', address: '', state: '', country: '' },
        summary: '',
        education: [{ school: '', degree: '', year: '', gradeType: 'CGPA', gpa: '' }],
        experience: [{ company: '', role: '', duration: '', details: '' }],
        projects: [{ name: '', tech: '', details: '', projectLink: '', liveDemo: '' }],
        skills: '',
        achievements: [''],
        targetJob: ''
    });

    const [versions, setVersions] = useState([]);
    const [selectedVersionIndex, setSelectedVersionIndex] = useState(-1);

    const updateField = (section, index, field, value) => {
        if (section === 'personal' || section === 'targetJob' || section === 'skills' || section === 'summary') {
            if (section === 'targetJob') {
                setResumeData({ ...resumeData, targetJob: value });
            } else if (section === 'skills') {
                setResumeData({ ...resumeData, skills: value });
            } else if (section === 'summary') {
                setResumeData({ ...resumeData, summary: value });
            } else {
                setResumeData({ ...resumeData, [section]: { ...resumeData[section], [field]: value } });
            }
        } else if (section === 'achievements') {
            const newSection = [...resumeData[section]];
            newSection[index] = value;
            setResumeData({ ...resumeData, [section]: newSection });
        } else {
            const newSection = [...resumeData[section]];
            newSection[index][field] = value;
            setResumeData({ ...resumeData, [section]: newSection });
        }
    };

    const addEntry = (section) => {
        const templates = {
            education: { school: '', degree: '', year: '', gpa: '' },
            experience: { company: '', role: '', duration: '', details: '' },
            projects: { name: '', tech: '', details: '' },
            achievements: ''
        };
        setResumeData({ ...resumeData, [section]: [...resumeData[section], templates[section]] });
    };

    const removeEntry = (section, index) => {
        const newSection = [...resumeData[section]];
        newSection.splice(index, 1);
        setResumeData({ ...resumeData, [section]: newSection });
    };

    const handleGenerate = async (type) => {
        setIsGenerating(true);
        setActiveTab(type);

        try {
            let endpoint = type === 'resume' ? '/generator/resume' : '/generator/cover-letter';
            let payload = type === 'resume'
                ? { ...resumeData, jobDescription: resumeData.targetJob }
                : { resumeContext: resumeData, jobDescription: resumeData.targetJob };

            const data = await api.post(endpoint, payload);

            const newVersion = {
                id: Date.now(),
                type: type,
                content: data.content,
                timestamp: new Date().toLocaleTimeString(),
                date: new Date().toLocaleDateString()
            };

            const updatedVersions = [newVersion, ...versions];
            setVersions(updatedVersions);
            setSelectedVersionIndex(0);
            setViewMode('preview');
            toast.success(`${type === 'resume' ? 'Resume' : 'Cover Letter'} generated!`);
        } catch (error) {
            console.error(error);
            toast.error(`Failed to generate ${type}.`);
        } finally {
            setIsGenerating(false);
        }
    };

    const handlePrint = () => {
        if (selectedVersionIndex === -1) return;
        const content = versions[selectedVersionIndex].content;
        const printWindow = window.open('', '', 'height=800,width=1000');
        printWindow.document.write('<html><head><title>Print Document</title>');
        printWindow.document.write(`<style>${RESUME_STYLES}</style>`);
        printWindow.document.write('</head><body class="resume-render-root">');
        printWindow.document.write(content);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        setTimeout(() => printWindow.print(), 500);
    };

    const currentDoc = selectedVersionIndex !== -1 ? versions[selectedVersionIndex] : null;

    return (
        <div className="container py-4 max-w-[1600px] h-[calc(100vh-5rem)] flex flex-col animate-in fade-in overflow-hidden">
            {viewMode === 'edit' && (
                <div className="w-full max-w-[1550px] mx-auto flex flex-col h-full">
                    <div className="border-b border-border pb-4 mb-4 flex items-end justify-between px-2 flex-shrink-0">
                        <h2 className="text-3xl font-bold tracking-tight">Resume Builder</h2>
                        {versions.length > 0 && (
                            <Button variant="outline" onClick={() => setViewMode('preview')} className="text-xs uppercase font-bold text-muted-foreground hover:text-foreground">
                                View Last Generated <History className="ml-2 h-4 w-4" />
                            </Button>
                        )}
                    </div>

                    <Card className="border border-border rounded-xl shadow-lg bg-background/50 backdrop-blur-sm flex-1 flex flex-col min-h-0">
                        <CardHeader className="py-5 px-12 bg-muted/20 border-b border-border flex-shrink-0">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] text-foreground/80 flex items-center gap-3">
                                    <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                        <PenTool className="h-3.5 w-3.5" />
                                    </div>
                                    {wizardStep === 0 && "Step 1: Personal Identity"}
                                    {wizardStep === 1 && "Step 2: Academic History"}
                                    {wizardStep === 2 && "Step 3: Professional Experience"}
                                    {wizardStep === 3 && "Step 4: Technical Projects"}
                                    {wizardStep === 4 && "Step 5: Expertise & Career Focus"}
                                    {wizardStep === 5 && "Step 6: Key Achievements"}
                                </CardTitle>
                                <div className="flex items-center gap-4">
                                    <div className="flex gap-1">
                                        {[0, 1, 2, 3, 4, 5].map(s => (
                                            <div key={s} className={cn("h-1.5 w-6 rounded-full transition-all", wizardStep >= s ? "bg-primary" : "bg-muted-foreground/20")} />
                                        ))}
                                    </div>
                                    <span className="text-[10px] font-mono text-muted-foreground font-bold">{wizardStep + 1} / 6</span>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="px-12 py-6 space-y-6 flex-1 overflow-y-auto custom-scrollbar min-h-0">
                            {wizardStep === 0 && (
                                <div className="grid grid-cols-12 gap-y-4 gap-x-10 animate-in slide-in-from-right-4 duration-300">
                                    <div className="col-span-12 md:col-span-6 space-y-1.5"><label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Full Name</label><input className="w-full h-10 text-sm bg-background border rounded-lg px-4 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all" value={resumeData.personal.fullName} onChange={(e) => updateField('personal', 0, 'fullName', e.target.value)} /></div>
                                    <div className="col-span-12 md:col-span-6 space-y-1.5"><label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Phone Number</label><input className="w-full h-10 text-sm bg-background border rounded-lg px-4 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all" placeholder="+1 (555) 000-0000" value={resumeData.personal.phone} onChange={(e) => updateField('personal', 0, 'phone', e.target.value)} /></div>
                                    <div className="col-span-12 md:col-span-6 space-y-1.5"><label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Country</label><CustomSelect value={resumeData.personal.country} onChange={(val) => setResumeData({ ...resumeData, personal: { ...resumeData.personal, country: val, state: '' } })} options={COUNTRIES} placeholder="Select Country" /></div>
                                    <div className="col-span-12 md:col-span-6 space-y-1.5"><label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">State</label><CustomSelect value={resumeData.personal.state} onChange={(val) => updateField('personal', 0, 'state', val)} options={LOCATION_DATA[resumeData.personal.country] || LOCATION_DATA["Other"]} placeholder="Select State" /></div>
                                    <div className="col-span-12 space-y-1.5"><label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">District / City</label><input className="w-full h-10 text-sm bg-background border rounded-lg px-4 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all" placeholder="e.g. Nellore" value={resumeData.personal.address} onChange={(e) => updateField('personal', 0, 'address', e.target.value)} /></div>
                                    <div className="col-span-12 md:col-span-4 space-y-1.5"><label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">LinkedIn URL</label><input className="w-full h-10 text-sm bg-background border rounded-lg px-4 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all" placeholder="linkedin.com/in/..." value={resumeData.personal.linkedin} onChange={(e) => updateField('personal', 0, 'linkedin', e.target.value)} /></div>
                                    <div className="col-span-12 md:col-span-4 space-y-1.5"><label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">GitHub URL</label><input className="w-full h-10 text-sm bg-background border rounded-lg px-4 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all" placeholder="github.com/username" value={resumeData.personal.github} onChange={(e) => updateField('personal', 0, 'github', e.target.value)} /></div>
                                    <div className="col-span-12 md:col-span-4 space-y-1.5"><label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Portfolio URL</label><input className="w-full h-10 text-sm bg-background border rounded-lg px-4 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all" placeholder="yourportfolio.link" value={resumeData.personal.portfolio} onChange={(e) => updateField('personal', 0, 'portfolio', e.target.value)} /></div>
                                </div>
                            )}

                            {wizardStep === 1 && (
                                <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                                    {resumeData.education.map((edu, idx) => (
                                        <div key={idx} className="space-y-4 p-6 border rounded-xl bg-muted/5 relative group hover:border-primary/20 transition-all">
                                            <button onClick={() => removeEntry('education', idx)} className="absolute top-4 right-4 text-muted-foreground/40 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-2 hover:bg-red-50 rounded-lg"><Trash2 className="h-4 w-4" /></button>
                                            <div className="grid grid-cols-12 gap-x-8 gap-y-4">
                                                <div className="col-span-12 md:col-span-9 space-y-1.5"><label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">University</label><input className="w-full h-10 text-sm font-medium bg-background border rounded-lg px-4" placeholder="University Name" value={edu.school} onChange={(e) => updateField('education', idx, 'school', e.target.value)} /></div>
                                                <div className="col-span-12 md:col-span-3 space-y-1.5"><label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Year</label><input className="w-full h-10 text-sm font-medium bg-background border rounded-lg px-4" placeholder="2024" value={edu.year} onChange={(e) => updateField('education', idx, 'year', e.target.value)} /></div>
                                                <div className="col-span-12 md:col-span-8 space-y-1.5"><label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Degree</label><input className="w-full h-10 text-sm font-medium bg-background border rounded-lg px-4" placeholder="B.S. Computer Science" value={edu.degree} onChange={(e) => updateField('education', idx, 'degree', e.target.value)} /></div>
                                                <div className="col-span-12 md:col-span-4 space-y-1.5">
                                                    <div className="flex items-center justify-between px-1"><label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{edu.gradeType || 'CGPA'}</label><div className="flex bg-muted rounded-md p-1 scale-95 origin-right"><button onClick={() => updateField('education', idx, 'gradeType', 'CGPA')} className={cn("px-2 py-0.5 text-[8px] font-bold rounded", (edu.gradeType === 'CGPA' || !edu.gradeType) ? "bg-background text-primary" : "text-muted-foreground")}>CGPA</button><button onClick={() => updateField('education', idx, 'gradeType', 'Percentage')} className={cn("px-2 py-0.5 text-[8px] font-bold rounded", edu.gradeType === 'Percentage' ? "bg-background text-primary" : "text-muted-foreground")}>%</button></div></div>
                                                    <input className="w-full h-10 text-sm font-medium bg-background border rounded-lg px-4" placeholder={edu.gradeType === 'Percentage' ? "95%" : "9.5"} value={edu.gpa} onChange={(e) => updateField('education', idx, 'gpa', e.target.value)} />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    <Button variant="outline" onClick={() => addEntry('education')} className="w-full h-10 border bg-muted/20 text-[10px] uppercase font-bold tracking-widest text-muted-foreground rounded-xl">+ Add Education</Button>
                                </div>
                            )}

                            {wizardStep === 2 && (
                                <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                                    {resumeData.experience.map((exp, idx) => (
                                        <div key={idx} className="space-y-4 p-6 border rounded-xl bg-muted/5 relative group hover:border-primary/20 transition-all">
                                            <button onClick={() => removeEntry('experience', idx)} className="absolute top-4 right-4 text-muted-foreground/40 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-2 hover:bg-red-50 rounded-lg"><Trash2 className="h-4 w-4" /></button>
                                            <div className="grid grid-cols-12 gap-x-8 gap-y-4">
                                                <div className="col-span-12 md:col-span-8 space-y-2"><label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Company</label><input className="w-full h-10 text-sm font-medium bg-background border rounded-lg px-4" placeholder="Tech Corp" value={exp.company} onChange={(e) => updateField('experience', idx, 'company', e.target.value)} /></div>
                                                <div className="col-span-12 md:col-span-4 space-y-2"><label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Duration</label><input className="w-full h-10 text-sm font-medium bg-background border rounded-lg px-4" placeholder="Jan 2023 - Present" value={exp.duration} onChange={(e) => updateField('experience', idx, 'duration', e.target.value)} /></div>
                                                <div className="col-span-12 space-y-2"><label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Role</label><input className="w-full h-10 text-sm font-medium bg-background border rounded-lg px-4" placeholder="Software Engineer" value={exp.role} onChange={(e) => updateField('experience', idx, 'role', e.target.value)} /></div>
                                                <div className="col-span-12 space-y-2"><label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Details</label><textarea className="w-full text-sm font-medium bg-background border rounded-lg px-4 py-3 min-h-[120px]" placeholder="- Improved performance by 20%..." value={exp.details} onChange={(e) => updateField('experience', idx, 'details', e.target.value)} /></div>
                                            </div>
                                        </div>
                                    ))}
                                    <Button variant="outline" onClick={() => addEntry('experience')} className="w-full h-10 border bg-muted/20 text-[10px] uppercase font-bold tracking-widest text-muted-foreground rounded-xl">+ Add Experience</Button>
                                </div>
                            )}

                            {wizardStep === 3 && (
                                <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                                    {resumeData.projects.map((proj, idx) => (
                                        <div key={idx} className="space-y-4 p-6 border rounded-xl bg-muted/5 relative group hover:border-primary/20 transition-all">
                                            <button onClick={() => removeEntry('projects', idx)} className="absolute top-4 right-4 text-muted-foreground/40 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-2 hover:bg-red-50 rounded-lg"><Trash2 className="h-4 w-4" /></button>
                                            <div className="grid grid-cols-12 gap-x-8 gap-y-4">
                                                <div className="col-span-12 md:col-span-6 space-y-1.5"><label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Project Name</label><input className="w-full h-10 text-sm font-medium bg-background border rounded-lg px-4" placeholder="Project Alpha" value={proj.name} onChange={(e) => updateField('projects', idx, 'name', e.target.value)} /></div>
                                                <div className="col-span-12 md:col-span-6 space-y-1.5"><label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Tech Stack</label><input className="w-full h-10 text-sm font-medium bg-background border rounded-lg px-4" placeholder="React, Node, AWS" value={proj.tech} onChange={(e) => updateField('projects', idx, 'tech', e.target.value)} /></div>
                                                <div className="col-span-12 md:col-span-6 space-y-1.5"><label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Project Link</label><input className="w-full h-10 text-sm font-medium bg-background border rounded-lg px-4" placeholder="github.com/..." value={proj.projectLink} onChange={(e) => updateField('projects', idx, 'projectLink', e.target.value)} /></div>
                                                <div className="col-span-12 md:col-span-6 space-y-1.5"><label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Demo Link</label><input className="w-full h-10 text-sm font-medium bg-background border rounded-lg px-4" placeholder="project.vercel.app" value={proj.liveDemo} onChange={(e) => updateField('projects', idx, 'liveDemo', e.target.value)} /></div>
                                                <div className="col-span-12 space-y-1.5"><label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Description</label><textarea className="w-full text-sm font-medium bg-background border rounded-lg px-4 py-3 min-h-[100px]" placeholder="Brief description..." value={proj.details} onChange={(e) => updateField('projects', idx, 'details', e.target.value)} /></div>
                                            </div>
                                        </div>
                                    ))}
                                    <Button variant="outline" onClick={() => addEntry('projects')} className="w-full h-10 border bg-muted/20 text-[10px] uppercase font-bold tracking-widest text-muted-foreground rounded-xl">+ Add Project</Button>
                                </div>
                            )}

                            {wizardStep === 4 && (
                                <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                                    <div className="grid grid-cols-12 gap-x-8 gap-y-4">
                                        <div className="col-span-12 space-y-1.5"><label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Summary</label><textarea className="w-full text-sm font-medium bg-background border rounded-lg px-4 py-3 min-h-[100px] focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all leading-relaxed" placeholder="Briefly describe your career goals..." value={resumeData.summary} onChange={(e) => updateField('summary', 0, null, e.target.value)} /></div>
                                        <div className="col-span-12 space-y-1.5"><label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Skills</label><textarea className="w-full text-sm bg-background border rounded-lg px-4 py-3 min-h-[100px] font-mono" placeholder="Skills, Tools, etc..." value={resumeData.skills} onChange={(e) => updateField('skills', 0, null, e.target.value)} /></div>
                                        <div className="col-span-12 space-y-1.5"><label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Target Job Description</label><textarea className="w-full text-sm bg-background border rounded-lg px-4 py-3 min-h-[150px] border-primary/20" placeholder="Paste the job description here..." value={resumeData.targetJob} onChange={(e) => updateField('targetJob', 0, null, e.target.value)} /></div>
                                    </div>
                                </div>
                            )}

                            {wizardStep === 5 && (
                                <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                                    {resumeData.achievements.map((ach, idx) => (
                                        <div key={idx} className="flex gap-2 group relative">
                                            <div className="flex-1 space-y-1.5"><label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Achievement {idx + 1}</label><input className="w-full h-10 text-sm font-medium bg-background border rounded-lg px-4 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all" placeholder="Achievement name..." value={ach} onChange={(e) => updateField('achievements', idx, null, e.target.value)} /></div>
                                            <button onClick={() => removeEntry('achievements', idx)} className="mt-6 text-muted-foreground/40 hover:text-red-500 p-2 hover:bg-red-50 rounded-lg flex-shrink-0"><Trash2 className="h-4 w-4" /></button>
                                        </div>
                                    ))}
                                    <Button variant="outline" onClick={() => addEntry('achievements')} className="w-full h-10 border bg-muted/20 text-[10px] uppercase font-bold tracking-widest text-muted-foreground rounded-xl">+ Add Achievement</Button>
                                </div>
                            )}
                        </CardContent>

                        <CardFooter className="py-4 px-12 bg-muted/10 border-t border-border flex gap-4 flex-shrink-0">
                            {wizardStep > 0 && <Button size="sm" variant="ghost" onClick={() => setWizardStep(s => s - 1)} className="text-[10px] uppercase font-bold hover:bg-background px-4 h-9"><ChevronLeft className="mr-2 h-3.5 w-3.5" /> Back</Button>}
                            {wizardStep < 5 ? (
                                <Button size="sm" onClick={() => setWizardStep(s => s + 1)} className="ml-auto text-[10px] uppercase font-bold bg-primary text-primary-foreground hover:bg-primary/90 px-6 h-9 rounded-lg shadow-lg shadow-primary/20">Next Section <ChevronRight className="ml-2 h-3.5 w-3.5" /></Button>
                            ) : (
                                <Button size="sm" onClick={() => handleGenerate('resume')} disabled={isGenerating || !resumeData.targetJob.trim()} className="ml-auto text-[10px] uppercase font-bold bg-primary text-primary-foreground hover:bg-primary/90 px-8 h-9 rounded-lg shadow-lg shadow-primary/20">{isGenerating ? <>Generating <Loader2 className="ml-2 h-3.5 w-3.5 animate-spin" /></> : <>Generate Resume <Sparkles className="ml-2 h-3.5 w-3.5" /></>}</Button>
                            )}
                        </CardFooter>
                    </Card>
                </div>
            )}

            {viewMode === 'preview' && (
                <div className="flex-1 flex overflow-hidden animate-in fade-in duration-500">
                    {/* Left Sidebar: Actions */}
                    <div className="w-72 border-r border-border bg-background/50 backdrop-blur-md flex flex-col p-8 space-y-8 flex-shrink-0 animate-in slide-in-from-left-4 duration-500 delay-150 fill-mode-both">
                        <div className="space-y-2">
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60">Management</h3>
                            <div className="space-y-1">
                                <Button onClick={() => setViewMode('edit')} variant="ghost" className="w-full justify-start h-11 text-xs font-bold uppercase tracking-wider hover:bg-primary/5 hover:text-primary transition-all rounded-xl border border-transparent hover:border-primary/10 group">
                                    <PenTool className="mr-3 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" /> Edit Data
                                </Button>
                                {currentDoc && (
                                    <Button onClick={handlePrint} variant="ghost" className="w-full justify-start h-11 text-xs font-bold uppercase tracking-wider hover:bg-primary/5 hover:text-primary transition-all rounded-xl border border-transparent hover:border-primary/10 group text-primary bg-primary/5 border-primary/10">
                                        <Printer className="mr-3 h-4 w-4" /> Download PDF
                                    </Button>
                                )}
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-border">
                            <div className="p-4 rounded-2xl bg-muted/30 border border-border/50">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-foreground/80 mb-2 flex items-center gap-2">
                                    <Sparkles className="h-3 w-3 text-primary" /> ATS Score Optimization
                                </h4>
                                <p className="text-[10px] leading-relaxed text-muted-foreground font-medium">Your resume is currently optimized with high-density keyword mapping and professional justification.</p>
                            </div>
                        </div>

                        <div className="mt-auto pt-8 border-t border-border">
                            <Button variant="ghost" onClick={() => setViewMode('edit')} className="w-full justify-start h-11 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground group">
                                <ChevronLeft className="mr-3 h-4 w-4 group-hover:-translate-x-1 transition-transform" /> Back to Editor
                            </Button>
                        </div>
                    </div>

                    {/* Right Side: High-Fidelity Preview Container */}
                    <div className="flex-1 bg-zinc-50 dark:bg-zinc-950 overflow-y-auto custom-scrollbar flex flex-col items-center pt-16 pb-32">
                        {isGenerating ? (
                            <div className="flex flex-col items-center justify-center my-auto space-y-10 animate-in fade-in duration-700">
                                <div className="relative">
                                    <div className="absolute inset-0 animate-ping rounded-full bg-primary/10"></div>
                                    <div className="p-10 rounded-[3rem] bg-background border border-border shadow-2xl relative flex items-center justify-center">
                                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                                    </div>
                                </div>
                                <div className="text-center space-y-3">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground animate-pulse">Synthesis in Progress</h3>
                                    <p className="text-[10px] max-w-[280px] font-semibold uppercase tracking-wide opacity-50 italic leading-relaxed">Aligning professional identity with industry intelligence benchmarks.</p>
                                </div>
                            </div>
                        ) : currentDoc ? (
                            <div className="w-full max-w-fit px-8 animate-in zoom-in-95 slide-in-from-bottom-4 duration-700 delay-300 fill-mode-both">
                                <div className="max-w-[210mm] w-[210mm] min-h-[297mm] bg-white text-black shadow-[0_0_50px_-12px_rgba(0,0,0,0.15)] rounded-sm border border-border/20 selection:bg-black selection:text-white relative">
                                    <style>{RESUME_STYLES}</style>
                                    <div className="resume-render-root" dangerouslySetInnerHTML={{ __html: currentDoc.content }} />
                                </div>
                            </div>
                        ) : (
                            <div className="my-auto flex flex-col items-center text-center space-y-6 animate-in fade-in duration-500">
                                <div className="h-20 w-20 rounded-3xl bg-muted/30 flex items-center justify-center text-muted-foreground border border-border/50">
                                    <XCircle className="h-10 w-10 opacity-20" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-xs font-black uppercase tracking-widest">No Document Found</h3>
                                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Please return to the editor and initiate synthesis.</p>
                                </div>
                                <Button onClick={() => setViewMode('edit')} variant="outline" className="h-10 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest border-border">Return to Builder</Button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ResumeGenerator;
