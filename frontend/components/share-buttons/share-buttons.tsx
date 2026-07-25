import { useState } from 'react';
import styles from './share-buttons.module.css';

type Props = {
  url: string;
  title: string;
};

export default function ShareButtons({ url, title }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback for older browsers
    }
  };

  const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`;

  return (
    <div className={styles.container}>
      <span className={styles.label}>Share this list</span>
      <div className={styles.buttons}>
        <button
          type="button"
          className={styles.button}
          onClick={handleCopy}
        >
          {copied ? 'Copied!' : 'Copy link'}
        </button>
        <a
          href={twitterUrl}
          className={styles.buttonLink}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Share on X (Twitter)"
        >
          Share on X
        </a>
        <a
          href={whatsappUrl}
          className={styles.buttonLink}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Share on WhatsApp"
        >
          WhatsApp
        </a>
      </div>
    </div>
  );
}
