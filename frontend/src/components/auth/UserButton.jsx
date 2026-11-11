import { Link, useNavigate } from "react-router-dom";
import { LogOut, LayoutDashboard, UserRound } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth";

export function UserButton() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  if (!user) return null;
  const initial = (user.name || user.email || "?").trim()[0]?.toUpperCase();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button aria-label="Account menu" data-testid="user-menu-button" className="w-10 h-10 rounded-full bg-amber-400 text-slate-950 font-poster font-black text-lg grid place-items-center hover:bg-amber-300 transition-colors">{initial || <UserRound className="w-4 h-4" />}</button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56" data-testid="user-menu">
        <DropdownMenuLabel className="font-normal"><p className="font-semibold truncate">{user.name || "My account"}</p><p className="text-xs text-muted-foreground truncate" data-testid="user-menu-email">{user.email}</p></DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild><Link to="/dashboard" data-testid="user-menu-dashboard"><LayoutDashboard className="w-4 h-4 mr-2" />My account</Link></DropdownMenuItem>
        <DropdownMenuItem onClick={async () => { await signOut(); navigate("/"); }} data-testid="user-menu-sign-out"><LogOut className="w-4 h-4 mr-2" />Sign out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
