import styles from '../MainPageStyle.module.css';

const Toast = ({ toast }) => {
  if (!toast) return null;

  return (
    <div className={`${styles.toast} ${styles[toast.type]}`}>
      {toast.message}
    </div>
  );
};

export default Toast;

