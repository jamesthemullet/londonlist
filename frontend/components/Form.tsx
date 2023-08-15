import React from 'react';

export default function Form({ title, buttonText, formData, setFormData, callback, error }) {
  return (
    <section>
      <div>
        <div>
          <div>
            <h3>{title}</h3>
          </div>
          <form onSubmit={callback}>
            <div className="mb-6">
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
            <div className="mb-4">
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
            {error && <div>Error: {error.message}</div>}
            <button type="submit">{buttonText}</button>
          </form>
        </div>
      </div>
    </section>
  );
}
