import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Building2, Menu, X, Heart, MessageSquare, User, LayoutDashboard, Search, Plus, Shield, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar({ user, profile }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isHost = profile?.role === 'host' || profile?.role === 'admin';
  const isAdmin = profile?.role === 'admin';

  const handleLogout = () => {
    base44.auth.logout('/login');
  };

  const initials = user?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center group-hover:bg-amber-500 transition-colors">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="font-heading font-bold text-xl text-slate-900 tracking-tight hidden sm:block">LongStay</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            <Link to="/search" className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
              <Search className="w-4 h-4" />
              Explore
            </Link>
            {isHost && (
              <Link to="/host/dashboard" className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>
            )}
            <Link to="/saved" className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
              <Heart className="w-4 h-4" />
              Saved
            </Link>
            <Link to="/messages" className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
              <MessageSquare className="w-4 h-4" />
              Messages
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {isHost && (
              <Button size="sm" onClick={() => navigate('/host/create-listing')} className="hidden md:flex bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold rounded-full px-4">
                <Plus className="w-4 h-4 mr-1.5" />
                List Property
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 p-1.5 rounded-full border border-slate-200 hover:shadow-md transition-shadow">
                  <Menu className="w-4 h-4 text-slate-600 ml-1" />
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={profile?.photo} />
                    <AvatarFallback className="bg-slate-900 text-white text-xs">{initials}</AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <User className="w-4 h-4 mr-2" /> Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/bookings')}>
                  <LayoutDashboard className="w-4 h-4 mr-2" /> My Bookings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/saved')}>
                  <Heart className="w-4 h-4 mr-2" /> Saved Properties
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/messages')}>
                  <MessageSquare className="w-4 h-4 mr-2" /> Messages
                </DropdownMenuItem>
                {isHost && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/host/dashboard')}>
                      <LayoutDashboard className="w-4 h-4 mr-2" /> Host Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/host/create-listing')}>
                      <Plus className="w-4 h-4 mr-2" /> Create Listing
                    </DropdownMenuItem>
                  </>
                )}
                {isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/admin')}>
                      <Shield className="w-4 h-4 mr-2" /> Admin Panel
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut className="w-4 h-4 mr-2" /> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="w-6 h-6" /> : null}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="md:hidden overflow-hidden border-t bg-white">
            <div className="px-4 py-3 space-y-1">
              <Link to="/search" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-100">
                <Search className="w-5 h-5 text-slate-500" />
                <span className="text-sm font-medium">Explore</span>
              </Link>
              <Link to="/saved" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-100">
                <Heart className="w-5 h-5 text-slate-500" />
                <span className="text-sm font-medium">Saved</span>
              </Link>
              <Link to="/messages" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-100">
                <MessageSquare className="w-5 h-5 text-slate-500" />
                <span className="text-sm font-medium">Messages</span>
              </Link>
              <Link to="/bookings" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-100">
                <LayoutDashboard className="w-5 h-5 text-slate-500" />
                <span className="text-sm font-medium">My Bookings</span>
              </Link>
              {isHost && (
                <Link to="/host/dashboard" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-100">
                  <LayoutDashboard className="w-5 h-5 text-slate-500" />
                  <span className="text-sm font-medium">Host Dashboard</span>
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}