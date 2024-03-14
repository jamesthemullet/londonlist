import React from 'react';

const isValidEmail = (email) => {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(email);
};

export default function Form({
  title,
  buttonText,
  formData,
  setFormData,
  callback,
  error,
  isLogin,
}) {
  const isEmailInvalid = !formData.email || !isValidEmail(formData.email);
  return (
    <section>
      <div>
        <div>
          <div>
            <h3>{title}</h3>
          </div>
          <form onSubmit={callback}>
            <div>
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            {isLogin && (
              <div>
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  name="password"
                  placeholder="************"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
            )}
            {error && <div>Error: {error.message}</div>}
            <button type="submit" disabled={isEmailInvalid}>
              {buttonText}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
