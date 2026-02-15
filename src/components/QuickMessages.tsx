import { Briefcase, Clock, CircleCheck, XCircle } from "lucide-react";

interface QuickMessagesProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

const QUICK_MESSAGES = [
  { emoji: <Briefcase className="h-4 w-4" />, text: "J'attends mes bagages" },
  
  { emoji: <Clock className="h-4 w-4" />, text: "J'arrive dans 5 minutes" },
  { emoji: <CircleCheck className="h-4 w-4" />, text: "Je suis arrivé au point de rencontre", customBg: "bg-[#D3E4D1]", customText: "text-[#4E657A]" },
  { emoji: <XCircle className="h-4 w-4" />, text: "Je dois annuler", customBg: "bg-[#e34454]", customText: "text-white" },
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
            py-3 border-0 text-[14px]
            ${msg.customBg ? msg.customBg : "bg-card"}
            ${msg.customText ? msg.customText : "text-card-foreground"}
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
