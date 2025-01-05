import axiosBasic from "axios";

const axios = axiosBasic.create({})

axios.interceptors.response.use(
  (response) => (
    response
  ), // If response is successful, just return it
  async (error) => {
    const config = error.config;

    // Check if the error qualifies for a retry
    if (error.response && error.response.status >= 500 && error.response.status < 600) {
      config.__retryCount = config.__retryCount || 0;

      if (config.__retryCount < 3) {
        config.__retryCount++;
        console.log(`Retrying request... Attempt #${config.__retryCount}`);

        // Wait for a short delay before retrying
        await new Promise((resolve) => setTimeout(resolve, 1000)); // 1 second delay

        return axios(config); // Retry the request
      }
    }

    // If retries are exhausted, throw the error
    return Promise.reject(error);
  }
);

export {axios}
