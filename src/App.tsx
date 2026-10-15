import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { useStore } from './state/store';

const Home = lazy(() => import('./pages/Home'));
const Welcome = lazy(() => import('./pages/Welcome'));
const Discover = lazy(() => import('./pages/discover/Discover'));
const Assessment = lazy(() => import('./pages/discover/Assessment'));
const Purpose = lazy(() => import('./pages/purpose/Purpose'));
const PurposeSection = lazy(() => import('./pages/purpose/PurposeSection'));
const Careers = lazy(() => import('./pages/careers/Careers'));
const CareerDetail = lazy(() => import('./pages/careers/CareerDetail'));
const TryIt = lazy(() => import('./pages/try/TryIt'));
const SimulationRunner = lazy(() => import('./pages/try/SimulationRunner'));
const Experiments = lazy(() => import('./pages/try/Experiments'));
const ExperimentDetail = lazy(() => import('./pages/try/ExperimentDetail'));
const Compare = lazy(() => import('./pages/compare/Compare'));
const EducationRoi = lazy(() => import('./pages/compare/EducationRoi'));
const MyPath = lazy(() => import('./pages/path/MyPath'));
const Report = lazy(() => import('./pages/path/Report'));
const About = lazy(() => import('./pages/About'));
const YourData = lazy(() => import('./pages/YourData'));
const Brand = lazy(() => import('./pages/Brand'));
const NotFound = lazy(() => import('./pages/NotFound'));
const Achievements = lazy(() => import('./pages/Achievements'));

// The brand system page is an internal tool, not part of the public site. It is available in
// local development, or in a build made with VITE_SHOW_BRAND=1 (used to render the brand guide PDF).
const SHOW_BRAND = import.meta.env.DEV || import.meta.env.VITE_SHOW_BRAND === '1';

function Loading() {
  return (
    <div className="wrap loading" aria-live="polite">
      <span className="visually-hidden">Loading</span>
    </div>
  );
}

export function App() {
  const { ready } = useStore();
  return (
    <Layout>
      {ready ? (
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/welcome" element={<Welcome />} />
            <Route path="/discover" element={<Discover />} />
            <Route path="/discover/:id" element={<Assessment />} />
            <Route path="/purpose" element={<Purpose />} />
            <Route path="/purpose/:section" element={<PurposeSection />} />
            <Route path="/careers" element={<Careers />} />
            <Route path="/careers/:id" element={<CareerDetail />} />
            <Route path="/try" element={<TryIt />} />
            <Route path="/try/experiments" element={<Experiments />} />
            <Route path="/try/experiments/:id" element={<ExperimentDetail />} />
            <Route path="/try/:id" element={<SimulationRunner />} />
            <Route path="/compare" element={<Compare />} />
            <Route path="/compare/education" element={<EducationRoi />} />
            <Route path="/path" element={<MyPath />} />
            <Route path="/path/report" element={<Report />} />
            <Route path="/about" element={<About />} />
            <Route path="/data" element={<YourData />} />
            {SHOW_BRAND && <Route path="/brand" element={<Brand />} />}
            <Route path="/achievements" element={<Achievements />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      ) : (
        <Loading />
      )}
    </Layout>
  );
}
