
import React, { useMemo } from 'react';
import { pocStyles } from '../styles';
import { 
  FileBarChart, 
  Briefcase, 
  Download, 
  Info,
  Calendar
} from 'lucide-react';
import { mockBids, POC_NOW } from '../mockData';
import { isMissingMeterValues } from './FirVerificationList';

interface Props {
  onSelectBid: (id: string) => void;
  onSelectParty: (name: string) => void;
}

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

export const FirBspSettlement: React.FC<Props> = ({ onSelectBid, onSelectParty }) => {
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

        const bspMap = new Map<string, any>();

        verifiedBids.forEach(bid => {
            const factor = getSeededDeliveryFactor(bid.id);
            const verifiedPower = bid.volumeMW * factor;
            const verifiedEnergy = verifiedPower * 0.25; 

            const existing = bspMap.get(bid.bsp) || { 
                bsp: bid.bsp, 
                count: 0, 
                totalVerifiedMW: 0,
                totalVerifiedMWh: 0,
                accuracies: [] 
            };

            existing.count += 1;
            existing.totalVerifiedMW += verifiedPower;
            existing.totalVerifiedMWh += verifiedEnergy;
            existing.accuracies.push(factor * 100);
            
            bspMap.set(bid.bsp, existing);
        });

        return Array.from(bspMap.values()).map(item => ({
            ...item,
            avgAccuracy: Math.round(item.accuracies.reduce((a: number, b: number) => a + b, 0) / item.accuracies.length)
        })).sort((a, b) => b.totalVerifiedMWh - a.totalVerifiedMWh);
    }, []);

    const totals = useMemo(() => {
        return dailyAggregation.reduce((acc, curr) => ({
            count: acc.count + curr.count,
            mw: acc.mw + curr.totalVerifiedMW,
            mwh: acc.mwh + curr.totalVerifiedMWh
        }), { count: 0, mw: 0, mwh: 0 });
    }, [dailyAggregation]);

    return (
        <div style={pocStyles.content}>
            <div style={{backgroundColor: '#e3fcef', borderLeft: '4px solid #006644', padding: '16px 20px', borderRadius: '4px', marginBottom: '32px'}}>
                <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'8px'}}>
                    <FileBarChart size={20} color="#006644" />
                    <strong style={{color: '#006644'}}>BSP Settlement: Final Results for {displayDate}</strong>
                </div>
                <p style={{margin: 0, fontSize: '0.9rem', color: '#172b4d', lineHeight: '1.5'}}>
                    Aggregerat avräkningsunderlag per BSP för <strong>D-2 ({displayDate})</strong>. Bud med ofullständiga mätvärden exkluderas.
                </p>
            </div>

            <div style={pocStyles.section}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                        <Calendar size={18} color="#0052cc" />
                        <h3 style={{...pocStyles.sectionTitle, borderBottom: 'none', marginBottom: 0}}>
                            Settlement Summary
                        </h3>
                    </div>
                    <button style={{...pocStyles.actionButton, backgroundColor: '#fff', color: '#0052cc', border: '1px solid #0052cc', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem'}}>
                        <Download size={14} /> Export XML
                    </button>
                </div>
                
                <table style={pocStyles.table}>
                    <thead style={{backgroundColor: '#fafbfc'}}>
                        <tr>
                            <th style={pocStyles.th}>Balance Service Provider</th>
                            <th style={{...pocStyles.th, textAlign: 'center'}}>Activations</th>
                            <th style={{...pocStyles.th, textAlign: 'right'}}>Total Capacity (MW)</th>
                            <th style={{...pocStyles.th, textAlign: 'right'}}>Total Energy (MWh)</th>
                            <th style={{...pocStyles.th, textAlign: 'right'}}>Avg. Accuracy (%)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {dailyAggregation.map((row, idx) => (
                            <tr key={row.bsp} style={{...pocStyles.row, backgroundColor: idx % 2 === 1 ? '#fafbfc' : '#fff'}}>
                                <td style={pocStyles.td}>
                                    <div 
                                        style={{display:'flex', alignItems:'center', gap:'8px', color: '#0052cc', cursor: 'pointer', fontWeight: 600}}
                                        onClick={() => onSelectParty(row.bsp)}
                                    >
                                        <Briefcase size={14} color="#6b778c" />
                                        <span style={{textDecoration: 'underline'}}>{row.bsp}</span>
                                    </div>
                                </td>
                                <td style={{...pocStyles.td, textAlign: 'center'}}>{row.count}</td>
                                <td style={{...pocStyles.td, textAlign: 'right', fontWeight: 600}}>{row.totalVerifiedMW.toFixed(2)} MW</td>
                                <td style={{...pocStyles.td, textAlign: 'right', fontWeight: 700, color: '#0052cc'}}>{row.totalVerifiedMWh.toFixed(3)} MWh</td>
                                <td style={{...pocStyles.td, textAlign: 'right', fontWeight: 800, color: row.avgAccuracy >= 98 ? '#006644' : '#974f0c'}}>
                                    {row.avgAccuracy}%
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot style={{ backgroundColor: '#f4f5f7', borderTop: '2px solid #ebecf0' }}>
                        <tr>
                            <td style={{ ...pocStyles.td, fontWeight: 700 }}>DAILY TOTALS ({displayDate})</td>
                            <td style={{ ...pocStyles.td, textAlign: 'center', fontWeight: 700 }}>{totals.count}</td>
                            <td style={{ ...pocStyles.td, textAlign: 'right', fontWeight: 700 }}>{totals.mw.toFixed(2)} MW</td>
                            <td style={{ ...pocStyles.td, textAlign: 'right', fontWeight: 800, color: '#0052cc' }}>{totals.mwh.toFixed(3)} MWh</td>
                            <td style={pocStyles.td}></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
};
