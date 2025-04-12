/* eslint-disable @next/next/no-img-element */
import { ItemData } from '../../types';

type WidgetProps = {
  items: ItemData[];
  locale: string;
};

export const Widget = (props: WidgetProps) => {
  const { items, locale } = props;

  let msg = 'See more on itemdb';
  if (locale === 'pt') {
    msg = 'Veja mais no itemdb';
  }
  if (locale === 'es') {
    msg = 'Ver más en itemdb';
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
        .itemdb-widget-button:hover, .itemdb-widget-button.a:hover{
          color: white;
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
            </div>
          ))}
        </div>
        <a href="https://itemdb.com.br" target="_blank" className="itemdb-widget-button">
          <picture>
            <img
              alt="itemdb logo"
              src="https://itemdb.com.br/logo_icon.svg"
              width="20px"
              height="auto"
            />
          </picture>
          {msg}
        </a>
      </div>
    </>
  );
};
