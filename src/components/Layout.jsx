import Sidebar from './Sidebar'

export default function Layout({ children }) {
  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#f8fafc' }}>
      <Sidebar />
      <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0 }}>
        <main style={{ flex:1, padding:'1.5rem', overflowY:'auto' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
