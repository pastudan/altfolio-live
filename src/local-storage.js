export function getLocalStorage (key, defaultValue) {
  let value
  try {
    value = localStorage.getItem(key)
  } catch (e) {
    //no-op for safari private browsing mode
  }

  if (value === null) {
    return defaultValue
  } else {
    return JSON.parse(value)
  }
}

export function setLocalStorage (key, object) {
  try {
    localStorage.setItem(key, JSON.stringify(object))
  } catch (e) {
    //no-op for safari private browsing mode
  }
}