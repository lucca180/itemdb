import type { SystemStyleObject } from '@chakra-ui/react';

export const wpImgDefaults: SystemStyleObject = {
  '& .aligncenter, & .alignleft, & .alignright': {
    display: 'block',
    padding: 0,
  },
  '& .aligncenter': {
    float: 'none',
    margin: '.5em auto 1em',
  },
  '& .alignright': {
    float: 'right',
    margin: '.5em 0 1em 1em',
  },
  '& .alignleft': {
    float: 'left',
    margin: '.5em 1em 1em 0',
  },
  '& .wp-caption': {
    padding: 2,
    background: 'whiteAlpha.200',
    borderRadius: 'lg',
    textAlign: 'center',
    fontSize: 'sm',
  },
  '& .wp-caption img': {
    display: 'inline',
    borderRadius: 'md',
  },
  // '& .wp-caption p.wp-caption-text': {
  //   margin: '5px 0 0',
  //   padding: 0,
  //   textAlign: 'center',
  //   fontSize: '75%',
  //   fontWeight: '100',
  //   fontStyle: 'italic',
  //   color: '#ddd',
  // },
};
