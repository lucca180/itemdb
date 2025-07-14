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
      title: 'Welcome to itemdb!',
      action: {
        instructions:
          'Thanks for joining itemdb! To log in to your account, please click the button below.',
        button: {
          color: '#2D3748',
          text: 'Confirm your account',
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
