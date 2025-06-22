/* eslint-disable @next/next/no-img-element */
import { Fragment } from 'react';
import { ItemData } from '../../types';

type WidgetProps = {
  items: ItemData[];
  locale: string;
  showBadges?: boolean;
};

export const Widget = (props: WidgetProps) => {
  const { items, locale, showBadges } = props;

  let msg = 'See more on <b>itemdb</b>';
  if (locale === 'pt') {
    msg = 'Veja mais no <b>itemdb</b>';
  }
  if (locale === 'es') {
    msg = 'Ver más en <b>itemdb</b>';
  }

  return (
    <>
      <style>
        {`
        .itemdb-widget {
          display: flex;
          flex-flow: column;
          justify-content: center;
          align-items: center;  
          font-size: 14px;
          color: #333;
        }
        .itemdb-widget-itemList {
          display: flex;
          flex-direction: row;
          flex-wrap: wrap;
          justify-content: center;
          gap: 8px;
          margin-bottom: 8px;
        }
        .itemdb-widget-item {
          display:flex;
          flex-direction: column;
          text-align: center;
          align-items: center;
          width: 100px;
        }
        .itemdb-widget-item img {
          max-width: 100%;
        }
        .itemdb-widget picture {
          display: inline-flex;
        }
        .itemdb-widget-button, .itemdb-widget-button.a {
          padding: 5px;
          display: inline-flex;
          background: #2D3748;
          color: white;
          border-radius: 3px;
          justify-content: center;
          align-items: center;
          gap: 5px;
          color: white;
          border: none;
          cursor: pointer;
          text-decoration: none;
        }
        .itemdb-widget-button img {
          width: 20px;
          height: auto;
        }
        .itemdb-widget-button:hover, 
        .itemdb-widget-button.a:hover, 
        .itemdb-widget-button b {
          color: white;
        } 
        .itemdb-widget-badge {
          font-size: 12px;
          display: inline-block;
          vertical-align: middle;
          padding: 0 4px;
          background: #EDF2F7;
          color: #2D3748;
          text-transform: uppercase;
          font-weight: 700;
          border-radius: 2px;
        }
        .itemdb-widget-badge-purple {
          background: #E9D8FD;
          color: #44337A;
        }
          .itemdb-widget-badge-yellow {
          background: #FEFCBF;
          color: #744210;
        }
      `}
      </style>
      <div className="itemdb-widget">
        <div className="itemdb-widget-itemList">
          {items.map((item) => (
            <div className="itemdb-widget-item" key={item.internal_id}>
              <a href={`https://itemdb.com.br/item/${item.slug}`} target="_blank">
                <picture>
                  <img src={item.image} alt={item.description} style={{ maxWidth: '100%' }} />
                </picture>
              </a>
              <p>
                <a href={`https://itemdb.com.br/item/${item.slug}`} target="_blank">
                  {item.name}
                </a>
              </p>
              {showBadges && <SimpleCardBadge item={item} />}
            </div>
          ))}
        </div>
        <a href="https://itemdb.com.br" target="_blank" className="itemdb-widget-button">
          <picture>
            <img alt="itemdb logo" src="https://itemdb.com.br/logo_icon.svg" height="auto" />
          </picture>
          <span dangerouslySetInnerHTML={{ __html: msg }} />
        </a>
      </div>
    </>
  );
};

const intlFormat = new Intl.NumberFormat();

type SimpleCardBadgeProps = {
  item: ItemData;
};

export const SimpleCardBadge = (props: SimpleCardBadgeProps) => {
  const { item } = props;

  if (!item) return null;

  return (
    <>
      {item.price.value && item.price.inflated && (
        <div className="itemdb-widget-badge itemdb-widget-red">
          {intlFormat.format(item.price.value)} NP
        </div>
      )}

      {item.price.value && !item.price.inflated && (
        <div className="itemdb-widget-badge">{intlFormat.format(item.price.value)} NP</div>
      )}

      {item.type === 'np' && item.status === 'no trade' && (
        <div className="itemdb-widget-badge">No Trade</div>
      )}

      {item.type === 'pb' && (
        <div className="itemdb-widget-badge itemdb-widget-badge-yellow">PB</div>
      )}

      {item.isNC && !item.mallData && !item.ncValue && (
        <div className="itemdb-widget-badge itemdb-widget-badge-purple">NC</div>
      )}

      {item.isNC && item.ncValue && !item.mallData && (
        <div className="itemdb-widget-badge itemdb-widget-badge-purple">
          {item.ncValue.range} caps
        </div>
      )}

      {item.isNC && item.mallData && (
        <div className="itemdb-widget-badge itemdb-widget-badge-purple">
          {intlFormat.format(item.mallData.discountPrice || item.mallData.price)} NC
        </div>
      )}
    </>
  );
};
