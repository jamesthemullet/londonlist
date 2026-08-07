import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import Cookie from 'js-cookie';
import { useRouter } from 'next/router';
import { type FormEvent, useState } from 'react';
import Loader from '../components/Loader';
import { Button } from '../components/core/button/button';
import { useAppContext } from '../context/AppContext';
import styles from './register.module.css';

type RegisterMutationData = {
  register: {
    jwt: string;
    user: {
      id: string;
      documentId: string;
      username: string;
      email: string;
      isPro: boolean;
    };
  };
};

type RegisterMutationVariables = {
  username: string;
  email: string;
  password: string;
};

const REGISTER_MUTATION = gql`
  mutation Register($username: String!, $email: String!, $password: String!) {
    register(input: { username: $username, email: $email, password: $password }) {
      jwt
      user {
        id
        documentId
        username
        email
        isPro
      }
    }
  }
`;

const USERNAME_PATTERN = /^[a-zA-Z0-9_-]{3,20}$/;

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function RegisterRoute() {
  const { setUser } = useAppContext();
  const router = useRouter();

  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [registerMutation, { loading, error }] = useMutation<
    RegisterMutationData,
    RegisterMutationVariables
  >(REGISTER_MUTATION);

  const isUsernameValid = USERNAME_PATTERN.test(formData.username);
  const isEmailValid = isValidEmail(formData.email);
  const isPasswordValid = formData.password.length >= 8;
  const isFormValid = isUsernameValid && isEmailValid && isPasswordValid;

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;
    const { username, email, password } = formData;
    const { data } = await registerMutation({
      variables: { username, email, password },
    });
    if (data?.register.user) {
      setUser(data.register.user);
      Cookie.set('token', data.register.jwt, {
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      });
      router.push('/');
    }
  };

  if (loading) return <Loader />;

  return (
    <section className={styles.container}>
      <div>
        <h3>Sign Up</h3>
        <form onSubmit={handleRegister} className={styles.form}>
          <div className={styles.fieldGroup}>
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              name="username"
              placeholder="e.g. london_explorer"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className={styles.input}
              autoComplete="username"
            />
            <p className={styles.hint}>3–20 characters: letters, numbers, underscores, hyphens.</p>
          </div>
          <div className={styles.fieldGroup}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={styles.input}
              autoComplete="email"
            />
          </div>
          <div className={styles.fieldGroup}>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              name="password"
              placeholder="At least 8 characters"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className={styles.input}
              autoComplete="new-password"
            />
          </div>
          {error && <p className={styles.error}>Error: {error.message}</p>}
          <Button type="submit" disabled={!isFormValid}>
            Sign Up
          </Button>
        </form>
      </div>
    </section>
  );
}
