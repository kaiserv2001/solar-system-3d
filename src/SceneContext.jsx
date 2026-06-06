import { createContext, useContext } from 'react'

export const SceneContext = createContext({
  focusedPlanet: null,
  setFocusedPlanet: () => {},
  cameraRef: { current: null },
  controlsRef: { current: null },
  showOrbits: true,
  setShowOrbits: () => {},
  comparisonMode: false,
  setComparisonMode: () => {},
  timeScale: 1,
  setTimeScale: () => {},
  paused: false,
  setPaused: () => {},
})

export const useScene = () => useContext(SceneContext)
