import erLogo from "@/assets/er.png";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useProfiles } from "@/hooks/use-profiles";
import { useAuth } from "@/hooks/use-auth";
import { LogOut, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function TopHeader() {
  const { getActiveProfile } = useProfiles();
  const { signOut } = useAuth();
  const activeProfile = getActiveProfile();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth", { replace: true });
  };

  return (
    <header className="sticky top-0 z-40 border-b bg-white">
      <div className="container relative flex h-14 items-center justify-center">
        <div className="absolute left-0 flex items-center">
          <Avatar className="h-8 w-8">
            {activeProfile?.photo ? (
              <AvatarImage src={activeProfile.photo} alt={activeProfile.firstName} />
            ) : null}
            <AvatarFallback className="text-xs">
              {activeProfile?.firstName?.charAt(0) || "?"}
            </AvatarFallback>
          </Avatar>
        </div>
        
        <img src={erLogo} alt="Logo ER" className="h-8 w-auto" />

        <div className="absolute right-0 flex items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Paramètres"
                className="rounded-md p-2 text-foreground hover:bg-muted focus:outline-none"
              >
                <Settings size={20} aria-hidden="true" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-48">
              <DropdownMenuItem onSelect={() => navigate("/compte")}>Mon profil</DropdownMenuItem>
              <DropdownMenuItem onSelect={handleSignOut}>
                <LogOut size={16} className="mr-2" />
                Déconnexion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
