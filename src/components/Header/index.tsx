import Link from 'next/link';
import styles from './header.module.scss';

export default function Header(): JSX.Element {
  return (
    <header className={styles.headerContainer}>
      <section className={styles.headerContent}>
        <Link href="/">
          <a>
            <img src="/images/logo.png" alt="logo" />
          </a>
        </Link>
      </section>
    </header>
  );
}
