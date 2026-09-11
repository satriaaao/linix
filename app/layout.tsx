import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'BSM Rental — Camera & Production Equipment',
  description: 'Rental kamera, lensa, lighting, audio, grip, drone dan production equipment profesional di Jakarta, Bandung, Yogyakarta dan Surabaya.'
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body>{children}</body></html>
}
