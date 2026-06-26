const isNode = typeof window === 'undefined';

const getAppParams = () => {
  if (isNode) return { token: null, fromUrl: '/' };
  
  const urlParams = new URLSearchParams(window.location.search);
  const accessToken = urlParams.get('access_token');
  
  if (accessToken) {
    localStorage.setItem('token', accessToken);
  }
  
  const token = localStorage.getItem('token');
  
  return {
    token,
    fromUrl: window.location.href,
  };
};

export const appParams = getAppParams();
