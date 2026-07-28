import Mailgen from 'mailgen';

export const getEmail = (link: string) => {
  const mailGenerator = new Mailgen({
    theme: 'cerberus',
    product: {
      name: 'itemdb',
      link: 'https://itemdb.com.br/',
      logo: 'https://magnetismotimes.com/wp-content/uploads/2023/03/icon.png',
      copyright: `Made in 🇧🇷 by Magnetismo Times. All rights reserved.`,
    },
  });

  const email: Mailgen.Content = {
    body: {
      greeting: 'Hello!',
      title: 'Sign in to itemdb',
      action: {
        instructions:
          'Click the button below to sign in. If this is your first time, your account will be created automatically.',
        button: {
          color: '#2D3748',
          text: 'Sign in',
          fallback: true,
          link: link,
        },
      },
      signature: false,
      outro: "If this email wasn't intended for you, please ignore it.",
    },
  };

  return {
    html: mailGenerator.generate(email),
    text: mailGenerator.generatePlaintext(email),
  };
};
