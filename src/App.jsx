import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from '@/components/Layout'
import LandingPage from '@/pages/LandingPage'
import UploadPage from '@/pages/UploadPage'
import SplitPage from '@/pages/SplitPage'
import { ReceiptProvider } from '@/context/ReceiptContext'

function App() {
  return (
    <ReceiptProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/split" element={<SplitPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </ReceiptProvider>
  )
}

export default App
