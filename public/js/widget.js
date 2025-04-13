(function () {
  const containers = document.querySelectorAll('[data-itemdb-widget-id]');

  containers.forEach(container => {
    const widgetType = container.dataset.itemdbWidgetType || 'latest-items';
    const limit = container.dataset.itemdbWidgetLimit;
    const locale = container.dataset.itemdbWidgetLocale;
    const showBadge = container.dataset.itemdbWidgetBadges;

    // list params
    const listId = container.dataset.itemdbWidgetListId;
    const listUsername = container.dataset.itemdbWidgetListUsername;

    const params =  new URLSearchParams({
      type: widgetType,
      limit: limit,
      locale: locale,
      badges: showBadge,
      list_id: listId,
      list_owner: listUsername,
    });

    params.forEach((value, key) => {
      if ((value ?? null) === null || value === 'undefined') {
        params.delete(key);
      }
    });
    
    fetch(`https://itemdb.com.br/api/widget?${params.toString()}`)
      .then(res => res.text())
      .then(html => {
        container.innerHTML = html;
      })
      .catch(err => {
        console.error(err);
      });
  });
})();