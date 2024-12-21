const log = {

  dev: (message: string) => {

    if (['development', 'testing'].includes(String(process.env.NODE_ENV))) {

      console.log(message);

    }
  },

  prod: (message: string) => {

    if (process.env.NODE_ENV === 'production') {

      console.log(message);

    }

  },

  all: (message: string) => {
    console.log(message)
  }

}

export {log};
