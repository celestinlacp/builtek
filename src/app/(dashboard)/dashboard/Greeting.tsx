'use client'

export default function Greeting({ firstName }: { firstName: string }) {
  const hour = new Date().getHours()
  const text = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches'
  return <>{text}, {firstName} 👋</>
}
