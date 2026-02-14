import { BaselineStateV1 } from './StreamingProsodyTypes';

export class OnlineStats {
    static update(state: BaselineStateV1, x: number, y: number): void {
        state.sumX += x;
        state.sumY += y;
        state.sumXY += x * y;
        state.sumXX += x * x;
        state.count++;
    }

    static getRegression(state: BaselineStateV1): { slope: number; intercept: number } {
        if (state.count < 2) {
            return { slope: 0, intercept: 0 };
        }
        
        const n = state.count;
        const meanX = state.sumX / n;
        const meanY = state.sumY / n;
        
        const numerator = state.sumXY - n * meanX * meanY;
        const denominator = state.sumXX - n * meanX * meanX;
        
        if (Math.abs(denominator) < 1e-9) { // Avoid division by zero
            return { slope: 0, intercept: meanY };
        }
        
        const slope = numerator / denominator;
        const intercept = meanY - slope * meanX;
        
        return { slope, intercept };
    }
    
    static create(): BaselineStateV1 {
         return {
            sumX: 0,
            sumY: 0,
            sumXY: 0,
            sumXX: 0,
            count: 0
        };
    }
}
