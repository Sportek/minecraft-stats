import { AllCommunityModule, ModuleRegistry } from "ag-charts-community";

// AG Charts v13 requires explicit module registration before any chart renders.
// Importing this module for its side effect registers the community feature set once.
ModuleRegistry.registerModules([AllCommunityModule]);
