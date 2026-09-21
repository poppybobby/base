import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Footer, Header } from './components/Chrome'
import { ComparePage } from './pages/Compare'
import { GuidePage } from './pages/Guide'
import { HomePage } from './pages/Home'
import { InquiryPage } from './pages/Inquiry'
import { LotDetailPage } from './pages/LotDetail'
import { LotsPage } from './pages/Lots'
import { SavedPage } from './pages/Saved'

export default function App() {
  return (
    <BrowserRouter>
      <div className="shell">
        <Header />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/lots" element={<LotsPage />} />
          <Route path="/lots/:id" element={<LotDetailPage />} />
          <Route path="/guide" element={<GuidePage />} />
          <Route path="/inquiry" element={<InquiryPage />} />
          <Route path="/saved" element={<SavedPage />} />
          <Route path="/compare" element={<ComparePage />} />
        </Routes>
        <Footer />
      </div>
    </BrowserRouter>
  )
}
