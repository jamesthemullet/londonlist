import { useState } from 'react';
import { useRouter } from 'next/router';
import { gql, useMutation } from '@apollo/client';
import Form from '../components/Form';

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
  const [resetPassword, { loading, error }] = useMutation(REQUEST_RESET_MUTATION);
  console.log(1, loading);

  const handleRequestReset = async () => {
    try {
      const { data } = await resetPassword({
        variables: { email: formData.email }, // Use formData.email here
      });
      // Handle success, e.g., show a confirmation message to the user.
      console.log(100, data);
    } catch (error) {
      // Handle errors, e.g., display an error message.
      console.log(400, error.message);
    }
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
