import React, { useState, useEffect } from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';
import { getTransactions, getSpendingByCategory, getTodaysMove, saveDailyMove } from '../lib/database';
import { generateDailyMove } from '../lib/ai-engine';

export default function Dashboard({ userId, profile }) {
  const [stats, setStats] = useState({ spent: 0, income: 0, txnCount: 0 });
  const [categories, setCategories] = useState([]);
  const [dailyMove, setDailyMove] = useState(null);
  const [loadingMove, setLoadingMove] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const txns = await getTransactions(userId, 7);
      const spent = txns
        .filter(t => t.type === 'expense')
        .reduce((s, t) => s + Number(t.amount), 0);
      const income = txns
        .filter(t => t.type === 'income')
        .reduce((s, t) => s + Number(t.amount), 0);
      setStats({ spent, income, txnCount: txns.length });

      const cats = await getSpendingByCategory(userId, 7);
      setCategories(cats);

      // Load or generate daily move
      let move = await getTodaysMove(userId);
      if (!move && profile) {
        await refreshDailyMove(txns);
      } else if (move) {
        setDailyMove(move);
      }
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshDailyMove = async (txnsOverride) => {
    setLoadingMove(true);
    try {
      const txns = txnsOverride || await getTransactions(userId, 7);
      const spendingData = txns.filter(t => t.type === 'expense').map(t => ({
        amount: t.amount,
        category: t.categories?.name || 'Other',
        merchant: t.merchant,
        description: t.description
      }));

      const moveData = await generateDailyMove(profile, spendingData);
      const saved = await saveDailyMove(userId, moveData);
      setDailyMove(saved);
    } catch (err) {
      console.error('Daily move error:', err);
      setDailyMove({
        move_text: 'Track every purchase today. Awareness is the foundation of financial control.',
        move_type: 'educate',
        potential_savings: null
      });
    } finally {
      setLoadingMove(false);
    }
  };

  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });

  const greeting = () => {
    const hour = today.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const name = profile?.display_name?.split(' ')[0] || '';
  const maxCat = categories.length > 0 ? categories[0].total : 1;

  return (
    <div className="page">
      <div className="dash-greeting">{greeting()}{name ? `, ${name}` : ''}</div>
      <div className="dash-date">{dateStr}</div>

      {/* Daily Money Move */}
      <div className="daily-move-card">
        <div className="daily-move-label">
          <Sparkles size={14} />
          Today's Money Move
          {dailyMove && (
            <button
              onClick={() => refreshDailyMove()}
              style={{
                marginLeft: 'auto',
                background: 'none',
                border: 'none',
                color: 'var(--accent)',
                cursor: 'pointer',
                padding: 4
              }}
              disabled={loadingMove}
            >
              <RefreshCw size={14} className={loadingMove ? 'spin' : ''} />
            </button>
          )}
        </div>
        {loadingMove ? (
          <div className="daily-move-text" style={{ color: 'var(--text-muted)' }}>
            Analyzing your spending...
          </div>
        ) : dailyMove ? (
          <>
            <div className="daily-move-text">{dailyMove.move_text}</div>
            {dailyMove.potential_savings && (
              <div className="daily-move-savings">
                Potential annual savings: ${Number(dailyMove.potential_savings).toLocaleString()}
              </div>
            )}
          </>
        ) : (
          <div className="daily-move-text" style={{ color: 'var(--text-muted)' }}>
            Log some spending to get your first personalized tip.
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="section-title">Last 7 Days</div>
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">Spent</div>
          <div className="stat-value expense">
            ${stats.spent.toFixed(2)}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Income</div>
          <div className="stat-value income">
            ${stats.income.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      {categories.length > 0 && (
        <>
          <div className="section-title">Spending by Category</div>
          <div className="category-list">
            {categories.slice(0, 6).map((cat, i) => (
              <div key={i} className="category-row">
                <span className="category-icon">{cat.icon}</span>
                <div className="category-info">
                  <div className="category-name">{cat.name}</div>
                  <div className="category-bar-bg">
                    <div
                      className="category-bar-fill"
                      style={{
                        width: `${(cat.total / maxCat) * 100}%`,
                        background: cat.color
                      }}
                    />
                  </div>
                </div>
                <span className="category-amount">${cat.total.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {stats.txnCount === 0 && !loading && (
        <div className="empty-state">
          <div className="empty-state-icon">💬</div>
          <div className="empty-state-text">
            No transactions yet.<br />
            Head to the chat and tell me what you spent today.
          </div>
        </div>
      )}
    </div>
  );
}
