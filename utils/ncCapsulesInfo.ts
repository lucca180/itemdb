interface CapsuleInfo {
  [key: number]: {
    name: string;
    [key: `cat${number}`]: {
      text: string;
    };
  };
}

export const capsulesInfo: CapsuleInfo = {
  60355: {
    name: 'Closet Essentials Mystery Capsule',
    cat1: {
      text: 'Essential T-Shirt',
    },
    cat2: {
      text: 'Essential Long Sleeve',
    },
    cat3: {
      text: 'Essential Tank Top',
    },
    cat4: {
      text: 'Essential Cardigan',
    },
    cat5: {
      text: 'Essential Hoodie',
    },
    cat6: {
      text: 'Essential Pants',
    },
    cat7: {
      text: 'Essential Shorts',
    },
    cat8: {
      text: 'Essential Skirt',
    },
    cat9: {
      text: 'Essential Filter',
    },
    cat10: {
      text: 'Essential Background',
    },
  },
  63977: {
    name: 'Retired Backgrounds Mystery Capsule',
    cat1: {
      text: '2007-2010',
    },
    cat2: {
      text: '2011-2012',
    },
    cat3: {
      text: '2013-2014',
    },
  },
  64309: {
    name: 'Retired Backgrounds II Mystery Capsule',
    cat1: {
      text: '2015-2017',
    },
    cat2: {
      text: '2018-2019',
    },
    cat3: {
      text: '2020-2022',
    },
  },
  64542: {
    name: 'Retired Trinkets Mystery Capsule',
    cat1: {
      text: '2007-2009',
    },
    cat2: {
      text: '2010',
    },
    cat3: {
      text: '2011',
    },
  },
  64834: {
    name: 'Retired Trinkets II Mystery Capsule',
    cat1: {
      text: '2012',
    },
    cat2: {
      text: '2013',
    },
    cat3: {
      text: '2014',
    },
  },
  65420: {
    name: 'Retired Trinkets III Mystery Capsule',
    cat1: {
      text: '2012 (but its actually 2015)',
    },
    cat2: {
      text: '2013 (but its actually 2016)',
    },
    cat3: {
      text: '2014 (but its actually 2017)',
    },
  },
  67930: {
    name: 'Retired Trinkets IV Mystery Capsule',
    cat1: {
      text: '2018',
    },
    cat2: {
      text: '2019',
    },
    cat3: {
      text: '2020',
    },
  },
  67447: {
    name: 'Retired GBMC Mystery Capsule',
    cat1: {
      text: '2008-2014',
    },
    cat2: {
      text: '2015-2019',
    },
    cat3: {
      text: '2020-2024',
    },
  },
  68204: {
    name: 'Retired But Not Expired Makeup Capsule',
    cat1: {
      text: '2008-2013',
    },
    cat2: {
      text: '2014-2021',
    },
    cat3: {
      text: '2022-2023',
    },
  },
  68310: {
    name: 'Spread Your Wings Retired Mystery Capsule',
    cat1: {
      text: '2007-2011',
    },
    cat2: {
      text: '2012-2014',
    },
    cat3: {
      text: '2015-2024',
    },
  },
};

export const capInfoIds = Object.keys(capsulesInfo).map((id) => parseInt(id, 10));
