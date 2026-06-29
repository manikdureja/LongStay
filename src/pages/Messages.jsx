import React, { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Send, MessageCircle, Search } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function Messages() {
  const { user, profile } = useOutletContext();
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    loadConversations();
  }, [user]);

  useEffect(() => {
    if (!activeConv) return;
    loadMessages(activeConv);

    // Real-time subscription
    const channel = supabase
      .channel(`messages-${activeConv}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${user.id}`,
      }, (payload) => {
        if (payload.new.sender_id === activeConv || payload.new.receiver_id === activeConv) {
          setMessages(prev => [...prev, payload.new]);
          setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        }
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [activeConv]);

  const loadConversations = async () => {
    if (!user) return;
    const { data: sent } = await supabase.from('messages').select('receiver_id').eq('sender_id', user.id);
    const { data: received } = await supabase.from('messages').select('sender_id').eq('receiver_id', user.id);
    
    const partnerIds = [...new Set([
      ...(sent || []).map(m => m.receiver_id),
      ...(received || []).map(m => m.sender_id),
    ])].filter(id => id !== user.id);

    if (partnerIds.length === 0) { setConversations([]); return; }

    const { data: partners } = await supabase.from('profiles').select('id, full_name, photo, role').in('id', partnerIds);
    
    const convs = await Promise.all((partners || []).map(async (p) => {
      const { data: lastMsg } = await supabase.from('messages')
        .select('content, created_at')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${p.id}),and(sender_id.eq.${p.id},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      return { ...p, lastMessage: lastMsg?.content, lastTime: lastMsg?.created_at };
    }));

    setConversations(convs.sort((a, b) => new Date(b.lastTime) - new Date(a.lastTime)));
  };

  const loadMessages = async (partnerId) => {
    const { data } = await supabase.from('messages')
      .select('*')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: true });
    setMessages(data || []);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);

    // Mark as read
    await supabase.from('messages')
      .update({ read: true })
      .eq('sender_id', partnerId)
      .eq('receiver_id', user.id)
      .eq('read', false);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConv) return;
    setSending(true);
    const msg = {
      sender_id: user.id,
      receiver_id: activeConv,
      content: newMessage.trim(),
      read: false,
    };
    const { data } = await supabase.from('messages').insert(msg).select().single();
    if (data) {
      setMessages(prev => [...prev, data]);
      setNewMessage('');
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      loadConversations();
    }
    setSending(false);
  };

  const activePartner = conversations.find(c => c.id === activeConv);
  const filtered = conversations.filter(c => c.full_name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Messages</h1>
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden flex" style={{ height: '70vh' }}>
        
        {/* Sidebar */}
        <div className="w-80 border-r border-slate-100 flex flex-col flex-shrink-0">
          <div className="p-3 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search conversations..." className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <MessageCircle className="w-10 h-10 text-slate-200 mb-3" />
                <p className="text-slate-400 text-sm">No conversations yet</p>
                <p className="text-slate-300 text-xs mt-1">Message a host from any property page</p>
              </div>
            ) : filtered.map(conv => (
              <button key={conv.id} onClick={() => setActiveConv(conv.id)}
                className={`w-full flex items-center gap-3 p-4 text-left hover:bg-slate-50 transition-colors border-b border-slate-50 ${activeConv === conv.id ? 'bg-amber-50' : ''}`}>
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-semibold text-sm flex-shrink-0">
                  {conv.photo ? <img src={conv.photo} className="w-10 h-10 rounded-full object-cover" /> : conv.full_name?.[0] || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm text-slate-900 truncate">{conv.full_name}</p>
                    {conv.lastTime && <span className="text-xs text-slate-400 flex-shrink-0 ml-1">{formatDistanceToNow(new Date(conv.lastTime), { addSuffix: false })}</span>}
                  </div>
                  <p className="text-xs text-slate-500 truncate mt-0.5">{conv.lastMessage || 'No messages yet'}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat area */}
        {activeConv ? (
          <div className="flex-1 flex flex-col">
            <div className="p-4 border-b border-slate-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-semibold text-sm">
                {activePartner?.photo ? <img src={activePartner.photo} className="w-9 h-9 rounded-full object-cover" /> : activePartner?.full_name?.[0]}
              </div>
              <div>
                <p className="font-semibold text-slate-900 text-sm">{activePartner?.full_name}</p>
                <p className="text-xs text-slate-400 capitalize">{activePartner?.role}</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map(msg => {
                const isMe = msg.sender_id === user.id;
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm ${isMe ? 'bg-amber-500 text-white rounded-br-sm' : 'bg-slate-100 text-slate-900 rounded-bl-sm'}`}>
                      <p className="leading-relaxed">{msg.content}</p>
                      <p className={`text-xs mt-1 ${isMe ? 'text-amber-100' : 'text-slate-400'}`}>
                        {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            <form onSubmit={sendMessage} className="p-4 border-t border-slate-100 flex gap-3">
              <input value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Type a message..." className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
              <button type="submit" disabled={sending || !newMessage.trim()} className="bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white px-4 py-2.5 rounded-xl transition-colors">
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <MessageCircle className="w-14 h-14 text-slate-200 mb-4" />
            <p className="text-slate-400 font-medium">Select a conversation</p>
            <p className="text-slate-300 text-sm mt-1">Choose from your conversations on the left</p>
          </div>
        )}
      </div>
    </div>
  );
}
