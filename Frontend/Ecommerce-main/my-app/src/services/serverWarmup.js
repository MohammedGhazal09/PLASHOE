import api from '../api/axios';

let warmupStarted = false;

export const warmUpApiServer = async () => {
  if (warmupStarted) {
    return;
  }

  warmupStarted = true;

  try {
    await api.get('/health');
  } catch (error) {
    // The real request that needs data will still surface its own loading/error state.
  }
};

export const resetServerWarmupForTests = () => {
  warmupStarted = false;
};
