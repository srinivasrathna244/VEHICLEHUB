require("dotenv").config();
const MarketDataService = require("../services/marketDataService");
const db = require("./db");

async function runSeed() {
    console.log("\n=======================================================");
    console.log("  🚗 VEHICLEHUB: OLX-Style Market Data Importer & Seeder");
    console.log("=======================================================\n");

    try {
        console.log("Connecting to database and verifying categories...");
        const result = await MarketDataService.seedMarketListings({ limit: 50 });

        console.log("\n✅ Market Data Import Completed Successfully!");
        console.log(`   - Added New Listings:    ${result.added}`);
        console.log(`   - Skipped (Existing):    ${result.skipped}`);
        console.log(`   - Total Processed:       ${result.totalAvailable}\n`);

        const [totalCount] = await db.query("SELECT COUNT(*) AS total FROM vehicles WHERE status = 'ACTIVE'");
        console.log(`📊 Current Active Vehicles in Marketplace: ${totalCount[0].total}\n`);

        process.exit(0);
    } catch (error) {
        console.error("\n❌ Market Data Seeding Error:", error.message);
        process.exit(1);
    }
}

runSeed();
