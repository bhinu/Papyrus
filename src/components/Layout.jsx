import Navbar from '@/components/Navbar'

function Layout({ children }) {
  return (
    <div className="mx-auto min-h-screen w-full max-w-6xl px-6 pb-12 pt-6 md:px-10">
      <Navbar />
      <main className="mt-8">{children}</main>
    </div>
  )
}

export default Layout
