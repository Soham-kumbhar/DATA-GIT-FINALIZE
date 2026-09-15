import { Routes, Route } from 'react-router-dom';

import { HomePage } from '../../features/home/HomePage';

import { DatasetLibraryPage } from '../../features/datasets/DatasetLibraryPage';
import { DatasetOverviewPage } from '../../features/datasets/DatasetOverviewPage';
import { DatasetProfilePage } from '../../features/datasets/DatasetProfilePage';
import { DatasetQualityPage } from '../../features/datasets/DatasetQualityPage';
import { DatasetProjectsPage } from '../../features/datasets/DatasetProjectsPage';

import { ProjectsPage } from '../../features/projects/ProjectsPage';
import { CreateProjectPage } from '../../features/projects/CreateProjectPage';
import { ProjectOverviewPage } from '../../features/projects/ProjectOverviewPage';
import { VersionsPage } from '../../features/projects/VersionsPage';
import { VersionDetailPage } from '../../features/projects/VersionDetailPage';

import { DataPreparationPage } from '../../features/data-preparation/DataPreparationPage';
import { UploadDatasetPage } from '../../features/data-preparation/UploadDatasetPage';
import { DatasetPreparationProfilePage } from '../../features/data-preparation/DatasetPreparationProfilePage';
import { ConfigurePreparationPage } from '../../features/data-preparation/ConfigurePreparationPage';
import { ValidatePreparationPage } from '../../features/data-preparation/ValidatePreparationPage';
import { ExecutePreparationPage } from '../../features/data-preparation/ExecutePreparationPage';
import { PreparationResultPage } from '../../features/data-preparation/PreparationResultPage';

import ReportsPage from '../../features/reports/ReportsPage';
import ComparePage from '../../features/compare/ComparePage';

export function AppRouter() {
  return (
    <Routes>
      <Route
        path="/"
        element={<HomePage />}
      />

      <Route
        path="/datasets"
        element={<DatasetLibraryPage />}
      />

      <Route
        path="/datasets/:datasetId"
        element={<DatasetOverviewPage />}
      />

      <Route
        path="/datasets/:datasetId/profile"
        element={<DatasetProfilePage />}
      />

      <Route
        path="/datasets/:datasetId/quality"
        element={<DatasetQualityPage />}
      />

      <Route
        path="/datasets/:datasetId/projects"
        element={<DatasetProjectsPage />}
      />

      <Route
        path="/projects"
        element={<ProjectsPage />}
      />

      <Route
        path="/projects/new"
        element={<CreateProjectPage />}
      />

      <Route
        path="/projects/:projectId"
        element={<ProjectOverviewPage />}
      />

      <Route
        path="/projects/:projectId/versions"
        element={<VersionsPage />}
      />

      <Route
        path="/projects/:projectId/versions/:versionId"
        element={<VersionDetailPage />}
      />

      <Route
        path="/data-preparation"
        element={<DataPreparationPage />}
      />

      <Route
        path="/data-preparation/upload"
        element={<UploadDatasetPage />}
      />

      <Route
        path="/data-preparation/profile/:filename"
        element={
          <DatasetPreparationProfilePage />
        }
      />

      <Route
        path="/data-preparation/configure"
        element={
          <ConfigurePreparationPage />
        }
      />

      <Route
        path="/data-preparation/validate"
        element={
          <ValidatePreparationPage />
        }
      />

      <Route
        path="/data-preparation/execute"
        element={
          <ExecutePreparationPage />
        }
      />

      <Route
        path="/data-preparation/result"
        element={
          <PreparationResultPage />
        }
      />

      <Route
        path="/reports"
        element={<ReportsPage />}
      />

      <Route
        path="/compare"
        element={<ComparePage />}
      />
    </Routes>
  );
}

export default AppRouter;