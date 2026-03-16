import React, { useState } from 'react';
import { upsertProfile } from '../lib/database';

const STEPS = [
  {
    key: 'age_range',
    question: "What's your age range?",
    subtitle: 'This helps personalize your financial advice.',
    options: [
      { value: '15-18', label: '15–18', icon: '🎓' },
      { value: '19-24', label: '19–24', icon: '🚀' },
      { value: '25-34', label: '25–34', icon: '💼' },
      { value: '35-44', label: '35–44', icon: '🏡' },
      { value: '45-54', label: '45–54', icon: '📈' },
      { value: '55-64', label: '55–64', icon: '🎯' },
      { value: '65+', label: '65+', icon: '🌅' },
    ]
  },
  {
    key: 'income_range',
    question: 'Roughly, what do you earn per year?',
    subtitle: "This stays private. It helps calibrate advice to your situation.",
    options: [
      { value: 'under_15k', label: 'Under $15K', icon: '💵' },
      { value: '15k_30k', label: '$15K – $30K', icon: '💵' },
      { value: '30k_50k', label: '$30K – $50K', icon: '💵' },
      { value: '50k_75k', label: '$50K – $75K', icon: '💰' },
      { value: '75k_100k', label: '$75K – $100K', icon: '💰' },
      { value: '100k_150k', label: '$100K – $150K', icon: '💰' },
      { value: '150k_plus', label: '$150K+', icon: '💎' },
      { value: 'prefer_not', label: 'Prefer not to say', icon: '🔒' },
    ]
  },
  {
    key: 'top_goal',
    question: "What's your #1 financial goal right now?",
    subtitle: 'Pick the one that matters most today.',
    options: [
      { value: 'budget_basics', label: 'Learn to budget', icon: '📝' },
      { value: 'reduce_spending', label: 'Spend less', icon: '✂️' },
      { value: 'save_emergency', label: 'Build an emergency fund', icon: '🛡️' },
      { value: 'pay_debt', label: 'Pay off debt', icon: '💳' },
      { value: 'save_purchase', label: 'Save for a big purchase', icon: '🎯' },
      { value: 'invest', label: 'Start investing', icon: '📊' },
      { value: 'build_credit', label: 'Build credit', icon: '⬆️' },
      { value: 'retire_early', label: 'Retire early', icon: '🏖️' },
    ]
  },
  {
    key: 'biggest_stress',
    question: "What stresses you most about money?",
    subtitle: "Be honest — this shapes how the app helps you.",
    options: [
      { value: 'no_budget', label: "I don't know where my money goes", icon: '🤷' },
      { value: 'impulse_spending', label: 'I spend impulsively', icon: '🛍️' },
      { value: 'not_enough_saved', label: "I don't have enough saved", icon: '😰' },
      { value: 'too_much_debt', label: 'Debt is overwhelming', icon: '📉' },
      { value: 'bills_overwhelming', label: "Bills are hard to keep up with", icon: '📬' },
      { value: 'no_investing', label: "I'm not investing", icon: '🏦' },
      { value: 'retirement_fear', label: "I worry I can't retire", icon: '⏰' },
      { value: 'other', label: 'Something else', icon: '💭' },
    ]
  },
  {
    key: 'dependents',
    question: 'How many people depend on your income?',
    subtitle: 'Including kids, partner, family members.',
    options: [
      { value: 0, label: 'Just me', icon: '🙋' },
      { value: 1, label: '1 person', icon: '👫' },
      { value: 2, label: '2 people', icon: '👨‍👩‍👦' },
      { value: 3, label: '3 people', icon: '👨‍👩‍👧‍👦' },
      { value: 4, label: '4+ people', icon: '👨‍👩‍👧‍👦' },
    ]
  }
];

export default function Onboarding({ userId, onComplete }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);

  const current = STEPS[step];

  const handleSelect = async (value) => {
    const updated = { ...answers, [current.key]: value };
    setAnswers(updated);

    if (step < STEPS.length - 1) {
      setTimeout(() => setStep(step + 1), 200);
    } else {
      // Final step — save profile
      setLoading(true);
      try {
        await upsertProfile(userId, {
          ...updated,
          onboarding_complete: true
        });
        onComplete(updated);
      } catch (err) {
        console.error('Profile save error:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="onboarding-page">
      <div className="onboarding-progress">
        {STEPS.map((_, i) => (
          <div key={i} className={`progress-dot ${i <= step ? 'active' : ''}`} />
        ))}
      </div>

      <div className="onboarding-question">{current.question}</div>
      <div className="onboarding-subtitle">{current.subtitle}</div>

      <div className="option-grid">
        {current.options.map((opt) => (
          <button
            key={opt.value}
            className={`option-btn ${answers[current.key] === opt.value ? 'selected' : ''}`}
            onClick={() => handleSelect(opt.value)}
            disabled={loading}
          >
            <span className="option-icon">{opt.icon}</span>
            <span>{opt.label}</span>
          </button>
        ))}
      </div>

      {step > 0 && (
        <button
          className="btn-secondary"
          style={{ marginTop: 16, textAlign: 'center' }}
          onClick={() => setStep(step - 1)}
        >
          ← Back
        </button>
      )}
    </div>
  );
}
