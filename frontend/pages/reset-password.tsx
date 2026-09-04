import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { Button } from '../components/core/button/button';
import Form from '../components/core/form/form';
import styles from '../components/core/form/form.module.css';

const REQUEST_RESET_MUTATION = gql`
  mutation forgotPassword($email: String!) {
    forgotPassword(email: $email) {
      ok
    }
  }
`;

const RESET_PASSWORD_MUTATION = gql`
  mutation ResetPassword($code: String!, $password: String!, $passwordConfirmation: String!) {
    resetPassword(
      code: $code
      password: $password
      passwordConfirmation: $passwordConfirmation
    ) {
      jwt
      user {
        id
      }
    }
  }
`;

export default function ResetPasswordPage() {
  const { query } = useRouter();
  const code = typeof query.code === 'string' ? query.code : null;

  if (code) {
    return (
      <>
        <Head>
          <title>Set new password — London List</title>
          <meta name="description" content="Set a new password for your London List account." />
        </Head>
        <SetNewPasswordForm code={code} />
      </>
    );
  }
  return (
    <>
      <Head>
        <title>Reset password — London List</title>
        <meta name="description" content="Reset your London List account password." />
      </Head>
      <ForgotPasswordForm />
    </>
  );
}

function ForgotPasswordForm() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [sent, setSent] = useState(false);
  const [requestReset, { error }] = useMutation(REQUEST_RESET_MUTATION);

  if (sent) {
    return (
      <section className={styles.container}>
        <h3>Check your inbox</h3>
        <p>
          If that address is registered, we&apos;ve sent a reset link to{' '}
          <strong>{formData.email}</strong>.
        </p>
        <Link href="/login">Back to login</Link>
      </section>
    );
  }

  const handleSubmit = async () => {
    try {
      await requestReset({ variables: { email: formData.email } });
      setSent(true);
    } catch {}
  };

  return (
    <Form
      title="Forgot Password"
      buttonText="Reset Password"
      formData={formData}
      setFormData={setFormData}
      callback={handleSubmit}
      error={error}
      isLogin={false}
    />
  );
}

function SetNewPasswordForm({ code }: { code: string }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [success, setSuccess] = useState(false);
  const [resetPassword, { error }] = useMutation(RESET_PASSWORD_MUTATION);

  if (success) {
    return (
      <section className={styles.container}>
        <h3>Password updated</h3>
        <p>Your password has been changed successfully.</p>
        <Link href="/login">Log in with your new password</Link>
      </section>
    );
  }

  const mismatch = confirm.length > 0 && password !== confirm;
  const canSubmit = password.length >= 6 && password === confirm;

  const handleSubmit = async () => {
    try {
      await resetPassword({
        variables: { code, password, passwordConfirmation: confirm },
      });
      setSuccess(true);
    } catch {}
  };

  return (
    <section className={styles.container}>
      <h3>Set new password</h3>
      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
        <div>
          <label htmlFor="new-password">New password</label>
          <input
            id="new-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={styles.input}
            aria-invalid={mismatch || undefined}
          />
        </div>
        <div>
          <label htmlFor="confirm-password">Confirm new password</label>
          <input
            id="confirm-password"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className={styles.input}
            aria-invalid={mismatch || undefined}
          />
        </div>
        {mismatch && (
          <p role="alert" className={styles.error}>
            Passwords do not match.
          </p>
        )}
        {error && (
          <p role="alert" className={styles.error}>
            Error: {error.message}
          </p>
        )}
        <Button type="submit" disabled={!canSubmit}>
          Set new password
        </Button>
      </form>
    </section>
  );
}
