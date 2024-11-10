function log(message: string) {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isTesting = process.env.NODE_ENV === 'testing';

  if (isDevelopment || isTesting) {
    console.log(message);
  }
}

export {log};
