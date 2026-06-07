import { Route, Routes } from 'react-router-dom'
import Layout from '@/components/Layout'
import LandingPage from '@/pages/LandingPage'
import UploadPage from '@/pages/UploadPage'
import ParseResultPage from '@/pages/ParseResultPage'
import SplitPage from '@/pages/SplitPage'
import SummaryPage from '@/pages/SummaryPage'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/parse" element={<ParseResultPage />} />
        <Route path="/split" element={<SplitPage />} />
        <Route path="/summary" element={<SummaryPage />} />
      </Routes>
    </Layout>
  )
}

export default App
