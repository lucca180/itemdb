(function () {
  const containers = document.querySelectorAll('[data-itemdb-widget-id]');

  containers.forEach(container => {
    const widgetType = container.dataset.itemdbWidgetType || 'latest-items';
    const limit = container.dataset.itemdbWidgetLimit || 5;
    const locale = container.dataset.itemdbWidgetLocale || 'en';

    fetch(`https://itemdb.com.br/api/widget?type=${encodeURIComponent(widgetType)}&limit=${encodeURIComponent(limit)}&locale=${encodeURIComponent(locale)}`)
      .then(res => res.text())
      .then(html => {
        container.innerHTML = html;
      })
      .catch(err => {
        console.error(err);
      });
  });
})();