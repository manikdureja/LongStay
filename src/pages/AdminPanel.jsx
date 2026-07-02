import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Shield, Building2, Users, CheckCircle, XCircle, Trash2, MoreVertical, UserPlus, Calendar, IndianRupee, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/constants';
import { useToast } from '@/components/ui/use-toast';

const STATUS_COLORS = {
  pending:   'bg-yellow-100 text-yellow-800',
  approved:  'bg-emerald-100 text-emerald-800',
  active:    'bg-blue-100 text-blue-800',
  completed: 'bg-slate-100 text-slate-600',
  rejected:  'bg-red-100 text-red-800',
  cancelled: 'bg-red-50 text-red-400',
  inactive:  'bg-slate-100 text-slate-500',
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
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (profile?.role !== 'admin') { navigate('/'); return; }
    loadAll();
  }, [profile]);

  const loadAll = async () => {
    setLoading(true);
    const [{ data: props }, { data: usrs }, { data: books }] = await Promise.all([
      supabase.from('properties').select('*').order('created_at', { ascending: false }),
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('bookings').select('*').order('created_at', { ascending: false }),
    ]);
    setProperties(props || []);
    setUsers(usrs || []);
    setBookings(books || []);
    setLoading(false);
  };

  // Property actions
  const updatePropertyStatus = async (id, status) => {
    await supabase.from('properties').update({ status }).eq('id', id);
    setProperties(prev => prev.map(p => p.id === id ? { ...p, status } : p));
    toast({ title: `Property ${status}` });
  };

  const deleteProperty = async (id) => {
    await supabase.from('properties').delete().eq('id', id);
    setProperties(prev => prev.filter(p => p.id !== id));
    toast({ title: 'Property deleted' });
  };

  // Booking actions
  const updateBookingStatus = async (id, status) => {
    await supabase.from('bookings').update({ status }).eq('id', id);
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
    toast({ title: `Booking ${status}` });
  };

  const deleteBooking = async (id) => {
    await supabase.from('bookings').delete().eq('id', id);
    setBookings(prev => prev.filter(b => b.id !== id));
    toast({ title: 'Booking deleted' });
  };

  // User actions
  const updateUserRole = async (userId, role) => {
    await supabase.from('profiles').update({ role }).eq('id', userId);
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
    toast({ title: `User role updated to ${role}` });
  };

  const deleteUser = async (userId) => {
    await supabase.from('profiles').delete().eq('id', userId);
    setUsers(prev => prev.filter(u => u.id !== userId));
    toast({ title: 'User removed' });
  };

  // Add admin
  const handleAddAdmin = async () => {
    if (!newAdmin.email || !newAdmin.password || !newAdmin.full_name) {
      toast({ title: 'All fields required', variant: 'destructive' }); return;
    }
    setAddingAdmin(true);
    try {
      const { data, error } = await supabase.auth.admin?.createUser({
        email: newAdmin.email,
        password: newAdmin.password,
        user_metadata: { full_name: newAdmin.full_name },
      });
      if (error) throw error;
      await supabase.from('profiles').update({ role: 'admin', full_name: newAdmin.full_name }).eq('id', data.user.id);
      await loadAll();
      setNewAdmin({ full_name: '', email: '', password: '' });
      setShowAddAdmin(false);
      toast({ title: `Admin "${newAdmin.full_name}" added` });
    } catch (e) {
      // Fallback: just update role if user already exists
      const { data: existing } = await supabase.from('profiles').select('id').eq('email', newAdmin.email).single();
      if (existing) {
        await supabase.from('profiles').update({ role: 'admin' }).eq('id', existing.id);
        await loadAll();
        setShowAddAdmin(false);
        toast({ title: `${newAdmin.email} promoted to admin` });
      } else {
        toast({ title: 'Failed: user must register first, then promote them from Users tab', variant: 'destructive' });
      }
    }
    setAddingAdmin(false);
  };

  if (loading) return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="animate-pulse space-y-4">
        <div className="h-32 bg-slate-200 rounded-2xl" />
        <div className="h-64 bg-slate-200 rounded-2xl" />
      </div>
    </div>
  );

  const totalRevenue = bookings.filter(b => b.status === 'active' || b.status === 'completed').reduce((s, b) => s + (b.total_amount || 0), 0);
  const pendingBookings = bookings.filter(b => b.status === 'pending').length;
  const pendingProperties = properties.filter(p => p.status === 'pending').length;

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
            <p className="text-sm text-slate-500">Full control over LongStay</p>
          </div>
        </div>
        <Button onClick={() => setShowAddAdmin(true)} className="bg-amber-500 hover:bg-amber-600 text-white gap-2">
          <UserPlus className="w-4 h-4" /> Add Admin
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Properties', value: properties.length, sub: `${pendingProperties} pending`, icon: Building2, color: 'text-blue-500', bg: 'bg-blue-50' },
          { label: 'Total Users', value: users.length, sub: `${users.filter(u => u.role === 'admin').length} admins`, icon: Users, color: 'text-purple-500', bg: 'bg-purple-50' },
          { label: 'Total Bookings', value: bookings.length, sub: `${pendingBookings} pending`, icon: Calendar, color: 'text-amber-500', bg: 'bg-amber-50' },
          { label: 'Total Revenue', value: formatCurrency(totalRevenue), sub: 'Active + completed', icon: IndianRupee, color: 'text-emerald-500', bg: 'bg-emerald-50' },
        ].map(({ label, value, sub, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center mb-3`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <p className="text-2xl font-bold text-slate-900">{value}</p>
            <p className="text-sm text-slate-500">{label}</p>
            <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-100">
          <TabsTrigger value="overview" className="data-[state=active]:bg-white">
            Overview {pendingProperties + pendingBookings > 0 && <span className="ml-1.5 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">{pendingProperties + pendingBookings}</span>}
          </TabsTrigger>
          <TabsTrigger value="properties" className="data-[state=active]:bg-white">Properties</TabsTrigger>
          <TabsTrigger value="bookings" className="data-[state=active]:bg-white">Bookings</TabsTrigger>
          <TabsTrigger value="users" className="data-[state=active]:bg-white">Users</TabsTrigger>
        </TabsList>

        {/* Overview tab - shows pending items needing action */}
        <TabsContent value="overview" className="space-y-6 mt-4">
          {/* Pending properties */}
          <div>
            <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-amber-500" />
              Pending Property Approvals ({pendingProperties})
            </h3>
            {properties.filter(p => p.status === 'pending').length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-100 p-6 text-center text-slate-400 text-sm">No pending properties</div>
            ) : (
              <div className="space-y-3">
                {properties.filter(p => p.status === 'pending').map(p => (
                  <div key={p.id} className="bg-white rounded-xl border border-amber-100 p-4 flex items-center gap-4">
                    <img src={p.images?.[0] || 'https://via.placeholder.com/80'} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 truncate">{p.title}</p>
                      <p className="text-sm text-slate-500">{p.city}, Haryana · {p.host_name} · {formatCurrency(p.monthly_rent)}/mo</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => updatePropertyStatus(p.id, 'active')} className="bg-emerald-500 hover:bg-emerald-600 text-white gap-1">
                        <CheckCircle className="w-3 h-3" /> Approve
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => updatePropertyStatus(p.id, 'rejected')} className="border-red-200 text-red-500 hover:bg-red-50 gap-1">
                        <XCircle className="w-3 h-3" /> Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pending bookings */}
          <div>
            <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-500" />
              Pending Booking Requests ({pendingBookings})
            </h3>
            {bookings.filter(b => b.status === 'pending').length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-100 p-6 text-center text-slate-400 text-sm">No pending bookings</div>
            ) : (
              <div className="space-y-3">
                {bookings.filter(b => b.status === 'pending').map(b => (
                  <div key={b.id} className="bg-white rounded-xl border border-amber-100 p-4 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 truncate">{b.property_title}</p>
                      <p className="text-sm text-slate-500">
                        {b.renter_name} → {b.host_name} · {b.lease_months} months · {formatCurrency(b.total_amount)}
                      </p>
                      <p className="text-xs text-slate-400">{b.start_date} to {b.end_date}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => updateBookingStatus(b.id, 'approved')} className="bg-emerald-500 hover:bg-emerald-600 text-white gap-1">
                        <CheckCircle className="w-3 h-3" /> Approve
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => updateBookingStatus(b.id, 'rejected')} className="border-red-200 text-red-500 hover:bg-red-50 gap-1">
                        <XCircle className="w-3 h-3" /> Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Properties tab */}
        <TabsContent value="properties" className="space-y-3 mt-4">
          {properties.length === 0 && <p className="text-slate-400 text-center py-12">No properties yet</p>}
          {properties.map(p => (
            <div key={p.id} className="bg-white rounded-xl border border-slate-100 p-4 flex items-center gap-4">
              <img src={p.images?.[0] || 'https://via.placeholder.com/80'} className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 truncate">{p.title}</p>
                <p className="text-sm text-slate-500">{p.city}, Haryana · {p.host_name} · {formatCurrency(p.monthly_rent)}/mo</p>
              </div>
              <Badge className={`${STATUS_COLORS[p.status] || STATUS_COLORS.pending} text-xs`}>{p.status}</Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm"><MoreVertical className="w-4 h-4" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => navigate(`/property/${p.id}`)}><Eye className="w-4 h-4 mr-2" />View</DropdownMenuItem>
                  {p.status !== 'active' && <DropdownMenuItem onClick={() => updatePropertyStatus(p.id, 'active')}><CheckCircle className="w-4 h-4 mr-2 text-emerald-500" />Approve</DropdownMenuItem>}
                  {p.status !== 'rejected' && <DropdownMenuItem onClick={() => updatePropertyStatus(p.id, 'rejected')}><XCircle className="w-4 h-4 mr-2 text-red-500" />Reject</DropdownMenuItem>}
                  {p.status !== 'inactive' && <DropdownMenuItem onClick={() => updatePropertyStatus(p.id, 'inactive')}><XCircle className="w-4 h-4 mr-2 text-slate-400" />Deactivate</DropdownMenuItem>}
                  <DropdownMenuItem onClick={() => deleteProperty(p.id)} className="text-red-600"><Trash2 className="w-4 h-4 mr-2" />Delete</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </TabsContent>

        {/* Bookings tab */}
        <TabsContent value="bookings" className="space-y-3 mt-4">
          {bookings.length === 0 && <p className="text-slate-400 text-center py-12">No bookings yet</p>}
          {bookings.map(b => (
            <div key={b.id} className="bg-white rounded-xl border border-slate-100 p-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 truncate">{b.property_title}</p>
                <p className="text-sm text-slate-500">
                  <span className="font-medium text-slate-700">{b.renter_name}</span> → {b.host_name} · {b.lease_months} months · {formatCurrency(b.total_amount)}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">{b.start_date} → {b.end_date}</p>
                {b.message && <p className="text-xs text-slate-500 mt-1 italic">"{b.message}"</p>}
              </div>
              <Badge className={`${STATUS_COLORS[b.status] || STATUS_COLORS.pending} text-xs flex-shrink-0`}>{b.status}</Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm"><MoreVertical className="w-4 h-4" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {b.status === 'pending' && <>
                    <DropdownMenuItem onClick={() => updateBookingStatus(b.id, 'approved')}><CheckCircle className="w-4 h-4 mr-2 text-emerald-500" />Approve</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => updateBookingStatus(b.id, 'rejected')}><XCircle className="w-4 h-4 mr-2 text-red-500" />Reject</DropdownMenuItem>
                  </>}
                  {b.status === 'approved' && <DropdownMenuItem onClick={() => updateBookingStatus(b.id, 'active')}><CheckCircle className="w-4 h-4 mr-2 text-blue-500" />Mark Active</DropdownMenuItem>}
                  {b.status === 'active' && <DropdownMenuItem onClick={() => updateBookingStatus(b.id, 'completed')}><CheckCircle className="w-4 h-4 mr-2 text-slate-500" />Mark Completed</DropdownMenuItem>}
                  {(b.status === 'pending' || b.status === 'approved' || b.status === 'active') && (
                    <DropdownMenuItem onClick={() => updateBookingStatus(b.id, 'cancelled')} className="text-red-500"><XCircle className="w-4 h-4 mr-2" />Cancel</DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => deleteBooking(b.id)} className="text-red-600"><Trash2 className="w-4 h-4 mr-2" />Delete</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </TabsContent>

        {/* Users tab */}
        <TabsContent value="users" className="space-y-3 mt-4">
          {users.length === 0 && <p className="text-slate-400 text-center py-12">No users yet</p>}
          {users.map(u => (
            <div key={u.id} className="bg-white rounded-xl border border-slate-100 p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-sm flex-shrink-0">
                {u.photo ? <img src={u.photo} className="w-10 h-10 rounded-full object-cover" /> : (u.full_name?.[0] || '?')}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900">{u.full_name || 'No name'}</p>
                <p className="text-sm text-slate-500">{u.email} · {u.city || 'No city'}</p>
              </div>
              <Badge className={`text-xs ${u.role === 'admin' ? 'bg-purple-100 text-purple-800' : u.role === 'host' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-600'}`}>
                {u.role}
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm"><MoreVertical className="w-4 h-4" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {u.role !== 'admin' && <DropdownMenuItem onClick={() => updateUserRole(u.id, 'admin')}><Shield className="w-4 h-4 mr-2 text-purple-500" />Make Admin</DropdownMenuItem>}
                  {u.role !== 'host' && <DropdownMenuItem onClick={() => updateUserRole(u.id, 'host')}><Building2 className="w-4 h-4 mr-2 text-blue-500" />Make Host</DropdownMenuItem>}
                  {u.role !== 'renter' && <DropdownMenuItem onClick={() => updateUserRole(u.id, 'renter')}><Users className="w-4 h-4 mr-2 text-slate-500" />Make Renter</DropdownMenuItem>}
                  {u.id !== profile?.id && (
                    <DropdownMenuItem onClick={() => deleteUser(u.id)} className="text-red-600"><Trash2 className="w-4 h-4 mr-2" />Delete User</DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </TabsContent>
      </Tabs>

      {/* Add Admin Dialog */}
      <Dialog open={showAddAdmin} onOpenChange={setShowAddAdmin}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add New Admin</DialogTitle></DialogHeader>
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
              <Input type="password" placeholder="Min 6 characters" value={newAdmin.password} onChange={e => setNewAdmin(p => ({ ...p, password: e.target.value }))} className="mt-1" />
            </div>
            <p className="text-xs text-slate-400">Note: If the user already has an account, they'll be promoted to admin. Otherwise, ask them to register first then promote from the Users tab.</p>
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
