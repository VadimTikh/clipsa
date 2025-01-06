const loadCrons = (
  {onlyInProduction} = {onlyInProduction: true},
  callback: () => void,
) => {
  const isToLoadCrons =
    !onlyInProduction || process.env.NODE_ENV === 'production';

  if (isToLoadCrons) {
    import('./jobs')
      .then(callback)
      .catch(error => {
        throw new Error(error);
      });
  }
};

export {loadCrons};
