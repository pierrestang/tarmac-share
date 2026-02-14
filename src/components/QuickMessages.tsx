import { Briefcase, Clock, CheckCircle, XCircle } from "lucide-react";

interface QuickMessagesProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

const QUICK_MESSAGES = [
  { emoji: <Briefcase className="h-4 w-4" />, text: "J'attends mes bagages" },
  
  { emoji: <Clock className="h-4 w-4" />, text: "J'arrive dans 5 minutes" },
  { emoji: <CheckCircle className="h-4 w-4" />, text: "Je suis prêt à partir", primary: true },
  { emoji: <XCircle className="h-4 w-4" />, text: "Je dois annuler", destructive: true },
];

const QuickMessages = ({ onSend, disabled }: QuickMessagesProps) => {
  return (
    <div className="flex flex-col gap-2">
      {QUICK_MESSAGES.map((msg) => (
        <button
          key={msg.text}
          onClick={() => onSend(msg.text)}
          disabled={disabled}
          className={`
            flex items-center gap-3 w-full rounded-xl px-4 text-left transition-opacity
            disabled:opacity-50 disabled:pointer-events-none
            ${msg.primary
              ? "py-3 bg-card border border-green-500 text-green-600 text-[14px]"
              : msg.destructive
                ? "py-3 bg-card border border-red-400 text-red-500 text-[14px]"
                : "py-3 bg-card border border-border text-card-foreground text-[14px]"
            }
          `}
        >
          {msg.emoji}
          <span>{msg.text}</span>
        </button>
      ))}
    </div>
  );
};

export default QuickMessages;
