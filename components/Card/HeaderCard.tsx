import { Flex, Box, Container } from '@chakra-ui/react';
import Color from 'color';
import icon from '../../public/logo_icon.svg';
import Image from '../Utils/Image';
type Props = {
  image?: {
    src: string;
    alt: string;
  };
  children?: React.ReactNode;
  color?: string;
  breadcrumb?: React.ReactNode;
};

const HeaderCard = (props: Props) => {
  const { image, children, color: colorProps, breadcrumb } = props;
  const color = Color(colorProps ?? '#4A5568');
  const rgb = color.rgb().round().array();

  return (
    <Box mb={6}>
      <Box
        position="absolute"
        h="30vh"
        left="0"
        width="100%"
        bgGradient={`linear-gradient(to top,rgba(0,0,0,0) 0,rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]},.6) 80%)`}
        zIndex={-1}
      />
      {breadcrumb && <Box pt={2}>{breadcrumb}</Box>}
      <Flex gap={{ base: 3, md: 6 }} pt={!!breadcrumb ? 4 : 6} alignItems="center">
        <Box
          position="relative"
          p={{ base: 1, md: 2 }}
          bg={`rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]},.75)`}
          borderRadius="md"
          display="flex"
          flexFlow="column"
          justifyContent="center"
          alignItems="center"
          boxShadow="sm"
          textAlign="center"
          flex="0 0 auto"
          minW={{ base: '100px', md: '150px' }}
          minH={{ base: '100px', md: '150px' }}
        >
          {!image && (
            <Image
              src={icon}
              width={{ base: '50px', md: '80px' }}
              style={{ opacity: 0.85, flex: 1 }}
              alt={'itemdb logo'}
            />
          )}
          {image && (
            <Image
              src={image.src}
              width={150}
              height={150}
              w={{ base: '100px', md: '150px' }}
              h={{ base: '100px', md: '150px' }}
              borderRadius="md"
              alt={image.alt}
            />
          )}
        </Box>
        <Container mx={0} maxW="container.lg" p={0}>
          {children}
        </Container>
      </Flex>
    </Box>
  );
};

export default HeaderCard;
