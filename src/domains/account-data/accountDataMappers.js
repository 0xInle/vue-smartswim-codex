import { createAccountDocumentsState } from '@/pages/account/utils/accountDocumentTypes'

function padDatePart(value) {
  return String(value).padStart(2, '0')
}

export function formatDateForInput(value) {
  if (!value) {
    return ''
  }

  const normalizedValue = String(value)

  if (/^\d{2}\.\d{2}\.\d{4}$/.test(normalizedValue)) {
    return normalizedValue
  }

  const match = normalizedValue.match(/^(\d{4})-(\d{2})-(\d{2})/)

  if (!match) {
    return ''
  }

  return `${match[3]}.${match[2]}.${match[1]}`
}

export function formatDateForSupabase(value) {
  if (!value) {
    return null
  }

  const normalizedValue = String(value).trim()
  const match = normalizedValue.match(/^(\d{2})\.(\d{2})\.(\d{4})$/)

  if (!match) {
    return null
  }

  return `${match[3]}-${padDatePart(match[2])}-${padDatePart(match[1])}`
}

export function createEmptyAccountProfile(currentUser = null) {
  return {
    fullName: currentUser?.name || '',
    birthDate: '',
    club: '',
    phone: currentUser?.phone || '',
    email: currentUser?.email || '',
    experience: '',
    mainProfile: '',
    availableSeats: '',
    education: '',
    sportAchievements: '',
    worksWith: '',
    minAge: '',
    preparationLevel: '',
    metro: '',
    documents: createAccountDocumentsState(),
  }
}

export function mapSupabaseAccountProfileRow(row = {}, currentUser = null) {
  return {
    ...createEmptyAccountProfile(currentUser),
    fullName: row.full_name || currentUser?.name || '',
    birthDate: formatDateForInput(row.birth_date),
    club: row.club || '',
    phone: row.phone || currentUser?.phone || '',
    email: row.email || currentUser?.email || '',
    experience: row.experience || '',
    mainProfile: row.main_profile || '',
    availableSeats: row.available_seats || '',
    education: row.education || '',
    sportAchievements: row.sport_achievements || '',
    worksWith: row.works_with || '',
    minAge: row.min_age || '',
    preparationLevel: row.preparation_level || '',
    metro: row.metro || '',
  }
}

export function mapAccountProfileUpsertPayload(profile = {}, ownerUserId = '') {
  const payload = {
    owner_user_id: ownerUserId,
    full_name: profile.fullName || '',
    birth_date: formatDateForSupabase(profile.birthDate),
    club: profile.club || '',
    phone: profile.phone || '',
    email: profile.email || '',
  }

  if (Object.prototype.hasOwnProperty.call(profile, 'experience')) {
    payload.experience = profile.experience || ''
  }

  if (Object.prototype.hasOwnProperty.call(profile, 'mainProfile')) {
    payload.main_profile = profile.mainProfile || ''
  }

  if (Object.prototype.hasOwnProperty.call(profile, 'availableSeats')) {
    payload.available_seats = profile.availableSeats || ''
  }

  if (Object.prototype.hasOwnProperty.call(profile, 'education')) {
    payload.education = profile.education || ''
  }

  if (Object.prototype.hasOwnProperty.call(profile, 'sportAchievements')) {
    payload.sport_achievements = profile.sportAchievements || ''
  }

  if (Object.prototype.hasOwnProperty.call(profile, 'worksWith')) {
    payload.works_with = profile.worksWith || ''
  }

  if (Object.prototype.hasOwnProperty.call(profile, 'minAge')) {
    payload.min_age = profile.minAge || ''
  }

  if (Object.prototype.hasOwnProperty.call(profile, 'preparationLevel')) {
    payload.preparation_level = profile.preparationLevel || ''
  }

  if (Object.prototype.hasOwnProperty.call(profile, 'metro')) {
    payload.metro = profile.metro || ''
  }

  return payload
}

export function mapSupabaseAccountAthleteRow(row = {}) {
  return {
    id: row.id || '',
    fullName: row.full_name || '',
    birthDate: formatDateForInput(row.birth_date),
    gender: row.gender || '',
    club: row.club || '',
    rank: row.rank || '',
    coach: row.coach || '',
    documents: createAccountDocumentsState(),
    createdAt: row.created_at || '',
    updatedAt: row.updated_at || '',
  }
}

export function mapAccountAthleteUpsertPayload(athlete = {}, ownerUserId = '') {
  return {
    id: athlete.id || undefined,
    owner_user_id: ownerUserId,
    full_name: athlete.fullName || '',
    birth_date: formatDateForSupabase(athlete.birthDate),
    gender: athlete.gender || '',
    club: athlete.club || '',
    rank: athlete.rank || '',
    coach: athlete.coach || '',
  }
}
