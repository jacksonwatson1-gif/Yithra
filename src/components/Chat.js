import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { parseTransaction, hasApiKey } from '../lib/ai-engine';
import { insertTransaction, getCategoryByName, saveChatMessage } from '../lib/database';

function LoadingDots() {
  return (<div className="loading-dots"><span /><span /><span /></div>);
}

function TransactionBubble({ txn }) {
  return (
    <div className="transaction-card">
      <div className="txn-row">
        <span className="txn-merchant">{txn.merchant || txn.description}</span>
        <span className={'txn-amount ' + txn.type}>{txn.type === 'expense' ? '-' : '+'}{Number(txn.amount).toFixed(2)}</span>
      </div>
      <div className="txn-category">{txn.category}</div>
    </div>
  );
}

export default function Chat({ userId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const greeting = hasApiKey()
      ? "Hey! I'm Yithra. Tell me what you spent today \u2014 just say it naturally, like \"12 lunch\" or \"spent 40 at Target.\" I'll handle the rest."
      : "Hey! I'm Yithra. Before we start, go to Settings and add your Anthropic API key so I can process your spending.";
    setMessages([{ role: 'assistant', content: greeting, type: 'text' }]);
  }, []);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: text, type: 'text' }]);
    setLoading(true);
    try {
      await saveChatMessage(userId, 'user', text);
      const result = await parseTransaction(text);
      if (result.is_transaction && result.transactions) {
        const savedTxns = [];
        for (const txn of result.transactions) {
          const cat = await getCategoryByName(txn.category);
          const saved = await insertTransaction(userId, {
            amount: txn.amount, type: txn.type, category_id: cat?.id || null,
            merchant: txn.merchant, description: txn.description, source: 'chat',
            raw_input: text, transaction_date: new Date().toISOString().split('T')[0]
          });
          savedTxns.push({ ...txn, id: saved.id });
        }
        const total = savedTxns.reduce((s, t) => s + t.amount, 0);
        const replyText = savedTxns.length === 1
          ? 'Got it \u2014 ' + savedTxns[0].amount.toFixed(2) + ' at ' + (savedTxns[0].merchant || savedTxns[0].category) + '. Logged.'
          : 'Logged ' + savedTxns.length + ' transactions totaling ' + total.toFixed(2) + '.';
        setMessages(prev => [...prev, { role: 'assistant', content: replyText, type: 'text' }, ...savedTxns.map(t => ({ role: 'assistant', type: 'transaction', data: t }))]);
        await saveChatMessage(userId, 'assistant', replyText);
      } else {
        const reply = result.reply || "Got it. Anything else?";
        setMessages(prev => [...prev, { role: 'assistant', content: reply, type: 'text' }]);
        await saveChatMessage(userId, 'assistant', reply);
      }
    } catch (err) {
      console.error('Chat error:', err);
      setMessages(prev => [...prev, { role: 'assistant', content: "Something went wrong. Try again?", type: 'text' }]);
    } finally { setLoading(false); }
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } };

  return (
    <div className="chat-page">
      <div className="chat-header">
        <span className="chat-title">Log Spending</span>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Just type naturally</span>
      </div>
      <div className="chat-messages">
        {messages.map((msg, i) => {
          if (msg.type === 'transaction') return <TransactionBubble key={i} txn={msg.data} />;
          return (<div key={i} className={'message ' + (msg.role === 'user' ? 'user' : 'assistant')}>{msg.content}</div>);
        })}
        {loading && (<div className="message assistant"><LoadingDots /></div>)}
        <div ref={messagesEndRef} />
      </div>
      <div className="chat-input-area">
        <textarea className="chat-input" placeholder='e.g. "spent 15 on lunch"' value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} rows={1} disabled={loading} />
        <button className="send-btn" onClick={handleSend} disabled={!input.trim() || loading}><Send size={18} /></button>
      </div>
    </div>
  );
}
