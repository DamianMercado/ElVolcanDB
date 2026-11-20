export const Variables = {
  apiUrl: (import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1').replace(/\/$/, ''),
  cartoApiKey: import.meta.env.VITE_CARTO_API_KEY || 'cb1_5cey_1_390156d70f064b013bee2008',
  tokenKey: 'token',
  sesionKey: 'usuario_sesion',
}
