export interface AdminUserClaims {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
}

export function decodeAdminJwt(token: string): AdminUserClaims | null {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    
    const parsed = JSON.parse(jsonPayload);
    
    const id = 
      parsed['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || 
      parsed['nameid'] || 
      parsed['sub'] || 
      '';

    const email = 
      parsed['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] || 
      parsed['email'] || 
      '';

    const firstName = 
      parsed['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname'] || 
      parsed['given_name'] || 
      parsed['firstName'] || 
      '';

    const lastName = 
      parsed['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname'] || 
      parsed['family_name'] || 
      parsed['lastName'] || 
      '';
    
    const rolesClaim = 
      parsed['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || 
      parsed['role'] || 
      parsed['roles'] || 
      [];
    const roles = Array.isArray(rolesClaim) ? rolesClaim : [rolesClaim];

    return { id, email, firstName, lastName, roles };
  } catch (e) {
    return null;
  }
}
