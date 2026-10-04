import '@fontsource/be-vietnam-pro/400.css'
import '@fontsource/be-vietnam-pro/500.css'
import '@fontsource/be-vietnam-pro/600.css'
import '@fontsource/be-vietnam-pro/700.css'
import '@fontsource/montserrat/700.css'
import '@fontsource/montserrat/800.css'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles.css'
import './styles/linh-xuan-premium.css'
import './styles/linh-xuan-report-layout.css'
import './styles/linh-xuan-form-polish.css'
import './styles/linh-xuan-document-polish.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <React.Suspense
      fallback={
        <div className="app-loading" role="status" aria-live="polite">
          <span className="app-loading__mark" aria-hidden="true" />
          <strong>LINH XUÂN</strong>
          <small>Đang chuẩn bị phiếu đánh giá...</small>
        </div>
      }
    >
      <App />
    </React.Suspense>
  </React.StrictMode>,
)
