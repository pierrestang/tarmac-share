import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import erLogo from "@/assets/er.png";

type Phase = "enter" | "visible" | "exit";

const Splash = () => {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("enter");

  useEffect(() => {
    // Timeline: 0-0.5s enter, 0.5-1.5s visible, 1.5-2.1s exit, 2.1s redirect
    const t1 = setTimeout(() => setPhase("visible"), 500);
    const t2 = setTimeout(() => setPhase("exit"), 1500);
    const t3 = setTimeout(() => navigate("/comment-ca-marche"), 2100);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [navigate]);

  const getAnimationClass = () => {
    switch (phase) {
      case "enter":
        return "animate-logo-enter";
      case "exit":
        return "animate-logo-spin-out";
      default:
        return "";
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <img
        src={erLogo}
        alt="Logo ER"
        className={`h-32 w-auto ${getAnimationClass()}`}
      />
    </div>
  );
};

export default Splash;
