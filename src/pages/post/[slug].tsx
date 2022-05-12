/* eslint-disable no-return-assign */
import { GetStaticPaths, GetStaticProps } from 'next';

import Prismic from '@prismicio/client';
import { FaRegCalendar, FaRegClock } from 'react-icons/fa';
import { FiUser } from 'react-icons/fi';
import format from 'date-fns/format';
import { ptBR } from 'date-fns/locale';
import { useRouter } from 'next/router';
import { getPrismicClient } from '../../services/prismic';

import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): JSX.Element {
  const sumTotalWords = post.data.content.reduce((sumTotal, itemText) => {
    const totalWords = itemText.body.map(item => item.text.split(' ').length);
    // eslint-disable-next-line no-param-reassign
    totalWords.forEach(word => (sumTotal += word));
    return sumTotal;
  }, 0);
  const calcTotalWordsReadByMinute = sumTotalWords / 200;
  const roundTotalWords = Math.ceil(calcTotalWordsReadByMinute);
  const router = useRouter();
  const dateFormatted = format(
    new Date(post.first_publication_date),
    'dd MMM yyyy',
    {
      locale: ptBR,
    }
  );
  if (router.isFallback) {
    return <span>Carregando...</span>;
  }
  return (
    <main className={styles.container}>
      <img src={post.data.banner.url} alt="banner" />
      <div className={styles.content}>
        <p className={styles.postTitle}>{post.data.title}</p>
        <div className={styles.wrapperTimeAuthor}>
          <time>
            <FaRegCalendar className={styles.icon} />
            {dateFormatted}
          </time>
          <span className={styles.author}>
            <FiUser className={styles.icon} />
            {post.data.author}
          </span>
          <span className={styles.timer}>
            <FaRegClock className={styles.icon} />
            {roundTotalWords} min
          </span>
        </div>
        <div>
          {post.data.content.map(itemContent => {
            return (
              <div key={itemContent.heading} className={styles.paragraph}>
                <h2 // eslint-disable-next-line react/no-danger
                  dangerouslySetInnerHTML={{ __html: itemContent.heading }}
                />
                {itemContent.body.map(paragraph => (
                  <p
                    className={styles.contentText}
                    // eslint-disable-next-line react/no-danger
                    dangerouslySetInnerHTML={{ __html: paragraph.text }}
                    key={paragraph.text}
                  />
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}

export const getStaticPaths: GetStaticPaths<{ slug: string }> = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: ['posts.slug'],
      pageSize: 1,
    }
  );
  const paths = posts.results.map(result => ({
    params: { slug: result.uid },
  }));
  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async context => {
  const { slug } = context.params;
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(slug), {});
  const post = {
    first_publication_date: response.first_publication_date,
    data: {
      title: response.data.title,
      banner: {
        url: response.data.banner.url,
      },
      author: response.data.author,
      content: response.data.content.map(itemContent => {
        return {
          heading: itemContent.heading,
          body: itemContent.body.map(itemBody => {
            return {
              text: itemBody.text,
              spans: itemBody.spans,
              type: itemBody.type,
            };
          }),
        };
      }),
    },
  };
  return {
    props: { post },
    revalidate: 60 * 60, // 1 hora
  };
};
