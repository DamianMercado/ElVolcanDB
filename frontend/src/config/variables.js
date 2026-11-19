export const Variables = {
  apiUrl: (import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1').replace(/\/$/, ''),
  tokenKey: 'token',
  sesionKey: 'usuario_sesion',
}
