# Synoptics Module - Clean Architecture

## 📁 Folder Structure

### **UI Components**
- **`components/v2/`** - Modern UI components (Zustand + React Query)
- **`forms/`** - Page-level form components
- **`sites/`** - Site management feature

### **Data & State**
- **`hooks/`** - React Query hooks (server state)
- **`stores/`** - Zustand stores (UI state)
- **`api/`** - Centralized API client

### **Infrastructure**
- **`shared/`** - Cross-cutting utilities
- **`custom-edge.tsx`** - ReactFlow infrastructure
- **`index.ts`** - Public API exports

## 🏗️ Architecture Principles

| Layer | Responsibility | Technology |
|-------|----------------|------------|
| **UI Components** | User interfaces | React + TypeScript |
| **Data Layer** | Server state | React Query |
| **State Layer** | UI state | Zustand |
| **Infrastructure** | HTTP/API | Type-safe client |
| **Utilities** | Shared logic | Pure functions |

## ✅ Clean Separation

- **Forms**: Standalone page components
- **V2 Components**: Modern architecture with stores/hooks
- **Infrastructure**: Technical plumbing
- **Shared**: Cross-cutting concerns
