import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Phone, MessageCircle, Trash2, Download, Filter } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';

interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  created_at: string;
  program_album_id: string;
  album_name?: string;
}

const LeadsManager: React.FC = () => {
  const { studio } = useAuth();
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [albums, setAlbums] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterAlbum, setFilterAlbum] = useState('all');
  const [sortField, setSortField] = useState<'created_at' | 'name'>('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    if (studio?.id) {
      fetchLeads();
      fetchAlbums();
    }
  }, [studio?.id]);

  const fetchAlbums = async () => {
    if (!studio?.id) return;
    const { data } = await supabase
      .from('program_albums')
      .select('id, name')
      .eq('studio_id', studio.id)
      .order('name');
    if (data) setAlbums(data);
  };

  const fetchLeads = async () => {
    if (!studio?.id) return;
    try {
      const { data, error } = await supabase
        .from('album_leads')
        .select('*, program_albums(name)')
        .eq('studio_id', studio.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeads(
        (data || []).map((l: any) => ({
          ...l,
          album_name: l.program_albums?.name || 'Unknown',
        }))
      );
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this lead?')) return;
    try {
      const { error } = await supabase.from('album_leads').delete().eq('id', id);
      if (error) throw error;
      setLeads(leads.filter(l => l.id !== id));
      toast({ title: 'Lead deleted' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' });
    }
  };

  const exportCSV = () => {
    const filtered = getFilteredLeads();
    const csv = [
      'Name,Phone,Email,Album,Date',
      ...filtered.map(l =>
        `"${l.name}","${l.phone}","${l.email || ''}","${l.album_name || ''}","${new Date(l.created_at).toLocaleDateString()}"`
      ),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'CSV exported!' });
  };

  const getFilteredLeads = () => {
    let filtered = leads;
    if (filterAlbum !== 'all') {
      filtered = filtered.filter(l => l.program_album_id === filterAlbum);
    }
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(
        l => l.name.toLowerCase().includes(s) || l.phone.includes(s) || (l.email && l.email.toLowerCase().includes(s))
      );
    }
    filtered.sort((a, b) => {
      const valA = sortField === 'name' ? a.name : a.created_at;
      const valB = sortField === 'name' ? b.name : b.created_at;
      return sortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    });
    return filtered;
  };

  const filteredLeads = getFilteredLeads();

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-12 bg-muted rounded-lg" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Leads Manager</h1>
          <p className="text-muted-foreground">{filteredLeads.length} leads total</p>
        </div>
        <Button onClick={exportCSV} variant="outline">
          <Download size={16} className="mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, phone, email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterAlbum} onValueChange={setFilterAlbum}>
          <SelectTrigger className="w-[200px]">
            <Filter size={14} className="mr-2" />
            <SelectValue placeholder="Filter by album" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Albums</SelectItem>
            {albums.map(a => (
              <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={`${sortField}-${sortDir}`} onValueChange={v => {
          const [f, d] = v.split('-');
          setSortField(f as any);
          setSortDir(d as any);
        }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created_at-desc">Newest First</SelectItem>
            <SelectItem value="created_at-asc">Oldest First</SelectItem>
            <SelectItem value="name-asc">Name A-Z</SelectItem>
            <SelectItem value="name-desc">Name Z-A</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {filteredLeads.length === 0 ? (
        <div className="text-center py-20 bg-muted/50 rounded-xl">
          <p className="text-muted-foreground">No leads found</p>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Album</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads.map((lead, i) => (
                <motion.tr
                  key={lead.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className="border-b border-border"
                >
                  <TableCell className="font-medium">{lead.name}</TableCell>
                  <TableCell>{lead.phone}</TableCell>
                  <TableCell>{lead.email || '-'}</TableCell>
                  <TableCell className="text-muted-foreground">{lead.album_name}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(lead.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <a href={`tel:${lead.phone}`}>
                        <Button size="icon" variant="ghost" className="h-8 w-8">
                          <Phone size={14} />
                        </Button>
                      </a>
                      <a href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer">
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-green-500">
                          <MessageCircle size={14} />
                        </Button>
                      </a>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleDelete(lead.id)}>
                        <Trash2 size={14} className="text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default LeadsManager;
