import { CSSProperties, ReactNode, useEffect, useRef } from "react"

type SelecableParam = {
  children: ReactNode,
  /**
   * 选择位置
   */
  selectPos: [number, number],
  /**
   * 选择位置变化时触发，返回新位置
   * TODO 如果有性能问题（虽然不太可能），做防抖（设置selector的位置按理说不会有啥性能问题，如果其上的业务操作需要防抖，那就它去做好了）
   * @returns 
   */
  onSelectPosChanged: (newPos: [number, number]) => void,

  /**
   * 选择器的样式
   */
  selectorStyle?: CSSProperties,

  /**
   * 选择位置的约束函数，保证新的选择位置不会超出约束，默认以子元素长宽为界
   */
  clamp?: (pos: [x: number, y: number], geo: [width: number, height: number]) => [x: number, y: number],

  /**
   * 允许开始选择的函数，保证只有在点击相应位置时才能开始选择，默认以子元素长宽为界
   */
  selectable?: (pos: [x: number, y: number], geo: [width: number, height: number]) => boolean,
}

/**
 * TODO 提供边界约束
 * TODO 允许规定selector的样式
 */
function Selectable({ children, selectPos, onSelectPosChanged, clamp, selectable, selectorStyle = {} }: SelecableParam) {
  const ref = useRef(null as unknown as HTMLDivElement)
  
  // clamp用引用给它存着，它只是在钩子的内部被使用，如果每次 clamp 改变就把钩子移除和添加会导致其无法工作
  const clampRef = useRef<SelecableParam['clamp']>();
  useEffect(() => {
    if (clamp) {
      clampRef.current = clamp
    } else {
      clampRef.current = (([x, y], [w, h]) => [realClamp(x, 0, w), realClamp(y, 0, h)])
    }
  }, [clamp])
  const selectableRef = useRef<SelecableParam['selectable']>()
  useEffect(() => {
    if (selectable) {
      selectableRef.current = selectable
    } else {
      selectableRef.current = ([x, y], [w, h]) => x >= 0 && x <= w && y >= 0 && y <= h
    }
  }, [selectable])
  useEffect(() => {
    let selecting = false
    function startSelecting(event: MouseEvent) {
      if (!selectableRef.current) {
        return
      }
      const rect = ref.current.getBoundingClientRect();
      if (!selectableRef.current([event.clientX - rect.left, event.clientY - rect.top], [rect.width, rect.height])) {
        return
      }
      selecting = true;
      select(event);
    }

    function stopSelecting() {
      selecting = false;
    }

    function select(event: MouseEvent) {
      if (!selecting || !clampRef.current) { return }

      const rect = ref.current.getBoundingClientRect();
      onSelectPosChanged(clampRef.current([event.clientX - rect.left, event.clientY - rect.top], [rect.width, rect.height]))
    }

    document.addEventListener('mousedown', startSelecting);
    document.addEventListener('mousemove', select);
    document.addEventListener('mouseup', stopSelecting);
    // canvas.current.addEventListener('mouseleave', stopPicking);
    return () => {
      document.removeEventListener('mousedown', startSelecting);
      document.removeEventListener('mousemove', select);
      document.removeEventListener('mouseup', stopSelecting);
      // canvas.current.removeEventListener('mouseleave', stopPicking);
    }
  }, [onSelectPosChanged])

  return (
    <div ref={ref} style={{ padding: 0, margin: 0, position: 'relative', cursor: 'crosshair', width: 'fit-content', height: 'fit-content' }}>
      <div style={{ 
        pointerEvents: 'none', 
        width: '14px', 
        height: '14px',
        borderRadius: '100%', 
        border: `2px solid ${'white'}`, 
        position: 'absolute', 
        top: selectPos[1], 
        left: selectPos[0], 
        transform: 'translate(-50%, -50%)',
        ...selectorStyle}}></div>
      {children}
    </div>
  )
}


function realClamp(x: number, min: number, max: number) {
  return Math.min(Math.max(x, min), max)
}

export default Selectable