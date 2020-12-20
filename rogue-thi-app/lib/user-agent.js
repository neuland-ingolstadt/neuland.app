export const OS_ANDROID = 'android'
export const OS_IOS = 'ios'
export const OS_OTHER = 'other'

export function getOperatingSystem () {
  if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
    return OS_IOS
  } else if (/Android/.test(navigator.userAgent)) {
    return OS_ANDROID
  } else {
    return OS_OTHER
  }
}
