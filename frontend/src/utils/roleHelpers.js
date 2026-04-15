export const ROLES = {
  ADMIN:       'ROLE_ADMINISTRATEUR',
  RESPONSABLE: 'ROLE_RESPONSABLE_STAGE',
  ENCADRANT:   'ROLE_ENCADRANT',
  STAGIAIRE:   'ROLE_STAGIAIRE',
};
 
export const getDashboardPath = (role) => {
  switch (role) {
    case ROLES.ADMIN:       return '/admin/dashboard';
    case ROLES.RESPONSABLE: return '/responsable/dashboard';
    case ROLES.ENCADRANT:   return '/encadrant/dashboard';
    case ROLES.STAGIAIRE:   return '/stagiaire/dashboard';
    default:                return '/login';
  }
};
 
export const getRoleLabel = (role) => {
  switch (role) {
    case ROLES.ADMIN:       return 'Administrateur';
    case ROLES.RESPONSABLE: return 'Responsable de Stage';
    case ROLES.ENCADRANT:   return 'Encadrant';
    case ROLES.STAGIAIRE:   return 'Stagiaire';
    default:                return 'Inconnu';
  }
};
 
export const getRoleBadgeClass = (role) => {
  switch (role) {
    case ROLES.ADMIN:       return 'role-admin';
    case ROLES.RESPONSABLE: return 'role-responsable';
    case ROLES.ENCADRANT:   return 'role-encadrant';
    case ROLES.STAGIAIRE:   return 'role-stagiaire';
    default:                return '';
  }
};