import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext, Link } from 'react-router-dom';
import { Calendar, Clock, Star, FileDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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

export default function MyBookings() {
  const { user, profile } = useOutletContext();
  const { toast } = useToast();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewOpen, setReviewOpen] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    base44.entities.Booking.filter({ renter_id: user.id }, '-created_date').then(b => { setBookings(b); setLoading(false); });
  }, [user]);

  const handleReview = async (booking) => {
    setSubmitting(true);
    await base44.entities.Review.create({
      property_id: booking.property_id,
      booking_id: booking.id,
      reviewer_id: user.id,
      reviewer_name: profile?.full_name || user.full_name,
      host_id: booking.host_id,
      rating,
      comment,
    });
    setReviewOpen(null);
    setComment('');
    setRating(5);
    setSubmitting(false);
    toast({ title: 'Review submitted!' });
  };

  const cancelBooking = async (id) => {
    await base44.entities.Booking.update(id, { status: 'cancelled' });
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'cancelled' } : b));
    toast({ title: 'Booking cancelled' });
  };

  if (loading) return <div className="max-w-4xl mx-auto px-4 py-8"><div className="animate-pulse space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-28 bg-slate-200 rounded-2xl" />)}</div></div>;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-heading font-bold text-slate-900 mb-6">My Bookings</h1>
      {bookings.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="font-semibold text-slate-600">No bookings yet</h3>
          <p className="text-slate-400 mt-1">Start exploring properties to make your first booking</p>
          <Link to="/search"><Button className="mt-4 bg-amber-500 hover:bg-amber-600 text-slate-900 rounded-xl">Browse Properties</Button></Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map(b => (
            <motion.div key={b.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl p-5 border border-slate-100 flex flex-col sm:flex-row gap-4">
              <Link to={`/property/${b.property_id}`}>
                <img src={b.property_image || 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=120&h=120&fit=crop'} alt="" className="w-full sm:w-24 h-32 sm:h-24 rounded-lg object-cover" />
              </Link>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <Link to={`/property/${b.property_id}`} className="font-medium text-slate-900 hover:underline">{b.property_title}</Link>
                    <p className="text-sm text-slate-500 mt-1">{b.lease_months} months · {formatCurrency(b.total_amount, b.currency)} total</p>
                    <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1"><Clock className="w-3 h-3" />{b.start_date} → {b.end_date}</p>
                  </div>
                  <Badge className={STATUS_COLORS[b.status]}>{b.status}</Badge>
                </div>
                <div className="flex gap-2 mt-3 flex-wrap">
                  {b.status === 'pending' && <Button size="sm" variant="outline" onClick={() => cancelBooking(b.id)} className="text-red-600 border-red-200 rounded-lg text-xs">Cancel</Button>}
                  {(b.status === 'approved' || b.status === 'active' || b.status === 'completed') && (
                    <Button size="sm" variant="outline" onClick={() => generateRentalAgreementPDF(b)} className="rounded-lg text-xs border-slate-200">
                      <FileDown className="w-3 h-3 mr-1" /> Download Agreement
                    </Button>
                  )}
                  {(b.status === 'completed' || b.status === 'active') && (
                    <Dialog open={reviewOpen === b.id} onOpenChange={(open) => setReviewOpen(open ? b.id : null)}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" className="rounded-lg text-xs"><Star className="w-3 h-3 mr-1" />Review</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Leave a Review</DialogTitle></DialogHeader>
                        <div className="space-y-4 mt-4">
                          <div>
                            <label className="block text-sm font-medium mb-2">Rating</label>
                            <div className="flex gap-1">
                              {[1, 2, 3, 4, 5].map(s => (
                                <button key={s} onClick={() => setRating(s)}>
                                  <Star className={`w-7 h-7 ${s <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
                                </button>
                              ))}
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Comment</label>
                            <Textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} placeholder="How was your experience?" />
                          </div>
                          <Button onClick={() => handleReview(b)} disabled={!comment.trim() || submitting} className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 rounded-xl">
                            {submitting ? 'Submitting...' : 'Submit Review'}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}