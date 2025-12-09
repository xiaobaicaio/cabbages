import './App.css';
import React, { useState } from 'react'
import Excel from './pages/excel'
import Rendering3D from './pages/rendering-3d'

function App () {
  const [page, setPage] = useState('excel')
  return (
    <div className="App" style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: 8, display: 'flex', gap: 8, borderBottom: '1px solid #ddd' }}>
        <button onClick={() => setPage('excel')} disabled={page === 'excel'}>Excel</button>
        <button onClick={() => setPage('3d')} disabled={page === '3d'}>3D</button>
      </div>
      <div style={{ flex: 1 }}>
        {page === 'excel' ? <Excel /> : <Rendering3D />}
      </div>
    </div>
  );
}

export default App;
