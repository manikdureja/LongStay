import React, { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Send, MessageSquare, ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';

export default function Messages() {
  const { user, profile } = useOutletContext();
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const allMessages = await base44.entities.Message.filter({ sender_id: user.id }, '-created_date', 50);
      const received = await base44.entities.Message.filter({ receiver_id: user.id }, '-created_date', 50);
      const combined = [...allMessages, ...received];
      const convMap = {};
      combined.forEach(m => {
        if (!convMap[m.conversation_id]) {
          convMap[m.conversation_id] = {
            id: m.conversation_id,
            otherName: m.sender_id === user.id ? (m.receiver_name || 'User') : m.sender_name,
            otherId: m.sender_id === user.id ? m.receiver_id : m.sender_id,
            propertyTitle: m.property_title,
            lastMessage: m.content,
            lastDate: m.created_date,
          };
        }
      });
      setConversations(Object.values(convMap).sort((a, b) => new Date(b.lastDate) - new Date(a.lastDate)));
      setLoading(false);
    };
    load();
  }, [user]);

  const loadMessages = async (convId) => {
    setActiveConv(convId);
    const sent = await base44.entities.Message.filter({ conversation_id: convId, sender_id: user.id }, 'created_date');
    const recv = await base44.entities.Message.filter({ conversation_id: convId, receiver_id: user.id }, 'created_date');
    const all = [...sent, ...recv].sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
    setMessages(all);
    setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMsg.trim() || !activeConv) return;
    setSending(true);
    const conv = conversations.find(c => c.id === activeConv);
    const msg = await base44.entities.Message.create({
      conversation_id: activeConv,
      sender_id: user.id,
      sender_name: profile?.full_name || user.full_name,
      receiver_id: conv.otherId,
      content: newMsg.trim(),
    });
    setMessages(prev => [...prev, msg]);
    setNewMsg('');
    setSending(false);
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (loading) {
    return <div className="max-w-5xl mx-auto px-4 py-8"><div className="animate-pulse h-96 bg-slate-200 rounded-2xl" /></div>;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
      <h1 className="text-2xl font-heading font-bold text-slate-900 mb-6">Messages</h1>
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden" style={{ height: '70vh' }}>
        <div className="flex h-full">
          {/* Conversation List */}
          <div className={`${activeConv ? 'hidden md:block' : ''} w-full md:w-80 border-r border-slate-200 overflow-y-auto`}>
            {conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-6">
                <MessageSquare className="w-10 h-10 text-slate-300 mb-3" />
                <p className="text-slate-500 text-sm">No messages yet</p>
              </div>
            ) : (
              conversations.map(c => (
                <button
                  key={c.id}
                  onClick={() => loadMessages(c.id)}
                  className={`w-full text-left px-4 py-4 border-b border-slate-100 hover:bg-slate-50 transition-colors ${activeConv === c.id ? 'bg-slate-50' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10 shrink-0">
                      <AvatarFallback className="bg-slate-200 text-sm">{c.otherName?.[0]}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-slate-900 truncate">{c.otherName}</p>
                      {c.propertyTitle && <p className="text-xs text-amber-600 truncate">{c.propertyTitle}</p>}
                      <p className="text-xs text-slate-400 truncate mt-0.5">{c.lastMessage}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Chat Area */}
          <div className={`${!activeConv ? 'hidden md:flex' : 'flex'} flex-1 flex-col`}>
            {!activeConv ? (
              <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
                Select a conversation
              </div>
            ) : (
              <>
                <div className="px-4 py-3 border-b border-slate-200 flex items-center gap-3">
                  <button onClick={() => setActiveConv(null)} className="md:hidden"><ArrowLeft className="w-5 h-5" /></button>
                  <p className="font-medium text-sm">{conversations.find(c => c.id === activeConv)?.otherName}</p>
                </div>
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                  {messages.map(m => (
                    <div key={m.id} className={`flex ${m.sender_id === user.id ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                        m.sender_id === user.id ? 'bg-slate-900 text-white rounded-br-md' : 'bg-slate-100 text-slate-900 rounded-bl-md'
                      }`}>
                        {m.content}
                      </div>
                    </div>
                  ))}
                  <div ref={endRef} />
                </div>
                <form onSubmit={sendMessage} className="px-4 py-3 border-t border-slate-200 flex gap-2">
                  <Input value={newMsg} onChange={(e) => setNewMsg(e.target.value)} placeholder="Type a message..." className="flex-1 h-11 rounded-xl" />
                  <Button type="submit" disabled={!newMsg.trim() || sending} className="h-11 w-11 p-0 bg-slate-900 hover:bg-slate-800 rounded-xl">
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}