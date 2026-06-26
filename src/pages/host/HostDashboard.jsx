import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Plus, Building2, DollarSign, Users, Eye, MoreVertical, CheckCircle, XCircle, Clock, Trash2, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { formatCurrency } from '@/lib/constants';
import { generateRentalAgreementPDF } from '@/lib/generateRentalAgreement';
import { useToast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-red-100 text-red-800',
  active: 'bg-blue-100 text-blue-800',
  completed: 'bg-slate-100 text-slate-800',
  cancelled: 'bg-red-100 text-red-800',
};

export default function HostDashboard() {
  const { user } = useOutletContext();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [listings, setListings] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [props, books] = await Promise.all([
        base44.entities.Property.filter({ host_id: user.id }, '-created_date'),
        base44.entities.Booking.filter({ host_id: user.id }, '-created_date'),
      ]);
      setListings(props);
      setBookings(books);
      setLoading(false);
    };
    load();
  }, [user]);

  const handleBookingAction = async (booking, status) => {
    await base44.entities.Booking.update(booking.id, { status });
    setBookings(prev => prev.map(b => b.id === booking.id ? { ...b, status } : b));
    toast({ title: `Booking ${status}` });
  };

  const handleDeleteListing = async (id) => {
    await base44.entities.Property.delete(id);
    setListings(prev => prev.filter(p => p.id !== id));
    toast({ title: 'Listing deleted' });
  };

  const totalEarnings = bookings.filter(b => b.status === 'active' || b.status === 'completed' || b.status === 'approved').reduce((sum, b) => sum + (b.total_amount || 0), 0);
  const activeListings = listings.filter(p => p.status === 'active').length;
  const pendingBookings = bookings.filter(b => b.status === 'pending').length;

  if (loading) {
    return <div className="max-w-7xl mx-auto px-4 py-8"><div className="animate-pulse space-y-6"><div className="h-32 bg-slate-200 rounded-2xl" /><div className="h-64 bg-slate-200 rounded-2xl" /></div></div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-heading font-bold text-slate-900">Host Dashboard</h1>
          <p className="text-slate-500 mt-1">Manage your properties and bookings</p>
        </div>
        <Button onClick={() => navigate('/host/create-listing')} className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold rounded-xl">
          <Plus className="w-4 h-4 mr-2" /> New Listing
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { icon: Building2, label: 'Active Listings', value: activeListings, color: 'bg-blue-50 text-blue-600' },
          { icon: Users, label: 'Pending Requests', value: pendingBookings, color: 'bg-amber-50 text-amber-600' },
          { icon: DollarSign, label: 'Total Earnings', value: formatCurrency(totalEarnings), color: 'bg-emerald-50 text-emerald-600' },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-2xl p-5 border border-slate-100">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${stat.color}`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <p className="text-sm text-slate-500">{stat.label}</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <Tabs defaultValue="listings">
        <TabsList className="bg-slate-100 rounded-xl p-1 mb-6">
          <TabsTrigger value="listings" className="rounded-lg">Listings ({listings.length})</TabsTrigger>
          <TabsTrigger value="bookings" className="rounded-lg">Bookings ({bookings.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="listings">
          {listings.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
              <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="font-semibold text-slate-600">No listings yet</h3>
              <Button onClick={() => navigate('/host/create-listing')} className="mt-4 bg-amber-500 hover:bg-amber-600 text-slate-900 rounded-xl">
                Create your first listing
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {listings.map(p => (
                <motion.div key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-xl p-4 border border-slate-100 flex items-center gap-4">
                  <img src={p.images?.[0] || 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=100&h=100&fit=crop'} alt="" className="w-16 h-16 rounded-lg object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-slate-900 truncate">{p.title}</h3>
                    <p className="text-sm text-slate-500">{p.city}, {p.country} · {formatCurrency(p.monthly_rent, p.currency)}/mo</p>
                  </div>
                  <Badge className={STATUS_COLORS[p.status]}>{p.status}</Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><button className="p-2 hover:bg-slate-100 rounded-lg"><MoreVertical className="w-4 h-4" /></button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => navigate(`/property/${p.id}`)}><Eye className="w-4 h-4 mr-2" />View</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeleteListing(p.id)} className="text-red-600"><Trash2 className="w-4 h-4 mr-2" />Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="bookings">
          {bookings.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
              <Clock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="font-semibold text-slate-600">No booking requests yet</h3>
            </div>
          ) : (
            <div className="space-y-3">
              {bookings.map(b => (
                <motion.div key={b.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-xl p-5 border border-slate-100">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-medium text-slate-900">{b.property_title}</h3>
                      <p className="text-sm text-slate-500 mt-1">By {b.renter_name} · {b.lease_months} months · {formatCurrency(b.total_amount, b.currency)} total</p>
                      <p className="text-sm text-slate-400 mt-0.5">{b.start_date} → {b.end_date}</p>
                      {b.message && <p className="text-sm text-slate-600 mt-2 bg-slate-50 rounded-lg p-3">"{b.message}"</p>}
                    </div>
                    <Badge className={STATUS_COLORS[b.status]}>{b.status}</Badge>
                  </div>
                  <div className="flex gap-2 mt-4 flex-wrap">
                    {b.status === 'pending' && (
                      <>
                        <Button size="sm" onClick={() => handleBookingAction(b, 'approved')} className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg">
                          <CheckCircle className="w-4 h-4 mr-1" /> Approve
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleBookingAction(b, 'rejected')} className="text-red-600 border-red-200 hover:bg-red-50 rounded-lg">
                          <XCircle className="w-4 h-4 mr-1" /> Reject
                        </Button>
                      </>
                    )}
                    {(b.status === 'approved' || b.status === 'active' || b.status === 'completed') && (
                      <Button size="sm" variant="outline" onClick={() => generateRentalAgreementPDF(b)} className="rounded-lg border-slate-200">
                        <FileDown className="w-4 h-4 mr-1" /> Download Agreement
                      </Button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}