import './sidebar.css'

function Sidebar() {
  return (
    <aside className="sidebar">
      <details className="sidebar__collection">
        <summary className="sidebar__summary">Collection1</summary>
      </details>

      <details className="sidebar__collection" open>
        <summary className="sidebar__summary">Collection2</summary>
        <ul className="sidebar__list">
          <li className="sidebar__item sidebar__item--active">CSCI_3410</li>
        </ul>
      </details>
    </aside>
  )
}

export default Sidebar
