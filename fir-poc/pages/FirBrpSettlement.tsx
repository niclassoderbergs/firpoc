import React, { useMemo, useState } from 'react';
import { pocStyles } from '../styles';
import { 
  FilePieChart, 
  Briefcase, 
  Download,
  Info,
  Calendar,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { mockBids, mockCUs, POC_NOW } from '../mockData';
import { isMissingMeterValues } from './FirVerificationList';

const PAGE_SIZE = 20;

interface Props {
  onSelectBid: (id: string) => void;
  onSelectParty: (name: string) => void;
}

const styles = {
    paginationContainer: {
        padding: '12px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTop: '1px solid #ebecf0',
        backgroundColor: '#fafbfc'
    }
};

const getSeededDeliveryFactor = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    let sum = 0;
    for (let i = 1; i <= 10; i++) {
        sum += Math.sin(hash * i * 9876.5432);
    }
    const avg = sum / 10; 
    return 1.0 + (avg * 0.4);
};

export const FirBrpSettlement: React.FC<Props> = ({ onSelectBid, onSelectParty }) => {
    const [currentPage, setCurrentPage] = useState(0);

    const displayDate = useMemo(() => {
        const targetDate = new Date(POC_NOW);
        targetDate.setUTCDate(POC_NOW.getUTCDate() - 2);
        return targetDate.toLocaleDateString('sv-SE');
    }, []);

    const dailyAggregation = useMemo(() => {
        const targetDate = new Date(POC_NOW);
        targetDate.setUTCDate(POC_NOW.getUTCDate() - 2);
        const dateStr = targetDate.toISOString().split('T')[0];

        const verifiedBids = mockBids.filter(bid => {
            return bid.timestamp.startsWith(dateStr) && 
                   bid.selectionStatus === 'Selected' && 
                   bid.status === 'Valid' && 
                   !isMissingMeterValues(bid.id);
        });

        const brpMap = new Map<string, any>();

        verifiedBids.forEach(bid => {
            const factor = getSeededDeliveryFactor(bid.id);
            const totalVerifiedMWh = bid.volumeMW * factor * 0.25;

            const groupCUs = mockCUs.filter(c => c.spgId === bid.spgId);
            if (groupCUs.length === 0) return;

            const shareMWh = totalVerifiedMWh / groupCUs.length;

            groupCUs.forEach(cu => {
                const brpName = cu.brp;
                const existing = brpMap.get(brpName) || { brp: brpName, count: 0, totalMWh: 0 };
                existing.count += 1;
                existing.totalMWh += shareMWh;
                brpMap.set(brpName, existing);
            });
        });

        return Array.from(brpMap.values()).sort((a, b) => b.totalMWh - a.totalMWh);
    }, []);

    const totalPages = Math.ceil(dailyAggregation.length / PAGE_SIZE);
    const pagedItems = useMemo(() => 
        dailyAggregation.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE)
    , [currentPage, dailyAggregation]);

    const totalVolume = useMemo(() => dailyAggregation.reduce((s, v) => s + v.totalMWh, 0), [dailyAggregation]);

    return (
        <div style={pocStyles.content}>
            <div style={{backgroundColor: '#eae6ff', borderLeft: '4px solid #403294', padding: '16px 20px', borderRadius: '4px', marginBottom: '32px'}}>
                <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'8px'}}>
                    <FilePieChart size={20} color="#403294" />
                    <strong style={{color: '#403294'}}>BRP Settlement: Imbalance Adjustment for {displayDate}</strong>
                </div>
                <p style={{margin: 0, fontSize: '0.9rem', color: '#172b4d', lineHeight: '1.5'}}>
                    Underlag för obalansjustering (neutralisering) per BRP för <strong>D-2 ({displayDate})</strong>. Volymen är allokerad baserat på de resurser (CU) som ingått i aktiverade portföljer.
                </p>
            </div>

            <div style={pocStyles.section}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                        <Calendar size={18} color="#403294" />
                        <h3 style={{...pocStyles.sectionTitle, borderBottom: 'none', marginBottom: 0}}>BRP Allocation Summary</h3>
                    </div>
                    <button style={{...pocStyles.actionButton, backgroundColor: '#fff', color: '#403294', border: '1px solid #403294', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem'}}><Download size={14} /> Export BRP XML</button>
                </div>
                <table style={pocStyles.table}>
                    <thead style={{backgroundColor: '#fafbfc'}}>
                        <tr>
                            <th style={pocStyles.th}>Balance Responsible Party</th>
                            <th style={{...pocStyles.th, textAlign: 'center'}}>Affected Resources</th>
                            <th style={{...pocStyles.th, textAlign: 'right'}}>Imbalance Correction (MWh)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pagedItems.map((row, idx) => (
                            <tr key={row.brp} style={{...pocStyles.row, backgroundColor: idx % 2 === 1 ? '#fafbfc' : '#fff'}}>
                                <td style={pocStyles.td}>
                                    <div style={{display:'flex', alignItems:'center', gap:'8px', color: '#0052cc', cursor: 'pointer', fontWeight: 600}} onClick={() => onSelectParty(row.brp)}>
                                        <Briefcase size={14} color="#6b778c" />
                                        <span style={{textDecoration: 'underline'}}>{row.brp}</span>
                                    </div>
                                </td>
                                <td style={{...pocStyles.td, textAlign: 'center'}}>{row.count}</td>
                                <td style={{...pocStyles.td, textAlign: 'right', fontWeight: 800, color: '#403294'}}>{row.totalMWh.toFixed(3)} MWh</td>
                            </tr>
                        ))}
                        {pagedItems.length === 0 && (
                            <tr>
                                <td colSpan={3} style={{...pocStyles.td, textAlign: 'center', padding: '32px', color: '#6b778c', fontStyle: 'italic'}}>
                                    Ingen verifierad data för valt dygn.
                                </td>
                            </tr>
                        )}
                    </tbody>
                    <tfoot style={{ backgroundColor: '#f4f5f7', borderTop: '2px solid #ebecf0' }}>
                        <tr>
                            <td colSpan={2} style={{ ...pocStyles.td, fontWeight: 700, textAlign: 'right' }}>TOTAL PERIMETER ADJUSTMENT:</td>
                            <td style={{ ...pocStyles.td, textAlign: 'right', fontWeight: 800, color: '#403294' }}>{totalVolume.toFixed(3)} MWh</td>
                        </tr>
                    </tfoot>
                </table>

                <div style={styles.paginationContainer}>
                    <span style={{fontSize: '0.85rem', color: '#6b778c'}}>
                        Showing {pagedItems.length} of {dailyAggregation.length} parties
                    </span>
                    <div style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
                        <button 
                            disabled={currentPage === 0}
                            onClick={() => setCurrentPage(p => p - 1)}
                            style={{
                                padding: '6px', borderRadius: '4px', border: '1px solid #dfe1e6', 
                                backgroundColor: currentPage === 0 ? '#f4f5f7' : '#fff',
                                cursor: currentPage === 0 ? 'not-allowed' : 'pointer'
                            }}
                        >
                            <ChevronLeft size={16} color={currentPage === 0 ? '#a5adba' : '#42526e'} />
                        </button>
                        <span style={{fontSize: '0.85rem', fontWeight: 600, color: '#172b4d', margin: '0 8px'}}>
                            Page {currentPage + 1} of {totalPages || 1}
                        </span>
                        <button 
                            disabled={currentPage >= totalPages - 1}
                            onClick={() => setCurrentPage(p => p + 1)}
                            style={{
                                padding: '6px', borderRadius: '4px', border: '1px solid #dfe1e6', 
                                backgroundColor: currentPage >= totalPages - 1 ? '#f4f5f7' : '#fff',
                                cursor: currentPage >= totalPages - 1 ? 'not-allowed' : 'pointer'
                            }}
                        >
                            <ChevronRight size={16} color={currentPage >= totalPages - 1 ? '#a5adba' : '#42526e'} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};