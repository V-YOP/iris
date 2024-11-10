import { ColourModes } from "chromatism"
import { useEffect, useState, use, useReducer } from "react"

type GameState = {
    // when a new question comes
    type: 'NEW_QUESTION', 
    question: [number, number, number],
} | {
    // after answering question
    type: 'WAITING',
    question: [number, number, number],
    scores: number[],

} 

// 0-1 RGB
function randomRGB(): [number,number,number] {
    return [Math.random(), Math.random(), Math.random()]
}

export default function useGameLoop() {
    const [state, gameState] = useState<GameState>({
        type: 'NEW_QUESTION', question: randomRGB()
    })   
    
}

