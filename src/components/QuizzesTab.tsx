import { useState } from "react";
import { Plus, Trophy, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuizzes, Quiz } from "@/hooks/useQuizzes";
import { useAuth } from "@/contexts/AuthContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

const QUIZ_CATEGORIES = ["General", "Tech", "Science", "History", "Pop Culture", "Sports"];

export const QuizzesTab = ({ circleId }: { circleId: string }) => {
    const { user } = useAuth();
    const { quizzes, attempts, createQuiz, submitAttempt } = useQuizzes(circleId);
    const [createOpen, setCreateOpen] = useState(false);
    const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);

    // New Quiz State
    const [newTitle, setNewTitle] = useState("");
    const [newCategory, setNewCategory] = useState("General");
    const [newQuestions, setNewQuestions] = useState([{ question: "", options: ["", "", "", ""], correctOption: 0 }]);

    // Quiz Taking State
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [answers, setAnswers] = useState<number[]>([]);

    const handleCreate = async () => {
        if (!newTitle || newQuestions.some(q => !q.question || q.options.some(o => !o))) return;

        await createQuiz.mutateAsync({
            circle_id: circleId,
            title: newTitle,
            category: newCategory,
            questions: newQuestions as any,
            description: `A ${newQuestions.length} question quiz about ${newCategory}`
        });
        setCreateOpen(false);
        setNewTitle("");
        setNewQuestions([{ question: "", options: ["", "", "", ""], correctOption: 0 }]);
    };

    const handleAddQuestion = () => {
        setNewQuestions([...newQuestions, { question: "", options: ["", "", "", ""], correctOption: 0 }]);
    };

    const handleQuestionChange = (index: number, field: string, value: any) => {
        const updated = [...newQuestions];
        if (field === "question") updated[index].question = value;
        else if (field === "correctOption") updated[index].correctOption = value;
        else {
            // options
            const [optIndex, val] = value;
            updated[index].options[optIndex] = val;
        }
        setNewQuestions(updated);
    };

    const startQuiz = (quiz: Quiz) => {
        setActiveQuiz(quiz);
        setCurrentQuestionIndex(0);
        setAnswers([]);
        setSelectedOption(null);
    };

    const handleNextQuestion = () => {
        if (selectedOption === null) return;
        const newAnswers = [...answers, selectedOption];
        setAnswers(newAnswers);
        setSelectedOption(null);

        if (currentQuestionIndex < (activeQuiz?.questions.length || 0) - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        } else {
            // Finish
            const score = newAnswers.reduce((acc, ans, idx) => {
                return acc + (ans === activeQuiz?.questions[idx].correctOption ? 1 : 0);
            }, 0);

            submitAttempt.mutate({
                quizId: activeQuiz!.id,
                score,
                totalQuestions: activeQuiz!.questions.length
            });
            setActiveQuiz(null);
        }
    };

    if (activeQuiz) {
        const question = activeQuiz.questions[currentQuestionIndex];
        return (
            <div className="space-y-6 py-4">
                <div className="flex items-center justify-between">
                    <h3 className="font-bold text-lg">{activeQuiz.title}</h3>
                    <span className="text-sm text-muted-foreground">
                        Question {currentQuestionIndex + 1}/{activeQuiz.questions.length}
                    </span>
                </div>

                <div className="bg-card p-6 rounded-xl border space-y-4">
                    <h4 className="text-xl font-medium">{question.question}</h4>

                    <div className="grid gap-3">
                        {question.options.map((opt, idx) => (
                            <button
                                key={idx}
                                onClick={() => setSelectedOption(idx)}
                                className={`p-4 rounded-lg text-left transition-all border ${selectedOption === idx
                                        ? "bg-primary/10 border-primary ring-1 ring-primary"
                                        : "hover:bg-muted border-transparent bg-muted/50"
                                    }`}
                            >
                                {opt}
                            </button>
                        ))}
                    </div>
                </div>

                <Button
                    className="w-full"
                    disabled={selectedOption === null}
                    onClick={handleNextQuestion}
                >
                    {currentQuestionIndex === activeQuiz.questions.length - 1 ? "Finish Quiz" : "Next Question"}
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="font-semibold">Circle Quizzes</h3>
                <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm" variant="outline" className="gap-2">
                            <Plus className="w-4 h-4" /> New Quiz
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Create a Quiz</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-6 pt-4">
                            <div className="grid gap-4">
                                <Input
                                    placeholder="Quiz Title"
                                    value={newTitle}
                                    onChange={e => setNewTitle(e.target.value)}
                                />
                                <Select value={newCategory} onValueChange={setNewCategory}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {QUIZ_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>

                            {newQuestions.map((q, qIdx) => (
                                <div key={qIdx} className="p-4 border rounded-lg space-y-3 bg-muted/30">
                                    <div className="flex justify-between">
                                        <span className="font-medium text-sm">Question {qIdx + 1}</span>
                                    </div>
                                    <Input
                                        placeholder="Question text"
                                        value={q.question}
                                        onChange={e => handleQuestionChange(qIdx, "question", e.target.value)}
                                    />
                                    <div className="grid grid-cols-2 gap-2">
                                        {q.options.map((opt, oIdx) => (
                                            <div key={oIdx} className="flex gap-2">
                                                <input
                                                    type="radio"
                                                    name={`correct-${qIdx}`}
                                                    checked={q.correctOption === oIdx}
                                                    onChange={() => handleQuestionChange(qIdx, "correctOption", oIdx)}
                                                    className="mt-3"
                                                />
                                                <Input
                                                    placeholder={`Option ${oIdx + 1}`}
                                                    value={opt}
                                                    onChange={e => handleQuestionChange(qIdx, "options", [oIdx, e.target.value])}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}

                            <Button variant="ghost" onClick={handleAddQuestion} className="w-full border-dashed border-2">
                                <Plus className="w-4 h-4 mr-2" /> Add Question
                            </Button>

                            <Button onClick={handleCreate} className="w-full">Create Quiz</Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-3">
                {quizzes.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <Brain className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No quizzes yet. Create one to challenge friends!</p>
                    </div>
                ) : (
                    quizzes.map(quiz => {
                        const attempt = attempts.find(a => a.quiz_id === quiz.id);
                        return (
                            <div key={quiz.id} className="bg-card p-4 rounded-xl border flex items-center justify-between group hover:shadow-md transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-2xl">
                                        🧠
                                    </div>
                                    <div>
                                        <h4 className="font-bold">{quiz.title}</h4>
                                        <div className="flex gap-2 text-xs text-muted-foreground mt-1">
                                            <Badge variant="secondary" className="text-[10px]">{quiz.category}</Badge>
                                            <span>{quiz.questions.length} Questions</span>
                                        </div>
                                    </div>
                                </div>

                                {attempt ? (
                                    <div className="text-right">
                                        <div className="text-sm font-bold text-success flex items-center gap-1">
                                            <Trophy className="w-3 h-3" />
                                            {attempt.score}/{attempt.total_questions}
                                        </div>
                                        <p className="text-xs text-muted-foreground">Completed</p>
                                    </div>
                                ) : (
                                    <Button size="sm" onClick={() => startQuiz(quiz)}>Start</Button>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};
