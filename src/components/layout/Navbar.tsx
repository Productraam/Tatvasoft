import React, { useEffect, useState } from 'react';
import {
  Building2,
  ShieldCheck,
  MapPin,
  LogOut,
  Menu
} from 'lucide-react';
import { storageService } from '../../services/storageService';
import { TempleProfile, User } from '../../types/accounting';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onLogout?: () => void;
  onToggleMenu?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setCurrentTab, onLogout, onToggleMenu }) => {
  const [profile, setProfile] = useState<TempleProfile>(storageService.getTempleProfile());
  const [currentUser, setCurrentUser] = useState<User>(storageService.getCurrentUser());

  useEffect(() => {
    const handleStorageUpdate = () => {
      setProfile(storageService.getTempleProfile());
      setCurrentUser(storageService.getCurrentUser());
    };

    window.addEventListener('temple_storage_updated', handleStorageUpdate);
    return () => {
      window.removeEventListener('temple_storage_updated', handleStorageUpdate);
    };
  }, []);

  const handleSignOut = () => {
    if (onLogout) {
      onLogout();
    } else {
      sessionStorage.clear();
      window.location.reload();
    }
  };

  return (
    <>
      <header className="bg-[#FFFCF7] border-b border-[#E5DED2] sticky top-0 z-30">
        <div className="h-1 bg-[#C96A24]"></div>

        <div className="px-5 py-2.5 flex items-center justify-between">
          {/* Brand & Temple Info */}
          <div className="flex items-center gap-3">
            {onToggleMenu && (
              <button
                onClick={onToggleMenu}
                aria-label="Toggle navigation menu"
                className="lg:hidden p-2 -ml-1 rounded-lg text-orange-700 hover:bg-orange-50 transition cursor-pointer"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
              <div className="w-9 h-9 rounded-lg bg-[#C96A24] flex items-center justify-center text-white shadow-sm">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-stone-900 text-sm leading-tight">
                {profile.name}
              </h1>
              <p className="text-[11px] text-stone-500 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3" />
                {profile.city || profile.address?.split(',')[0]?.trim() || 'Sanctum'}
              </p>
            </div>
          </div>

          {/* Right Tools: Authenticated Staff Profile & Sign Out Only */}
          <div className="flex items-center gap-3">
            {/* Authenticated User Profile Badge */}
            <div className="flex items-center gap-2.5 border border-[#E5DED2] bg-[#F8F5EF] px-3 py-1.5 rounded-lg">
              <div className="w-7 h-7 rounded-full bg-[#287C78] text-white flex items-center justify-center font-bold text-xs">
                {currentUser.name ? currentUser.name.charAt(0) : 'U'}
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-stone-900 leading-tight">
                  {currentUser.name}
                </div>
                <div className="text-[10px] uppercase font-semibold text-stone-500 tracking-wide flex items-center gap-1 mt-0.5">
                  <ShieldCheck className="w-3 h-3 text-stone-400" />
                  {currentUser.role}
                </div>
              </div>
            </div>

            {/* Sign Out Button */}
            <button
              onClick={handleSignOut}
              title="Sign Out to Temple Login Screen"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-xs font-bold cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 text-stone-400" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>
    </>
  );
};
