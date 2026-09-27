import { calculateHaversineDistanceMeters } from './securityEngine.js';
/**
 * Multi-Order Route Batching Algorithm (PDF Pages 23-24)
 * Clusters orders placed within 10 minutes sharing dropoff locations within 1.5km (1500m).
 */
export function clusterNearbyOrders(newOrder, pendingOrders) {
    const MAX_BATCH_RADIUS_METERS = 1500; // 1.5 km
    const MAX_BATCH_SIZE = 3;
    const compatibleOrders = pendingOrders.filter((order) => {
        if (order.orderId === newOrder.orderId)
            return false;
        // Check dropoff location proximity (< 1.5km)
        const dropoffDistance = calculateHaversineDistanceMeters(newOrder.dropoffLat, newOrder.dropoffLng, order.dropoffLat, order.dropoffLng);
        return dropoffDistance <= MAX_BATCH_RADIUS_METERS;
    });
    if (compatibleOrders.length > 0) {
        const batchedOrders = [newOrder, ...compatibleOrders.slice(0, MAX_BATCH_SIZE - 1)];
        const extraParcelsCount = batchedOrders.length - 1;
        // ₹35 base + ₹15 extra parcel bonus (Page 23)
        const riderBonusPayoutRupees = 35 + (extraParcelsCount * 15);
        return {
            batchId: `BATCH_${Date.now()}`,
            orders: batchedOrders,
            totalDistanceMeters: Math.round(MAX_BATCH_RADIUS_METERS),
            riderBonusPayoutRupees,
            isBatched: true
        };
    }
    // Single order dispatch fallback
    return {
        batchId: `SINGLE_${newOrder.orderId}`,
        orders: [newOrder],
        totalDistanceMeters: 0,
        riderBonusPayoutRupees: 35, // Base payout ₹35
        isBatched: false
    };
}
