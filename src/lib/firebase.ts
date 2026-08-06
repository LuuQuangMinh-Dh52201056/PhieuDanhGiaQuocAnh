import {
  getApp,
  getApps,
  initializeApp,
} from 'firebase/app'

import {
  getAuth,
} from 'firebase/auth'

import {
  getFirestore,
} from 'firebase/firestore'

const firebaseConfig = {
  apiKey:
    import.meta.env
      .VITE_FIREBASE_API_KEY,

  authDomain:
    import.meta.env
      .VITE_FIREBASE_AUTH_DOMAIN,

  projectId:
    import.meta.env
      .VITE_FIREBASE_PROJECT_ID,

  storageBucket:
    import.meta.env
      .VITE_FIREBASE_STORAGE_BUCKET,

  messagingSenderId:
    import.meta.env
      .VITE_FIREBASE_MESSAGING_SENDER_ID,

  appId:
    import.meta.env
      .VITE_FIREBASE_APP_ID,

  measurementId:
    import.meta.env
      .VITE_FIREBASE_MEASUREMENT_ID,
}

const requiredConfig = {
  apiKey:
    firebaseConfig.apiKey,

  authDomain:
    firebaseConfig.authDomain,

  projectId:
    firebaseConfig.projectId,

  appId:
    firebaseConfig.appId,
}

const missingVariables =
  Object.entries(
    requiredConfig,
  )
    .filter(
      ([, value]) =>
        !String(
          value ?? '',
        ).trim(),
    )
    .map(
      ([key]) => key,
    )

if (
  missingVariables.length > 0
) {
  throw new Error(
    `Thiếu cấu hình Firebase: ${missingVariables.join(
      ', ',
    )}`,
  )
}

/**
 * Tránh khởi tạo Firebase nhiều lần
 * khi Vite tự tải lại trang trong chế độ dev.
 */
export const firebaseApp =
  getApps().length > 0
    ? getApp()
    : initializeApp(
        firebaseConfig,
      )

/**
 * Firebase Authentication:
 * dùng để đăng nhập giáo viên và admin.
 */
export const firebaseAuth =
  getAuth(firebaseApp)

/**
 * Cloud Firestore:
 * dùng để lưu toàn bộ phiếu đánh giá.
 */
export const firestoreDatabase =
  getFirestore(
    firebaseApp,
  )