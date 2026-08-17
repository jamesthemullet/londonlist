import Link from "next/link";
import { useState } from "react";
import { useAppContext } from "../../context/AppContext";
import styles from "./list-visibility-toggle.module.css";

type Props = {
  listDocumentId: string;
  isPublic: boolean;
  onToggle: () => void;
  listName: string;
};

export default function ListVisibilityToggle({
  isPublic,
  onToggle,
  listDocumentId,
  listName,
}: Props) {
  const { user } = useAppContext();
  const [copied, setCopied] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

  const shareUrl =
    user && typeof window !== "undefined"
      ? `${window.location.origin}/list/${user.username}/${listDocumentId}`
      : "";

  function handleToggle() {
    if (isPublic && !user?.isPro) {
      setShowUpgradePrompt(true);
      return;
    }
    setShowUpgradePrompt(false);
    onToggle();
  }

  return (
    <div className={styles.container}>
      <label className={styles.toggleLabel}>
        <span className={styles.labelText}>
          Make &ldquo;{listName}&rdquo; public
        </span>
        <input
          type="checkbox"
          className={styles.checkbox}
          checked={isPublic}
          onChange={handleToggle}
        />
        <span className={styles.toggle} />
      </label>
      {showUpgradePrompt && (
        <p className={styles.upgradePrompt}>
          Private lists are a Pro feature.{" "}
          <Link href="/pricing" className={styles.upgradeLink}>
            Upgrade to Pro
          </Link>{" "}
          to keep your lists private.
        </p>
      )}
      {isPublic && shareUrl && (
        <div className={styles.shareRow}>
          <p className={styles.shareText}>
            Share your list:{" "}
            <a
              href={shareUrl}
              className={styles.shareLink}
              target="_blank"
              rel="noreferrer"
            >
              {shareUrl}
            </a>
          </p>
          <button
            className={styles.copyButton}
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(shareUrl);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
          >
            {copied ? "Copied!" : "Copy link"}
          </button>
        </div>
      )}
    </div>
  );
}
