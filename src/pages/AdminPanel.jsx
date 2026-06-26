import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Shield, Building2, Users, CheckCircle, XCircle, Eye, Trash2, MoreVertical, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { base44 } from '@/api/base44Client';
import { formatCurrency } from '@/lib/constants';
import { useToast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  active: 'bg-emerald-100 text-emerald-800',
  inactive: 'bg-slate-100 text-slate-600',
  rejected: 'bg-red-100 text-red-800',
};

export default function AdminPanel() {
  const { profile } = useOutletContext();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [properties, setProperties] = useState([]);
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ full_name: '', email: '', password: '' });
  const [addingAdmin, setAddingAdmin] = useState(false);

  useEffect(() => {
    if (profile?.role !== 'admin') {
      navigate('/');
      return;
    }
    const load = async () => {
      const [props, usrs, books] = await Promise.all([
        base44.entities.Property.list('-created_date', 50),
        base44.entities.UserProfile.list('-created_date', 50),
        base44.entities.Booking.list('-created_date', 50),
      ]);
      setProperties(props);
      setUsers(usrs);
      setBookings(books);
      setLoading(false);
    };
    load();
  }, [profile]);

  const updatePropertyStatus = async (id, status) => {
    await base44.entities.Property.update(id, { status });
    setProperties(prev => prev.map(p => p.id === id ? { ...p, status } : p));
    toast({ title: `Property ${status}` });
  };

  const deleteProperty = async (id) => {
    await base44.entities.Property.delete(id);
    setProperties(prev => prev.filter(p => p.id !== id));
    toast({ title: 'Property deleted' });
  };

  const handleAddAdmin = async () => {
    if (!newAdmin.email || !newAdmin.password || !newAdmin.full_name) {
      toast({ title: 'All fields required', variant: 'destructive' });
      return;
    }
    setAddingAdmin(true);
    try {
      // Add to users store
      const usersRaw = JSON.parse(localStorage.getItem('longstay_users') || '[]');
      const existing = usersRaw.find(u => u.email.toLowerCase() === newAdmin.email.toLowerCase());
      if (existing) {
        toast({ title: 'User with this email already exists', variant: 'destructive' });
        setAddingAdmin(false);
        return;
      }
      const userId = `user_${Math.random().toString(36).slice(2, 10)}`;
      usersRaw.push({
        id: userId,
        email: newAdmin.email,
        password: newAdmin.password,
        full_name: newAdmin.full_name,
        role: 'admin',
      });
      localStorage.setItem('longstay_users', JSON.stringify(usersRaw));

      // Add profile
      await base44.entities.UserProfile.create({
        user_id: userId,
        full_name: newAdmin.full_name,
        email: newAdmin.email,
        role: 'admin',
      });

      setUsers(prev => [...prev, { user_id: userId, full_name: newAdmin.full_name, email: newAdmin.email, role: 'admin' }]);
      setNewAdmin({ full_name: '', email: '', password: '' });
      setShowAddAdmin(false);
      toast({ title: `Admin "${newAdmin.full_name}" added successfully` });
    } catch (e) {
      toast({ title: 'Failed to add admin', variant: 'destructive' });
    }
    setAddingAdmin(false);
  };

  const makeAdmin = async (user) => {
    // Promote existing user to admin
    const usersRaw = JSON.parse(localStorage.getItem('longstay_users') || '[]');
    const idx = usersRaw.findIndex(u => u.id === user.user_id);
    if (idx !== -1) {
      usersRaw[idx].role = 'admin';
      localStorage.setItem('longstay_users', JSON.stringify(usersRaw));
    }
    await base44.entities.UserProfile.update(user.id, { role: 'admin' });
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, role: 'admin' } : u));
    toast({ title: `${user.full_name} is now an admin` });
  };

  const removeAdmin = async (user) => {
    const usersRaw = JSON.parse(localStorage.getItem('longstay_users') || '[]');
    const idx = usersRaw.findIndex(u => u.id === user.user_id);
    if (idx !== -1) {
      usersRaw[idx].role = 'renter';
      localStorage.setItem('longstay_users', JSON.stringify(usersRaw));
    }
    await base44.entities.UserProfile.update(user.id, { role: 'renter' });
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, role: 'renter' } : u));
    toast({ title: `${user.full_name} admin access removed` });
  };

  if (loading) return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="animate-pulse space-y-6">
        <div className="h-32 bg-slate-200 rounded-2xl" />
        <div className="h-64 bg-slate-200 rounded-2xl" />
      </div>
    </div>
  );

  const adminCount = users.filter(u => u.role === 'admin').length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Admin Panel</h1>
            <p className="text-sm text-slate-500">{adminCount} admin{adminCount !== 1 ? 's' : ''} · {users.length} total users</p>
          </div>
        </div>
        <Button onClick={() => setShowAddAdmin(true)} className="bg-amber-500 hover:bg-amber-600 text-white gap-2">
          <UserPlus className="w-4 h-4" /> Add Admin
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Properties', value: properties.length, icon: Building2 },
          { label: 'Users', value: users.length, icon: Users },
          { label: 'Bookings', value: bookings.length, icon: CheckCircle },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <Icon className="w-5 h-5 text-slate-400 mb-2" />
            <p className="text-2xl font-bold text-slate-900">{value}</p>
            <p className="text-sm text-slate-500">{label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="properties">
        <TabsList className="bg-slate-100">
          <TabsTrigger value="properties" className="data-[state=active]:bg-white">Properties</TabsTrigger>
          <TabsTrigger value="users" className="data-[state=active]:bg-white">Users</TabsTrigger>
          <TabsTrigger value="bookings" className="data-[state=active]:bg-white">Bookings</TabsTrigger>
        </TabsList>

        {/* Properties Tab */}
        <TabsContent value="properties" className="space-y-3 mt-4">
          {properties.length === 0 && <p className="text-slate-400 text-center py-12">No properties yet</p>}
          {properties.map(p => (
            <div key={p.id} className="bg-white rounded-xl border border-slate-100 p-4 flex items-center gap-4">
              <img src={p.images?.[0] || 'https://via.placeholder.com/80'} className="w-16 h-16 rounded-lg object-cover" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 truncate">{p.title}</p>
                <p className="text-sm text-slate-500">{p.city}, {p.country} · {p.host_name} · {formatCurrency(p.monthly_rent, p.currency)}/mo</p>
              </div>
              <Badge className={STATUS_COLORS[p.status] || STATUS_COLORS.pending} variant="outline">{p.status}</Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm"><MoreVertical className="w-4 h-4" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {p.status !== 'active' && <DropdownMenuItem onClick={() => updatePropertyStatus(p.id, 'active')}><CheckCircle className="w-4 h-4 mr-2 text-emerald-500" />Approve</DropdownMenuItem>}
                  {p.status !== 'rejected' && <DropdownMenuItem onClick={() => updatePropertyStatus(p.id, 'rejected')}><XCircle className="w-4 h-4 mr-2 text-red-500" />Reject</DropdownMenuItem>}
                  <DropdownMenuItem onClick={() => deleteProperty(p.id)} className="text-red-600"><Trash2 className="w-4 h-4 mr-2" />Delete</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-3 mt-4">
          {users.length === 0 && <p className="text-slate-400 text-center py-12">No users yet</p>}
          {users.map(u => (
            <div key={u.id} className="bg-white rounded-xl border border-slate-100 p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-sm">
                {u.full_name?.[0] || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900">{u.full_name}</p>
                <p className="text-sm text-slate-500">{u.email} · {u.country}</p>
              </div>
              <Badge className={u.role === 'admin' ? 'bg-purple-100 text-purple-800' : u.role === 'host' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-600'} variant="outline">
                {u.role}
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm"><MoreVertical className="w-4 h-4" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {u.role !== 'admin' && (
                    <DropdownMenuItem onClick={() => makeAdmin(u)}>
                      <Shield className="w-4 h-4 mr-2 text-purple-500" />Make Admin
                    </DropdownMenuItem>
                  )}
                  {u.role === 'admin' && u.user_id !== profile?.user_id && (
                    <DropdownMenuItem onClick={() => removeAdmin(u)} className="text-red-600">
                      <XCircle className="w-4 h-4 mr-2" />Remove Admin
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </TabsContent>

        {/* Bookings Tab */}
        <TabsContent value="bookings" className="space-y-3 mt-4">
          {bookings.length === 0 && <p className="text-slate-400 text-center py-12">No bookings yet</p>}
          {bookings.map(b => (
            <div key={b.id} className="bg-white rounded-xl border border-slate-100 p-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 truncate">{b.property_title}</p>
                <p className="text-sm text-slate-500">{b.renter_name} → {b.host_name} · {b.lease_months}mo · {formatCurrency(b.total_amount, b.currency)}</p>
              </div>
              <Badge className={STATUS_COLORS[b.status] || STATUS_COLORS.pending} variant="outline">{b.status}</Badge>
            </div>
          ))}
        </TabsContent>
      </Tabs>

      {/* Add Admin Dialog */}
      <Dialog open={showAddAdmin} onOpenChange={setShowAddAdmin}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Admin</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label>Full Name</Label>
              <Input placeholder="John Smith" value={newAdmin.full_name} onChange={e => setNewAdmin(p => ({ ...p, full_name: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label>Email</Label>
              <Input placeholder="admin@example.com" value={newAdmin.email} onChange={e => setNewAdmin(p => ({ ...p, email: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label>Password</Label>
              <Input type="password" placeholder="••••••••" value={newAdmin.password} onChange={e => setNewAdmin(p => ({ ...p, password: e.target.value }))} className="mt-1" />
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowAddAdmin(false)}>Cancel</Button>
              <Button className="flex-1 bg-amber-500 hover:bg-amber-600 text-white" onClick={handleAddAdmin} disabled={addingAdmin}>
                {addingAdmin ? 'Adding...' : 'Add Admin'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
