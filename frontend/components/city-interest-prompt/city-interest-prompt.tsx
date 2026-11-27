import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import { useEffect, useState } from 'react';
import styles from './city-interest-prompt.module.css';

const SUBMIT_CITY_INTEREST = gql`
  mutation SubmitCityInterest($city: String!) {
    submitCityInterest(city: $city)
  }
`;

const STORAGE_KEY = 'city_interest_prompt_dismissed';

export default function CityInterestPrompt() {
  const [visible, setVisible] = useState(false);
  const [city, setCity] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitCityInterest] = useMutation<{ submitCityInterest: boolean }>(SUBMIT_CITY_INTEREST);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        setVisible(true);
      }
    } catch {
      // localStorage unavailable — don't show
    }
  }, []);

  function dismiss() {
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      // ignore
    }
    setVisible(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = city.trim();
    if (!trimmed) return;

    await submitCityInterest({ variables: { city: trimmed } });
    setSubmitted(true);
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      // ignore
    }
  }

  if (!visible) return null;

  if (submitted) {
    return (
      <aside className={styles.prompt} role="status">
        <p className={styles.thanks}>Thanks! We&rsquo;ll let you know if {city.trim()} is on the way.</p>
        <button type="button" className={styles.dismiss} onClick={dismiss} aria-label="Dismiss city interest prompt">
          ✕
        </button>
      </aside>
    );
  }

  return (
    <aside className={styles.prompt} aria-label="City interest survey">
      <button type="button" className={styles.dismiss} onClick={dismiss} aria-label="Dismiss city interest prompt">
        ✕
      </button>
      <p className={styles.question}>
        <strong>Want lists for other cities?</strong> Tell us which city you&rsquo;d love to explore.
      </p>
      <form onSubmit={handleSubmit} className={styles.form}>
        <label htmlFor="city-input" className={styles.label}>City name</label>
        <input
          id="city-input"
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="e.g. Paris, Tokyo, New York"
          className={styles.input}
          maxLength={100}
          autoComplete="off"
        />
        <button
          type="submit"
          className={styles.submit}
          disabled={!city.trim()}
        >
          Send
        </button>
      </form>
    </aside>
  );
}
