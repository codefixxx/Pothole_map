'use client';

import React, { useState } from 'react';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Textarea } from '@/src/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import { toast } from 'sonner';
import { Mail, Send, CheckCircle2, MessageSquare, AlertCircle, Sparkles, Building2 } from 'lucide-react';

export function ContactForm() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [type, setType] = useState<'inquiry' | 'complaint' | 'feedback' | 'partnership'>('inquiry');
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !email || !subject || !message) {
            toast.error('Please fill in all required fields.');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, type, subject, message }),
            });

            const data = await res.json();
            if (res.ok && data.success) {
                toast.success(data.message || 'Your inquiry/complaint has been submitted successfully!');
                setSubmitted(true);
            } else {
                toast.error(data.error || 'Failed to submit form. Please try again.');
            }
        } catch (err) {
            console.error('Submit contact error:', err);
            toast.error('Network error. Please check your connection and try again.');
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <Card className="border-emerald-500/30 bg-emerald-500/5 shadow-md">
                <CardContent className="pt-6 pb-6 text-center space-y-4">
                    <div className="mx-auto size-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                        <CheckCircle2 className="size-6" />
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-lg font-semibold text-foreground">Message Sent Successfully</h3>
                        <p className="text-xs text-muted-foreground max-w-md mx-auto">
                            Thank you for reaching out! Your query or complaint has been forwarded directly to our support team email. We will review your message and reply back shortly.
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            setSubmitted(false);
                            setName('');
                            setEmail('');
                            setSubject('');
                            setMessage('');
                        }}
                        className="text-xs"
                    >
                        Send Another Inquiry
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-border/80 shadow-lg bg-card">
            <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                    <div className="rounded-lg bg-primary/10 p-2 text-primary">
                        <Mail className="size-5" />
                    </div>
                    <div>
                        <CardTitle className="text-lg font-bold">Contact Support & File Inquiry</CardTitle>
                        <CardDescription className="text-xs">
                            Have a question, feedback, or municipal complaint? Send a direct message to our support team.
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>

            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-foreground/90">Your Full Name *</label>
                            <Input
                                type="text"
                                placeholder="John Doe"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="h-9 text-xs"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-foreground/90">Email Address *</label>
                            <Input
                                type="email"
                                placeholder="john@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="h-9 text-xs"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-foreground/90">Category *</label>
                            <select
                                value={type}
                                onChange={(e: any) => setType(e.target.value)}
                                className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            >
                                <option value="inquiry">General Inquiry</option>
                                <option value="complaint">Report Complaint / Issue</option>
                                <option value="feedback">Feedback / Suggestion</option>
                                <option value="partnership">Municipal Partnership</option>
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-foreground/90">Subject *</label>
                            <Input
                                type="text"
                                placeholder="Brief summary of your request"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                required
                                className="h-9 text-xs"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground/90">Message / Complaint Details *</label>
                        <Textarea
                            placeholder="Provide full details of your query, complaint, or feedback..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows={4}
                            required
                            className="text-xs resize-none"
                        />
                    </div>

                    <Button type="submit" disabled={loading} className="w-full sm:w-auto h-9 text-xs font-medium px-6 gap-2">
                        {loading ? (
                            <>
                                <span className="size-3.5 border-2 border-white border-t-transparent animate-spin rounded-full" />
                                <span>Sending Email...</span>
                            </>
                        ) : (
                            <>
                                <Send className="size-3.5" />
                                <span>Send Support Message</span>
                            </>
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
