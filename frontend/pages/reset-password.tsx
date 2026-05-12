// import { useRouter } from 'next/router';
import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import { useState } from 'react';
import Form from '../components/core/form/form';

const REQUEST_RESET_MUTATION = gql`
  mutation forgotPassword($email: String!) {
    forgotPassword(email: $email) {
      ok
    }
  }
`;

export default function ForgotPassword() {
  // const router = useRouter();
  const [formData, setFormData] = useState({ email: '' });
  const [resetPassword, { error }] = useMutation(REQUEST_RESET_MUTATION);

  const handleRequestReset = async () => {
    try {
      await resetPassword({
        variables: { email: formData.email },
      });
    } catch (_error) {}
  };

  return (
    <Form
      title="Forgot Password"
      buttonText="Reset Password"
      formData={formData}
      setFormData={setFormData}
      callback={handleRequestReset}
      error={error}
      isLogin={false}
    />
  );
}
