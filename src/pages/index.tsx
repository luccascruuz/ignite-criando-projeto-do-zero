/* eslint-disable jsx-a11y/no-static-element-interactions */
import { GetStaticProps } from 'next';
import Head from 'next/head';
import Prismic from '@prismicio/client';
import format from 'date-fns/format';
import { ptBR } from 'date-fns/locale';
import { RichText } from 'prismic-dom';
import { FaRegCalendar } from 'react-icons/fa';
import { FiUser } from 'react-icons/fi';

import { useState } from 'react';
import Link from 'next/link';
import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  const { next_page, results } = postsPagination;
  const postWithDateFormatted = results.map(post => {
    return {
      ...post,
      first_publication_date: format(
        new Date(post.first_publication_date),
        'dd MMM yyyy',
        {
          locale: ptBR,
        }
      ),
    };
  });
  const [posts, setPosts] = useState(postWithDateFormatted || []);
  const [loading, setLoading] = useState(false);
  const [nextPage, setNextPage] = useState(next_page);

  async function handleNextPage(): Promise<void> {
    setLoading(true);
    const fetchPosts = await fetch(nextPage).then(response => response.json());
    const getPostResult = fetchPosts.results.map(post => {
      return {
        uid: post.uid,
        first_publication_date: format(
          new Date(post.first_publication_date),
          'dd MMM yyyy',
          {
            locale: ptBR,
          }
        ),
        data: {
          author: post.data.author,
          subtitle: post.data.subtitle,
          title: post.data.title,
        },
      };
    });
    setPosts([...posts, ...getPostResult]);
    setNextPage(fetchPosts.next_page);
    setLoading(false);
  }

  return (
    <>
      <Head>
        <title>Desafio 3 - Criando projeto do zero</title>
      </Head>
      <main className={styles.container}>
        {posts.map(post => (
          <Link href={`/post/${post.uid}`} key={post.uid}>
            <section className={styles.content}>
              <p className={styles.postTitle}>{post.data.title}</p>
              <p className={styles.postSubtitle}>{post.data.subtitle}</p>
              <div className={styles.wrapperTimeAuthor}>
                <time>
                  <FaRegCalendar className={styles.icon} />
                  {post.first_publication_date}
                </time>
                <span className={styles.author}>
                  <FiUser className={styles.icon} />
                  {post.data.author}
                </span>
              </div>
            </section>
          </Link>
        ))}
        {nextPage && (
          // eslint-disable-next-line jsx-a11y/click-events-have-key-events
          <span className={styles.loader} onClick={handleNextPage}>
            {loading ? 'Carregando...' : 'Carregar mais posts'}
          </span>
        )}
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const response = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: ['posts.title', 'posts.content', 'posts.subtitle', 'posts.author'],
      pageSize: 1,
    }
  );
  const posts = response.results.map((post): Post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        author: post.data.author,
        subtitle: post.data.subtitle,
        title: post.data.title,
      },
    };
  });
  return {
    props: {
      postsPagination: { results: posts, next_page: response.next_page },
    },
  };
};
