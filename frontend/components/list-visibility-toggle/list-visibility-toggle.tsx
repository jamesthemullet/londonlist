import { gql } from '@apollo/client';
import { useMutation, useQuery } from '@apollo/client/react';
import Cookie from 'js-cookie';
import { useAppContext } from '../../context/AppContext';
import styles from './list-visibility-toggle.module.css';

type ListSetting = {
  documentId: string;
  isPublic: boolean;
};

type ListSettingsData = {
  listSettings: ListSetting[];
};

const GET_LIST_SETTING = gql`
  query GetListSetting {
    listSettings {
      documentId
      isPublic
    }
  }
`;

const CREATE_LIST_SETTING = gql`
  mutation CreateListSetting($isPublic: Boolean!) {
    createListSetting(data: { isPublic: $isPublic }) {
      documentId
      isPublic
    }
  }
`;

const UPDATE_LIST_SETTING = gql`
  mutation UpdateListSetting($documentId: ID!, $isPublic: Boolean!) {
    updateListSetting(documentId: $documentId, data: { isPublic: $isPublic }) {
      documentId
      isPublic
    }
  }
`;

export default function ListVisibilityToggle() {
  const { user } = useAppContext();
  const token = Cookie.get('token');
  const authHeader = { Authorization: `Bearer ${token}` };

  const { data, loading } = useQuery<ListSettingsData>(GET_LIST_SETTING, {
    context: { headers: authHeader },
    fetchPolicy: 'network-only',
  });

  const [createSetting] = useMutation(CREATE_LIST_SETTING, {
    context: { headers: authHeader },
    refetchQueries: [{ query: GET_LIST_SETTING, context: { headers: authHeader } }],
  });

  const [updateSetting] = useMutation(UPDATE_LIST_SETTING, {
    context: { headers: authHeader },
    refetchQueries: [{ query: GET_LIST_SETTING, context: { headers: authHeader } }],
  });

  if (loading) return null;

  const setting = data?.listSettings?.[0];
  const isPublic = setting?.isPublic ?? false;

  const handleToggle = async () => {
    if (setting) {
      await updateSetting({ variables: { documentId: setting.documentId, isPublic: !isPublic } });
    } else {
      await createSetting({ variables: { isPublic: true } });
    }
  };

  const shareUrl =
    user && typeof window !== 'undefined'
      ? `${window.location.origin}/list/${user.username}`
      : '';

  return (
    <div className={styles.container}>
      <label className={styles.toggleLabel}>
        <span className={styles.labelText}>Make list public</span>
        <input
          type="checkbox"
          className={styles.checkbox}
          checked={isPublic}
          onChange={handleToggle}
        />
        <span className={styles.toggle} />
      </label>
      {isPublic && shareUrl && (
        <p className={styles.shareText}>
          Share your list:{' '}
          <a href={shareUrl} className={styles.shareLink} target="_blank" rel="noreferrer">
            {shareUrl}
          </a>
        </p>
      )}
    </div>
  );
}
