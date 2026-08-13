'use client';

import { useEffect } from 'react';
import { useAlert } from '../context/AlertContext';

const DARK_NAVY = '#17232E';
const GOLD = '#C8A87C';

const typeStyles = {
  info: { borderColor: GOLD, icon: 'fa-info-circle' },
  success: { borderColor: '#22C55E', icon: 'fa-check-circle' },
  error: { borderColor: '#EF4444', icon: 'fa-exclamation-circle' },
  warning: { borderColor: '#F59E0B', icon: 'fa-exclamation-triangle' },
};

export default function AlertModal() {
  const { alertData, closeAlert, confirmData, closeConfirm } = useAlert();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (alertData.visible) closeAlert();
        if (confirmData.visible) closeConfirm();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [alertData.visible, confirmData.visible, closeAlert, closeConfirm]);

  // ─── Render Alert ──────────────────────────────────────────
  if (alertData.visible) {
    const { message, type } = alertData;
    const { borderColor, icon } = typeStyles[type] || typeStyles.info;

    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          animation: 'fadeIn 0.2s ease',
          padding: '1rem',
        }}
        onClick={closeAlert}
      >
        <div
          style={{
            background: '#FFFFFF',
            maxWidth: '420px',
            width: '100%',
            borderRadius: '1rem',
            padding: '2rem 1.5rem 1.5rem',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            borderTop: `4px solid ${borderColor}`,
            textAlign: 'center',
            animation: 'scaleIn 0.25s ease',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <i
            className={`fas ${icon}`}
            style={{
              fontSize: '3rem',
              color: borderColor,
              marginBottom: '0.5rem',
              display: 'block',
            }}
          />
          <p
            style={{
              fontSize: '1rem',
              color: DARK_NAVY,
              fontWeight: 500,
              lineHeight: '1.5',
              marginBottom: '1.5rem',
            }}
          >
            {message}
          </p>
          <button
            onClick={closeAlert}
            style={{
              background: DARK_NAVY,
              color: '#FFFFFF',
              border: 'none',
              padding: '0.6rem 2.5rem',
              borderRadius: '9999px',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = GOLD;
              e.currentTarget.style.color = DARK_NAVY;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = DARK_NAVY;
              e.currentTarget.style.color = '#FFFFFF';
            }}
          >
            OK
          </button>
        </div>
      </div>
    );
  }

  // ─── Render Confirm ────────────────────────────────────────
  if (confirmData.visible) {
    const { title, message, onConfirm, onCancel } = confirmData;

    const handleConfirm = () => {
      closeConfirm();
      if (onConfirm) onConfirm();
    };

    const handleCancel = () => {
      closeConfirm();
      if (onCancel) onCancel();
    };

    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          animation: 'fadeIn 0.2s ease',
          padding: '1rem',
        }}
        onClick={handleCancel}
      >
        <div
          style={{
            background: '#FFFFFF',
            maxWidth: '420px',
            width: '100%',
            borderRadius: '1rem',
            padding: '2rem 1.5rem 1.5rem',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            borderTop: `4px solid ${GOLD}`,
            textAlign: 'center',
            animation: 'scaleIn 0.25s ease',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <i
            className="fas fa-question-circle"
            style={{
              fontSize: '3rem',
              color: GOLD,
              marginBottom: '0.5rem',
              display: 'block',
            }}
          />
          {title && (
            <h3
              style={{
                fontSize: '1.2rem',
                fontWeight: 700,
                color: DARK_NAVY,
                marginBottom: '0.5rem',
              }}
            >
              {title}
            </h3>
          )}
          <p
            style={{
              fontSize: '1rem',
              color: DARK_NAVY,
              lineHeight: '1.5',
              marginBottom: '1.5rem',
            }}
          >
            {message}
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button
              onClick={handleCancel}
              style={{
                background: 'transparent',
                color: DARK_NAVY,
                border: `2px solid ${DARK_NAVY}`,
                padding: '0.6rem 2rem',
                borderRadius: '9999px',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                flex: 1,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = DARK_NAVY;
                e.currentTarget.style.color = '#FFFFFF';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = DARK_NAVY;
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              style={{
                background: '#EF4444',
                color: '#FFFFFF',
                border: 'none',
                padding: '0.6rem 2rem',
                borderRadius: '9999px',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                flex: 1,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#DC2626';
                e.currentTarget.style.transform = 'scale(1.02)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#EF4444';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}