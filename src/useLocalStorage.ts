import { useEffect, useCallback, useReducer, useRef, } from "react"


let counter = 0
function uuid(): string {
    return counter++ + ''
}

const keyListeners: Record<string, Record<string, (newValue: string) => void>> = {}
export default function useLocalStorage(key: string): [value: string, setValue: (newValue: string) => void] { 
    const keyState = useRef(key)
    useEffect(() => {
        keyState.current = key
    }, [key])

    const [, refresh] = useReducer(x => x + 1, 0) 
    useEffect(() => {
        keyListeners[key] ??= {}
        const id = uuid()
        keyListeners[key][id] = refresh
        return () => {
            delete keyListeners[key][id]
        }
    }, [key])
    const setter = useCallback((newValue: string) => {
        console.log('local setter', keyState.current, newValue)
        localStorage.setItem( keyState.current, newValue)
        Object.values(keyListeners[ keyState.current] ?? {}).forEach(x => x(newValue))
    }, [])
    return [localStorage.getItem(key) ?? '', setter]
}

