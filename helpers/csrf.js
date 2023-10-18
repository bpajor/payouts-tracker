import { csrfSync } from "csrf-sync";

export const {
    invalidCsrfTokenError, 
    generateToken, 
    getTokenFromRequest, 
    getTokenFromState, 
    storeTokenInState, 
    revokeToken, 
    csrfSynchronisedProtection, 
  } = csrfSync();