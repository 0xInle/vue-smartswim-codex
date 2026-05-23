import { isApplicationStatusActive } from './applicationLifecycle.js'
import { isSupabaseCompetitionApplicationSource } from './applicationSource.js'
import {
  applyCompetitionApplicationPatch,
  createCompetitionApplicationRecord,
  getCompetitionApplicationStageNumber,
  normalizeCompetitionApplicationRecord,
  resolveCompetitionApplicationStageId,
} from './applicationRecords.js'
import {
  COMPETITION_APPLICATIONS_STORAGE_PREFIX,
  buildCompetitionApplicationsStorageKey,
  buildCompetitionApplicationsStorageKeyFromUserKey,
  getCompetitionApplicationUserKey,
  getCompetitionApplicationsStorageKeys,
  readCompetitionApplicationsByStorageKey,
  writeCompetitionApplicationsByStorageKey,
} from './localApplicationStorage.js'
import {
  createSupabaseCompetitionApplication,
  fetchAllCompetitionApplicationsForAdmin,
  fetchCompetitionApplicationsForCurrentUser,
  subscribeToCompetitionApplications,
  updateSupabaseCompetitionApplication,
} from './supabaseApplicationAdapter.js'

export {
  createCompetitionApplicationId,
  createCompetitionApplicationRecord,
  getCompetitionApplicationStageNumber,
  resolveCompetitionApplicationStageId,
} from './applicationRecords.js'

export function readCompetitionApplications(currentUser) {
  return readCompetitionApplicationsByStorageKey(
    buildCompetitionApplicationsStorageKey(currentUser),
    getCompetitionApplicationUserKey(currentUser),
  )
}

export function readAllCompetitionApplications() {
  const storagePrefix = `${COMPETITION_APPLICATIONS_STORAGE_PREFIX}:`

  return getCompetitionApplicationsStorageKeys().flatMap((storageKey) => {
    const sourceUserKey = storageKey.slice(storagePrefix.length)

    return readCompetitionApplicationsByStorageKey(storageKey, sourceUserKey)
  })
}

export function persistCompetitionApplications(currentUser, applications) {
  writeCompetitionApplicationsByStorageKey(
    buildCompetitionApplicationsStorageKey(currentUser),
    applications,
  )
}

export function persistCompetitionApplicationsByUserKey(userKey, applications) {
  writeCompetitionApplicationsByStorageKey(
    buildCompetitionApplicationsStorageKeyFromUserKey(userKey),
    applications,
  )
}

export function countCompetitionApplicationsByStageId(stageId, { status = 'active' } = {}) {
  if (!stageId) {
    return 0
  }

  return readAllCompetitionApplications().filter((application) => {
    if (application.stageId !== stageId) {
      return false
    }

    if (status === 'all') {
      return true
    }

    if (status === 'active') {
      return isApplicationStatusActive(application.status)
    }

    return application.status === status
  }).length
}

function countApplicationsByStageId(applications, stageId, { status = 'active' } = {}) {
  if (!stageId) {
    return 0
  }

  return applications.filter((application) => {
    if (application.stageId !== stageId) {
      return false
    }

    if (status === 'all') {
      return true
    }

    if (status === 'active') {
      return isApplicationStatusActive(application.status)
    }

    return application.status === status
  }).length
}

function countApplicationsForParticipant(
  applications,
  { participantKind = '', participantId = '', status = 'active' } = {},
) {
  if (!participantKind || !participantId) {
    return 0
  }

  return applications.filter((application) => {
    if (
      application.participantKind !== participantKind ||
      application.participantId !== participantId
    ) {
      return false
    }

    if (status === 'all') {
      return true
    }

    if (status === 'active') {
      return isApplicationStatusActive(application.status)
    }

    return application.status === status
  }).length
}

export async function countCompetitionApplicationsByStageIdFromSource(
  stageId,
  { status = 'active' } = {},
) {
  if (isSupabaseCompetitionApplicationSource()) {
    const applications = await fetchAllCompetitionApplicationsForAdmin()

    return countApplicationsByStageId(applications, stageId, { status })
  }

  return countCompetitionApplicationsByStageId(stageId, { status })
}

export function updateCompetitionApplication(
  currentUser,
  applicationId,
  patch = {},
  { statusChangedBy = 'user' } = {},
) {
  if (!applicationId) {
    return null
  }

  const applications = readCompetitionApplications(currentUser)
  const targetApplication = applications.find((item) => item.id === applicationId)

  if (!targetApplication) {
    return null
  }

  const updatedApplication = applyCompetitionApplicationPatch(targetApplication, patch, {
    statusChangedBy,
  })

  persistCompetitionApplications(
    currentUser,
    applications.map((item) => (item.id === applicationId ? updatedApplication : item)),
  )

  return updatedApplication
}

export function updateCompetitionApplicationStatus(
  currentUser,
  applicationId,
  status,
  { statusChangedBy = 'user' } = {},
) {
  return updateCompetitionApplication(currentUser, applicationId, { status }, { statusChangedBy })
}

export async function loadCompetitionApplicationsForCurrentUser(currentUser) {
  if (isSupabaseCompetitionApplicationSource()) {
    return fetchCompetitionApplicationsForCurrentUser()
  }

  return readCompetitionApplications(currentUser)
}

export async function loadAllCompetitionApplicationsForAdmin() {
  if (isSupabaseCompetitionApplicationSource()) {
    return fetchAllCompetitionApplicationsForAdmin()
  }

  return readAllCompetitionApplications()
}

export async function createCompetitionApplication(currentUser, application) {
  if (isSupabaseCompetitionApplicationSource()) {
    return createSupabaseCompetitionApplication(application)
  }

  const applications = readCompetitionApplications(currentUser)
  const record = normalizeCompetitionApplicationRecord(
    application,
    getCompetitionApplicationUserKey(currentUser),
  )

  persistCompetitionApplications(currentUser, [record, ...applications])

  return record
}

export async function patchCompetitionApplication(
  currentUser,
  applicationId,
  patch = {},
  { statusChangedBy = 'user' } = {},
) {
  if (isSupabaseCompetitionApplicationSource()) {
    return updateSupabaseCompetitionApplication(applicationId, {
      ...patch,
      statusChangedBy: patch.statusChangedBy || statusChangedBy,
    })
  }

  return updateCompetitionApplication(currentUser, applicationId, patch, { statusChangedBy })
}

export async function patchCompetitionApplicationByUserKey(
  userKey,
  applicationId,
  patch = {},
  { statusChangedBy = 'admin' } = {},
) {
  if (isSupabaseCompetitionApplicationSource()) {
    return updateSupabaseCompetitionApplication(applicationId, {
      ...patch,
      statusChangedBy: patch.statusChangedBy || statusChangedBy,
    })
  }

  return updateCompetitionApplicationByUserKey(userKey, applicationId, patch, { statusChangedBy })
}

export function subscribeToCompetitionApplicationChanges(callback) {
  if (isSupabaseCompetitionApplicationSource()) {
    return subscribeToCompetitionApplications(callback)
  }

  return () => {}
}

export function updateCompetitionApplicationByUserKey(
  userKey,
  applicationId,
  patch = {},
  { statusChangedBy = 'admin' } = {},
) {
  if (!userKey || !applicationId) {
    return null
  }

  const storageKey = buildCompetitionApplicationsStorageKeyFromUserKey(userKey)
  const applications = readCompetitionApplicationsByStorageKey(storageKey, userKey)
  const targetApplication = applications.find((item) => item.id === applicationId)

  if (!targetApplication) {
    return null
  }

  const updatedApplication = applyCompetitionApplicationPatch(
    targetApplication,
    {
      ...patch,
      sourceUserKey: userKey,
    },
    { statusChangedBy },
  )

  persistCompetitionApplicationsByUserKey(
    userKey,
    applications.map((item) => (item.id === applicationId ? updatedApplication : item)),
  )

  return updatedApplication
}

export function updateCompetitionApplicationsByStageId(
  stageId,
  patch = {},
  { statusChangedBy = 'admin' } = {},
) {
  if (!stageId) {
    return 0
  }

  const storagePrefix = `${COMPETITION_APPLICATIONS_STORAGE_PREFIX}:`
  let updatedCount = 0

  getCompetitionApplicationsStorageKeys().forEach((storageKey) => {
    const sourceUserKey = storageKey.slice(storagePrefix.length)
    const applications = readCompetitionApplicationsByStorageKey(storageKey, sourceUserKey)

    if (!applications.length) {
      return
    }

    let hasUpdates = false
    const nextApplications = applications.map((application) => {
      const normalizedApplication = normalizeCompetitionApplicationRecord(
        application,
        sourceUserKey,
      )

      if (normalizedApplication.stageId !== stageId) {
        return normalizedApplication
      }

      hasUpdates = true
      updatedCount += 1

      return applyCompetitionApplicationPatch(
        normalizedApplication,
        {
          ...patch,
          stageId,
        },
        { statusChangedBy },
      )
    })

    if (hasUpdates) {
      writeCompetitionApplicationsByStorageKey(storageKey, nextApplications)
    }
  })

  return updatedCount
}

export async function updateCompetitionApplicationsByStageIdFromSource(
  stageId,
  patch = {},
  { statusChangedBy = 'admin' } = {},
) {
  if (isSupabaseCompetitionApplicationSource()) {
    if (!stageId) {
      return 0
    }

    const applications = await fetchAllCompetitionApplicationsForAdmin()
    const targetApplications = applications.filter((application) => application.stageId === stageId)

    await Promise.all(
      targetApplications.map((application) =>
        updateSupabaseCompetitionApplication(application.id, {
          ...patch,
          stageId,
          statusChangedBy: patch.statusChangedBy || statusChangedBy,
        }),
      ),
    )

    return targetApplications.length
  }

  return updateCompetitionApplicationsByStageId(stageId, patch, { statusChangedBy })
}

export function countCompetitionApplicationsForParticipant(
  currentUser,
  { participantKind = '', participantId = '', status = 'active' } = {},
) {
  if (!participantKind || !participantId) {
    return 0
  }

  return readCompetitionApplications(currentUser).filter((application) => {
    if (
      application.participantKind !== participantKind ||
      application.participantId !== participantId
    ) {
      return false
    }

    if (status === 'all') {
      return true
    }

    if (status === 'active') {
      return isApplicationStatusActive(application.status)
    }

    return application.status === status
  }).length
}

export async function countCompetitionApplicationsForParticipantFromSource(
  currentUser,
  { participantKind = '', participantId = '', status = 'active' } = {},
) {
  if (isSupabaseCompetitionApplicationSource()) {
    const applications = await fetchCompetitionApplicationsForCurrentUser()

    return countApplicationsForParticipant(applications, { participantKind, participantId, status })
  }

  return countCompetitionApplicationsForParticipant(currentUser, {
    participantKind,
    participantId,
    status,
  })
}

export function syncCompetitionApplicationOwnerSnapshot(currentUser, profile = {}) {
  const applications = readCompetitionApplications(currentUser)

  if (!applications.length) {
    return 0
  }

  let updatedCount = 0
  const now = new Date().toISOString()
  const nextApplications = applications.map((application) => {
    const ownerPatch = {
      ownerName: profile.fullName || application.ownerName,
      ownerEmail: profile.email || application.ownerEmail,
      ownerPhone: profile.phone || application.ownerPhone,
      updatedAt: now,
    }

    if (application.participantKind !== 'owner') {
      updatedCount += 1
      return {
        ...application,
        ...ownerPatch,
      }
    }

    updatedCount += 1
    return {
      ...application,
      ...ownerPatch,
      participantName: profile.fullName || application.participantName,
      participantBirthDate: profile.birthDate || application.participantBirthDate,
      participantClub: profile.club || application.participantClub,
      participantPhone: profile.phone || application.participantPhone,
      participantEmail: profile.email || application.participantEmail,
    }
  })

  persistCompetitionApplications(currentUser, nextApplications)

  return updatedCount
}

export async function syncCompetitionApplicationOwnerSnapshotFromSource(currentUser, profile = {}) {
  if (isSupabaseCompetitionApplicationSource()) {
    return 0
  }

  return syncCompetitionApplicationOwnerSnapshot(currentUser, profile)
}

export function syncCompetitionApplicationAthleteSnapshot(currentUser, athlete = {}) {
  if (!athlete?.id) {
    return 0
  }

  const applications = readCompetitionApplications(currentUser)
  let updatedCount = 0
  const now = new Date().toISOString()
  const nextApplications = applications.map((application) => {
    if (application.participantKind !== 'athlete' || application.participantId !== athlete.id) {
      return application
    }

    updatedCount += 1

    return {
      ...application,
      participantName: athlete.fullName || application.participantName,
      participantBirthDate: athlete.birthDate || application.participantBirthDate,
      participantClub: athlete.club || application.participantClub,
      updatedAt: now,
    }
  })

  if (updatedCount > 0) {
    persistCompetitionApplications(currentUser, nextApplications)
  }

  return updatedCount
}

export async function syncCompetitionApplicationAthleteSnapshotFromSource(
  currentUser,
  athlete = {},
) {
  if (isSupabaseCompetitionApplicationSource()) {
    return 0
  }

  return syncCompetitionApplicationAthleteSnapshot(currentUser, athlete)
}
