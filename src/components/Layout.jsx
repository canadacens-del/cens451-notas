import Sidebar from './Sidebar'
export default function Layout({ children }) {
  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#f8fafc' }}>
      <Sidebar />
      <main style={{ flex:1, padding:'2rem', overflowY:'auto' }}>{children}</main>
    </div>
  )
}
