import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const VotreTiming = () => {
  const navigate = useNavigate();

  return (
    <section
      className="flex flex-col flex-1 min-h-screen px-3 pt-6 pb-6"
      style={{ backgroundColor: "#A291A9" }}
    >
      <div className="flex flex-col gap-2 px-4 pt-6 pb-4">
        <button onClick={() => navigate(-1)} className="p-1 self-start">
          <ArrowLeft className="h-6 w-6" style={{ color: "#F0EEE9" }} />
        </button>
        <h1
          className="text-[22px] font-semibold"
          style={{ color: "#F0EEE9" }}
        >
          Votre timing.
        </h1>
      </div>
    </section>
  );
};

export default VotreTiming;
