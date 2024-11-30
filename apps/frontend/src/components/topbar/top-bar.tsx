interface StyledTopBarProps {
  children: React.ReactNode
}

export function StyledTopBar({ children }: StyledTopBarProps) {
  return (
    <div className="w-full border-b px-3 py-2 flex justify-between items-center h-[50px]">
      {children}
    </div>
  )
}
