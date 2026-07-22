import './sidebar.css'

function Sidebar() {
  return (
    <aside className="sidebar">
      <details className="sidebar__collection">
        <summary className="sidebar__summary">Collection1</summary>
      </details>

      <details className="sidebar__collection">
        <summary className="sidebar__summary">Collection2</summary>
      </details>
    </aside>
  )
}

export default Sidebar
