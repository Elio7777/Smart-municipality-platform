import Modal from './Modal.jsx'

const styles = {
  body: {
    padding: '32px 28px 24px',
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
    color: 'white',
    margin: '0 0 8px',
  },
  message: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    lineHeight: 1.5,
    margin: '0 0 22px',
  },
  buttonRow: {
    display: 'flex',
    gap: 10,
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
  },
  btnCancel: {
    padding: '10px 18px',
    background: 'rgba(255,255,255,0.06)',
    color: 'rgba(255,255,255,0.85)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 150ms ease',
  },
  btnConfirm: {
    padding: '10px 18px',
    background: 'var(--color-red, #E11D2E)',
    color: 'white',
    border: '1px solid var(--color-red, #E11D2E)',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 150ms ease',
  },
  btnConfirmNeutral: {
    padding: '10px 18px',
    background: 'white',
    color: 'var(--color-black, #111111)',
    border: '1px solid white',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 150ms ease',
  },
}

export default function ConfirmDialog({
  isOpen,
  onConfirm,
  onCancel,
  title = 'Are you sure?',
  message = '',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
}) {
  return (
    <Modal isOpen={isOpen} onClose={onCancel} maxWidth="420px">
      <div style={styles.body}>
        <h2 style={styles.title}>{title}</h2>
        {message && <p style={styles.message}>{message}</p>}
        <div style={styles.buttonRow}>
          <button
            type="button"
            style={styles.btnCancel}
            onClick={onCancel}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = 'rgba(255,255,255,0.10)')
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')
            }
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            style={destructive ? styles.btnConfirm : styles.btnConfirmNeutral}
            onClick={onConfirm}
            autoFocus
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  )
}
