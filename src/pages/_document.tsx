import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head />
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const urlParams = new URLSearchParams(window.location.search);
                if (urlParams.get('view') === 'widget') {
                  document.documentElement.classList.add('widget-mode');
                  document.documentElement.style.backgroundColor = 'transparent';
                  document.body.style.backgroundColor = 'transparent';
                  document.body.style.backgroundImage = 'none';
                }
              })();
            `,
          }}
        />
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
