import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
      <div className="text-center">
        <h1 className="mb-3 text-[24px] font-semibold">404</h1>
        <p className="mb-6 text-[14px] font-normal">Page introuvable</p>
        <a href="/">
          <Button type="button">Retour</Button>
        </a>
      </div>
    </div>
  );
};

export default NotFound;
