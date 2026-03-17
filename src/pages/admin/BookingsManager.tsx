import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Phone, Mail, MapPin, Eye, CheckCircle, Clock, XCircle, Filter, Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Booking } from '@/types/database';

const statusColors = {
  pending: 'bg-yellow-500/20 text-yellow-500',
  confirmed: 'bg-blue-500/20 text-blue-500',
  completed: 'bg-green-500/20 text-green-500',
  cancelled: 'bg-red-500/20 text-red-500',
};

const statusIcons = {
  pending: Clock,
  confirmed: CheckCircle,
  completed: CheckCircle,
  cancelled: XCircle,
};

const BookingsManager: React.FC = () => {
  const { studio } = useAuth();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (studio?.id) {
      fetchBookings();
    }
  }, [studio?.id]);

  const fetchBookings = async () => {
    if (!studio?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('studio_id', studio.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookings((data || []) as Booking[]);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast({ title: 'Error', description: 'Failed to load bookings', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: Booking['status']) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
      toast({ title: 'Success', description: `Booking ${status}` });
      fetchBookings();
      if (selectedBooking?.id === id) {
        setSelectedBooking({ ...selectedBooking, status });
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' });
    }
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesFilter = filter === 'all' || booking.status === filter;
    const matchesSearch = search === '' || 
      booking.name.toLowerCase().includes(search.toLowerCase()) ||
      booking.phone.includes(search) ||
      booking.email?.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Bookings</h1>
          <p className="text-muted-foreground">Manage client booking requests</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search..."
              className="pl-10 w-64"
            />
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-40">
              <Filter size={16} className="mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredBookings.length === 0 ? (
          <div className="text-center py-12 bg-muted/50 rounded-xl">
            <Calendar className="mx-auto text-muted-foreground mb-4" size={48} />
            <h3 className="font-semibold mb-2">No bookings found</h3>
            <p className="text-muted-foreground">
              {filter !== 'all' ? 'Try changing the filter' : 'Bookings will appear here'}
            </p>
          </div>
        ) : (
          filteredBookings.map((booking, index) => {
            const StatusIcon = statusIcons[booking.status];
            return (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-4 bg-card border border-border rounded-lg hover:border-primary/30 transition-colors"
              >
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{booking.name}</h3>
                      <Badge className={statusColors[booking.status]}>
                        <StatusIcon size={12} className="mr-1" />
                        {booking.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Phone size={14} />
                        {booking.phone}
                      </div>
                      {booking.email && (
                        <div className="flex items-center gap-2">
                          <Mail size={14} />
                          {booking.email}
                        </div>
                      )}
                      {booking.event_type && (
                        <div className="flex items-center gap-2">
                          <Calendar size={14} />
                          {booking.event_type}
                        </div>
                      )}
                      {booking.location && (
                        <div className="flex items-center gap-2">
                          <MapPin size={14} />
                          {booking.location}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setSelectedBooking(booking)}>
                      <Eye size={14} className="mr-2" />
                      View
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Booking Detail Dialog */}
      <Dialog open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4 py-4">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-lg">{selectedBooking.name}</span>
                <Badge className={statusColors[selectedBooking.status]}>
                  {selectedBooking.status}
                </Badge>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <Phone size={16} className="text-muted-foreground" />
                  <a href={`tel:${selectedBooking.phone}`} className="text-primary">
                    {selectedBooking.phone}
                  </a>
                </div>
                {selectedBooking.email && (
                  <div className="flex items-center gap-3">
                    <Mail size={16} className="text-muted-foreground" />
                    <a href={`mailto:${selectedBooking.email}`} className="text-primary">
                      {selectedBooking.email}
                    </a>
                  </div>
                )}
                {selectedBooking.event_type && (
                  <div className="flex items-center gap-3">
                    <Calendar size={16} className="text-muted-foreground" />
                    <span>{selectedBooking.event_type}</span>
                  </div>
                )}
                {selectedBooking.event_dates && (selectedBooking.event_dates as string[]).length > 0 && (
                  <div className="flex items-start gap-3">
                    <Calendar size={16} className="text-muted-foreground mt-0.5" />
                    <span>{(selectedBooking.event_dates as string[]).join(', ')}</span>
                  </div>
                )}
                {selectedBooking.location && (
                  <div className="flex items-center gap-3">
                    <MapPin size={16} className="text-muted-foreground" />
                    <span>{selectedBooking.location}</span>
                  </div>
                )}
              </div>

              {selectedBooking.services_required && (selectedBooking.services_required as string[]).length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Services Required:</p>
                  <div className="flex flex-wrap gap-2">
                    {(selectedBooking.services_required as string[]).map((service, i) => (
                      <Badge key={i} variant="outline">{service}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedBooking.notes && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Notes:</p>
                  <p className="text-sm bg-muted p-3 rounded-lg">{selectedBooking.notes}</p>
                </div>
              )}

              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-3">Update Status:</p>
                <div className="flex flex-wrap gap-2">
                  {(['pending', 'confirmed', 'completed', 'cancelled'] as const).map(status => (
                    <Button
                      key={status}
                      size="sm"
                      variant={selectedBooking.status === status ? 'default' : 'outline'}
                      onClick={() => updateStatus(selectedBooking.id, status)}
                      className="capitalize"
                    >
                      {status}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="text-xs text-muted-foreground">
                Submitted: {new Date(selectedBooking.created_at).toLocaleString()}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BookingsManager;
