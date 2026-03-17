import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Shield, Camera } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface UserRole {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
}

const UsersManager: React.FC = () => {
  const [users, setUsers] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from('user_roles').select('*').order('created_at', { ascending: false });
      if (data) setUsers(data);
      setLoading(false);
    };
    fetch();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground">Users</h1>
        <p className="text-muted-foreground">All registered platform users</p>
      </div>

      <div className="space-y-3">
        {loading ? (
          <p className="text-muted-foreground">Loading users...</p>
        ) : users.length === 0 ? (
          <div className="admin-card text-center py-12">
            <Users className="mx-auto text-muted-foreground mb-3" size={48} />
            <p className="text-muted-foreground">No users found</p>
          </div>
        ) : (
          users.map((u, i) => (
            <motion.div key={u.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }} className="admin-card flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  {u.role === 'super_admin' ? <Shield size={18} className="text-primary" /> : <Camera size={18} className="text-primary" />}
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm font-mono">{u.user_id.slice(0, 8)}...</p>
                  <p className="text-xs text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              <span className={`px-3 py-1 text-xs rounded-full font-medium ${
                u.role === 'super_admin' ? 'bg-primary/20 text-primary' : 'bg-accent text-accent-foreground'
              }`}>
                {u.role === 'super_admin' ? 'Super Admin' : 'Studio Admin'}
              </span>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default UsersManager;
