import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import Cookie from 'js-cookie';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { useAppContext } from '../context/AppContext';

import Link from 'next/link';
import Loader from '../components/Loader';
import Form from '../components/core/form/form';

type LoginMutationData = {
  login: {
    jwt: string;
    user: {
      id: string;
      documentId: string;
      username: string;
      email: string;
    };
  };
};

type LoginMutationVariables = {
  identifier: string;
  password: string;
};

const LOGIN_MUTATION = gql`
  mutation Login($identifier: String!, $password: String!) {
    login(input: { identifier: $identifier, password: $password }) {
      jwt
      user {
        id
        documentId
        username
        email
      }
    }
  }
`;

export default function LoginRoute() {
  const { setUser } = useAppContext();
  const router = useRouter();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loginMutation, { loading, error }] = useMutation<
    LoginMutationData,
    LoginMutationVariables
  >(LOGIN_MUTATION);

  const handleLogin = async () => {
    const { email, password } = formData;
    const { data } = await loginMutation({
      variables: { identifier: email, password },
    });
    if (data?.login.user) {
      setUser(data.login.user);
      Cookie.set('token', data.login.jwt, {
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      });
      router.push('/');
    }
  };

  if (loading) return <Loader />;

  return (
    <>
      <Form
        title="Login"
        buttonText="Login"
        formData={formData}
        setFormData={setFormData}
        callback={handleLogin}
        error={error}
        isLogin={true}
      />
      <Link href="/reset-password">Forgot Password?</Link>
    </>
  );
}
