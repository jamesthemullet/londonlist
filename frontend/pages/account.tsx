import Cookie from 'js-cookie';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import styles from './account.module.css';

const API_URL = process.env.STRAPI_URL || 'http://127.0.0.1:1337';

type PasswordFormState = {
  currentPassword: string;
  password: string;
  passwordConfirmation: string;
};

type SectionStatus = 'idle' | 'submitting' | 'success' | 'error';

export default function AccountPage() {
  const { user, setUser, initialized } = useAppContext();
  const router = useRouter();

  const [passwordForm, setPasswordForm] = useState<PasswordFormState>({
    currentPassword: '',
    password: '',
    passwordConfirmation: '',
  });
  const [passwordStatus, setPasswordStatus] = useState<SectionStatus>('idle');
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [deleteStatus, setDeleteStatus] = useState<SectionStatus>('idle');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (initialized && !user) {
      router.push('/login');
    }
  }, [initialized, user, router]);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordStatus('submitting');

    const { currentPassword, password, passwordConfirmation } = passwordForm;

    if (password !== passwordConfirmation) {
      setPasswordError('New passwords do not match.');
      setPasswordStatus('error');
      return;
    }

    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      setPasswordStatus('error');
      return;
    }

    const token = Cookie.get('token');
    try {
      const res = await fetch(`${API_URL}/api/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, password, passwordConfirmation }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg =
          data?.error?.message || 'Failed to change password. Please check your current password.';
        setPasswordError(msg);
        setPasswordStatus('error');
        return;
      }

      setPasswordStatus('success');
      setPasswordForm({ currentPassword: '', password: '', passwordConfirmation: '' });
    } catch {
      setPasswordError('Something went wrong. Please try again.');
      setPasswordStatus('error');
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteError(null);
    setDeleteStatus('submitting');

    const token = Cookie.get('token');
    try {
      const res = await fetch(`${API_URL}/api/account/me`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        setDeleteError('Failed to delete account. Please try again.');
        setDeleteStatus('error');
        return;
      }

      Cookie.remove('token');
      setUser(null);
      router.push('/');
    } catch {
      setDeleteError('Something went wrong. Please try again.');
      setDeleteStatus('error');
    }
  };

  if (!initialized || !user) return null;

  return (
    <>
      <Head>
        <title>Account Settings — London List</title>
        <meta name="description" content="Manage your London List account settings." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="noindex" />
      </Head>
      <main className={styles.main}>
        <h1 className={styles.heading}>Account Settings</h1>

        <section className={styles.section} aria-labelledby="account-info-heading">
          <h2 className={styles.sectionHeading} id="account-info-heading">
            Account info
          </h2>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Username</span>
            <span className={styles.infoValue}>{user.username}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Email</span>
            <span className={styles.infoValue}>{user.email}</span>
          </div>
        </section>

        <section className={styles.section} aria-labelledby="change-password-heading">
          <h2 className={styles.sectionHeading} id="change-password-heading">
            Change password
          </h2>
          <form className={styles.form} onSubmit={handlePasswordChange} noValidate>
            <div className={styles.fieldGroup}>
              <label htmlFor="current-password" className={styles.label}>
                Current password
              </label>
              <input
                id="current-password"
                type="password"
                className={styles.input}
                value={passwordForm.currentPassword}
                onChange={(e) =>
                  setPasswordForm((f) => ({ ...f, currentPassword: e.target.value }))
                }
                required
                autoComplete="current-password"
              />
            </div>
            <div className={styles.fieldGroup}>
              <label htmlFor="new-password" className={styles.label}>
                New password
              </label>
              <input
                id="new-password"
                type="password"
                className={styles.input}
                value={passwordForm.password}
                onChange={(e) =>
                  setPasswordForm((f) => ({ ...f, password: e.target.value }))
                }
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>
            <div className={styles.fieldGroup}>
              <label htmlFor="confirm-password" className={styles.label}>
                Confirm new password
              </label>
              <input
                id="confirm-password"
                type="password"
                className={styles.input}
                value={passwordForm.passwordConfirmation}
                onChange={(e) =>
                  setPasswordForm((f) => ({ ...f, passwordConfirmation: e.target.value }))
                }
                required
                autoComplete="new-password"
              />
            </div>
            {passwordStatus === 'success' && (
              <p className={styles.successMessage} role="status">
                Password changed successfully.
              </p>
            )}
            {passwordStatus === 'error' && passwordError && (
              <p className={styles.errorMessage} role="alert">
                {passwordError}
              </p>
            )}
            <button
              type="submit"
              className={styles.submitButton}
              disabled={passwordStatus === 'submitting'}
            >
              {passwordStatus === 'submitting' ? 'Saving…' : 'Change password'}
            </button>
          </form>
        </section>

        <section className={styles.section} aria-labelledby="danger-zone-heading">
          <h2 className={styles.sectionHeading} id="danger-zone-heading">
            Danger zone
          </h2>
          <div className={styles.dangerZone}>
            <h3 className={styles.dangerHeading}>Delete account</h3>
            <p className={styles.dangerDescription}>
              This permanently deletes your account and all your lists. This cannot be undone.
            </p>
            {deleteStatus === 'error' && deleteError && (
              <p className={styles.errorMessage} role="alert">
                {deleteError}
              </p>
            )}
            {showDeleteConfirm ? (
              <div className={styles.confirmRow}>
                <p className={styles.confirmText}>Are you sure? This cannot be undone.</p>
                <button
                  type="button"
                  className={styles.confirmButton}
                  onClick={handleDeleteAccount}
                  disabled={deleteStatus === 'submitting'}
                >
                  {deleteStatus === 'submitting' ? 'Deleting…' : 'Yes, delete my account'}
                </button>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleteStatus === 'submitting'}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                className={styles.dangerButton}
                onClick={() => setShowDeleteConfirm(true)}
              >
                Delete my account
              </button>
            )}
          </div>
        </section>
      </main>
    </>
  );
}
