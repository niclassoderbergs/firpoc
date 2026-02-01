import { CU, SPG, Bid } from './types';
// Re-exporting the types
export type { CU, SPG, Bid };

import { mockBSPs } from './data/bsps';
import { mockDSOs } from './data/dsos';
import { mockREs } from './data/res';
import { mockBRPs } from './data/brps';
import { mockCUs } from './data/cus';
import { mockSPGs } from './data/spgs';
import { mockGridConstraints } from './data/gridConstraints';
import { svkProducts } from './data/products';
import { baselineMethods } from './data/baselines';
import { mockBids } from './data/bids';
import { mockMarketStats, swedishMarketTotals } from './data/marketStats';
import { mockSPGProductApplications } from './data/spgProductApplications';
import { mockSPApplications } from './data/spApplications';

// SYSTEM TIME LOCK - Set to 2026 to enable demonstration of historical actor changes
export const POC_NOW = new Date('2026-01-31T10:00:00Z');

// Re-export static data lists
export { mockBSPs } from './data/bsps';
export { mockDSOs } from './data/dsos';
export { mockREs } from './data/res';
export { mockBRPs } from './data/brps';
export { mockCUs } from './data/cus';
export { mockSPGs } from './data/spgs';
export { mockGridConstraints } from './data/gridConstraints';
export { svkProducts } from './data/products';
export { baselineMethods } from './data/baselines';
export { mockBids } from './data/bids';
export { mockMarketStats, swedishMarketTotals } from './data/marketStats';
export { mockSPGProductApplications } from './data/spgProductApplications';
export { mockSPApplications } from './data/spApplications';
