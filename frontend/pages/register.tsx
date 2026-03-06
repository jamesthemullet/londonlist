import { useState } from 'react';
import { useRouter } from 'next/router';
import { useAppContext } from '../context/AppContext';
import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import Cookie from 'js-cookie';

import Form from '../components/core/form/form';
import Loader from '../components/Loader';

type RegisterMutationData = {
  register: {
    jwt: string;
    user: {
      id: string;
      username: string;
      email: string;
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
        username
        email
      }
    }
  }
`;

export default function RegisterRoute() {
  const { setUser } = useAppContext();
  const router = useRouter();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [registerMutation, { loading, error }] = useMutation<
    RegisterMutationData,
    RegisterMutationVariables
  >(REGISTER_MUTATION);

  const handleRegister = async () => {
    const { email, password } = formData;
    const { data } = await registerMutation({
      variables: { username: email, email: email, password },
    });
    if (data?.register.user) {
      setUser(data.register.user);
      router.push('/');
      Cookie.set('token', data.register.jwt);
    }
  };

  if (loading) return <Loader />;

  return (
    <Form
      title="Sign Up"
      buttonText="Sign Up"
      formData={formData}
      setFormData={setFormData}
      callback={handleRegister}
      error={error}
      isLogin={true}
    />
  );
}
