import { motion } from "framer-motion";
import { Sparkles, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAISuggestions } from "@/hooks/useAISuggestions";
import { useEffect } from "react";

const AISuggestionsCard = () => {
  const { suggestions, loading, fetchSuggestions } = useAISuggestions();

  useEffect(() => {
    fetchSuggestions();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl p-4 border border-border/50 shadow-card"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gradient-hero flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary-foreground" />
          </div>
          <h3 className="font-bold text-sm">AI Insights</h3>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={fetchSuggestions}
          disabled={loading}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
        </Button>
      </div>

      {loading && suggestions.length === 0 ? (
        <div className="flex items-center justify-center py-6 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          <span className="text-sm">Analyzing your patterns...</span>
        </div>
      ) : suggestions.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          Tap refresh to get AI-powered productivity tips!
        </p>
      ) : (
        <div className="space-y-2">
          {suggestions.slice(0, 3).map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex gap-2 p-2 rounded-lg bg-muted/50"
            >
              <span className="text-lg shrink-0">{s.emoji}</span>
              <div>
                <p className="text-xs font-semibold">{s.title}</p>
                <p className="text-xs text-muted-foreground">{s.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default AISuggestionsCard;
