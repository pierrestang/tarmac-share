import { useSearchParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

function getCodeFromId(conversationId: string): number {
  let hash = 0;
  for (let i = 0; i < conversationId.length; i++) {
    hash = ((hash << 5) - hash) + conversationId.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % 900 + 100;
}

const Numero = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const conversationId = searchParams.get("conversationId") || "";
  const code = getCodeFromId(conversationId);

  return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ backgroundColor: "#00C853" }}>
      <button
        onClick={() => navigate(`/messages?conversationId=${conversationId}`)}
        className="absolute top-6 left-6 text-foreground"
      >
        <ArrowLeft className="h-8 w-8" />
      </button>
      <span className="text-foreground font-bold" style={{ fontSize: "120px" }}>
        {code}
      </span>
    </div>
  );
};

export default Numero;
