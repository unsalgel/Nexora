export interface UserClaims {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
}

export function decodeJwt(token: string): UserClaims | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    
    const parsed = JSON.parse(jsonPayload);
    
    // Claim tip adlarını eşleştiriyoruz
    const id = parsed['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || '';
    const email = parsed['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] || '';
    const firstName = parsed['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname'] || '';
    const lastName = parsed['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname'] || '';
    
    // Roller dizi veya tekil olabilir
    const rolesClaim = parsed['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || [];
    const roles = Array.isArray(rolesClaim) ? rolesClaim : [rolesClaim];

    return { id, email, firstName, lastName, roles };
  } catch (e) {
    return null;
  }
}
