export const CRM_ROLE = Object.freeze({
  ADMIN: 'admin',
  TRAINER: 'trainer',
  USER: 'user',
  ATHLETE: 'athlete',
})

export const CRM_ROLE_LABEL = Object.freeze({
  [CRM_ROLE.ADMIN]: 'Администратор',
  [CRM_ROLE.TRAINER]: 'Тренер',
  [CRM_ROLE.USER]: 'Пользователь',
  [CRM_ROLE.ATHLETE]: 'Спортсмен',
})

export function isAdminRole(role) {
  return role === CRM_ROLE.ADMIN
}

export function getCrmRoleLabel(role) {
  return CRM_ROLE_LABEL[role] || 'Пользователь'
}
