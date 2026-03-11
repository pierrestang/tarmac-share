import { Briefcase, Clock } from "lucide-react";

interface QuickMessagesProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

const QUICK_MESSAGES = [
  { emoji: <Briefcase className="h-4 w-4" />, text: "J'attends mes bagages" },
  { emoji: <Clock className="h-4 w-4" />, text: "J'arrive dans 5 minutes" },
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
            flex items-center gap-3 w-full rounded-xl px-4 text-left transition-opacity whitespace-nowrap
            disabled:opacity-50 disabled:pointer-events-none
            py-3 border-0 text-[14px] bg-card text-card-foreground
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
