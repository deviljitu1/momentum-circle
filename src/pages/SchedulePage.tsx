
import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea"; // Assuming this exists, if not I'll use simple textarea or Check
import { Calendar as CalendarIcon, Mail, Phone, User, Clock, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const SchedulePage = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [time, setTime] = useState("10:00");
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        notes: ""
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSchedule = (e: React.FormEvent) => {
        e.preventDefault();

        if (!date || !time || !formData.name || !formData.email) {
            toast({
                title: "Missing Information",
                description: "Please fill in all required fields.",
                variant: "destructive"
            });
            return;
        }

        const formattedDate = format(date, "EEEE, MMMM do, yyyy");
        
        // Construct mailto link
        const subject = `Meeting Request: ${formData.name}`;
        const body = `
Name: ${formData.name}
Email: ${formData.email}
Phone: ${formData.phone}
Date: ${formattedDate}
Time: ${time}

Notes:
${formData.notes}
        `.trim();

        const mailtoLink = `mailto:nahushpatel2@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

        // Open email client
        window.location.href = mailtoLink;

        toast({
            title: "Email Client Opened",
            description: "Please send the pre-filled email to confirm your booking.",
        });
    };

    return (
        <div className="min-h-screen bg-background pb-20 pt-6 px-4">
            <div className="max-w-4xl mx-auto space-y-6">
                <motion.div 
                    initial={{ opacity: 0, x: -20 }} 
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-4"
                >
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-extrabold">Schedule Meeting</h1>
                        <p className="text-sm text-muted-foreground">Book a time slot with us</p>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Calendar Section */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-card rounded-2xl border border-border/50 p-6 shadow-sm h-fit"
                    >
                        <div className="flex items-center gap-2 mb-4">
                            <CalendarIcon className="w-5 h-5 text-primary" />
                            <h2 className="font-bold text-lg">Select Date & Time</h2>
                        </div>
                        
                        <div className="flex justify-center mb-6">
                            <Calendar
                                mode="single"
                                selected={date}
                                onSelect={setDate}
                                className="rounded-md border shadow-sm bg-background pointer-events-auto"
                                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))} // Disable past dates
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Time Slot</Label>
                            <div className="relative">
                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <select 
                                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-9"
                                    value={time}
                                    onChange={(e) => setTime(e.target.value)}
                                >
                                    <option value="09:00">09:00 AM</option>
                                    <option value="09:30">09:30 AM</option>
                                    <option value="10:00">10:00 AM</option>
                                    <option value="10:30">10:30 AM</option>
                                    <option value="11:00">11:00 AM</option>
                                    <option value="11:30">11:30 AM</option>
                                    <option value="12:00">12:00 PM</option>
                                    <option value="13:00">01:00 PM</option>
                                    <option value="13:30">01:30 PM</option>
                                    <option value="14:00">02:00 PM</option>
                                    <option value="14:30">02:30 PM</option>
                                    <option value="15:00">03:00 PM</option>
                                    <option value="15:30">03:30 PM</option>
                                    <option value="16:00">04:00 PM</option>
                                </select>
                            </div>
                        </div>
                    </motion.div>

                    {/* Contact Form Section */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-card rounded-2xl border border-border/50 p-6 shadow-sm"
                    >
                        <div className="flex items-center gap-2 mb-6">
                            <User className="w-5 h-5 text-primary" />
                            <h2 className="font-bold text-lg">Your Details</h2>
                        </div>

                        <form onSubmit={handleSchedule} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name *</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input 
                                        id="name" 
                                        name="name" 
                                        placeholder="John Doe" 
                                        className="pl-9"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        required 
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address *</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input 
                                        id="email" 
                                        name="email" 
                                        type="email" 
                                        placeholder="john@example.com" 
                                        className="pl-9"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        required 
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone Number (Optional)</Label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input 
                                        id="phone" 
                                        name="phone" 
                                        type="tel" 
                                        placeholder="+1 (555) 000-0000" 
                                        className="pl-9"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="notes">Additional Notes</Label>
                                <textarea 
                                    id="notes" 
                                    name="notes" 
                                    placeholder="Any specific topics you want to discuss?" 
                                    className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={formData.notes}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div className="pt-4">
                                <Button type="submit" className="w-full h-12 text-lg font-bold gradient-primary text-primary-foreground shadow-lg shadow-primary/20">
                                    <CheckCircle2 className="w-5 h-5 mr-2" />
                                    Confirm Booking
                                </Button>
                                <p className="text-xs text-center text-muted-foreground mt-3">
                                    This will open your email client to send the booking request.
                                </p>
                            </div>
                        </form>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default SchedulePage;
