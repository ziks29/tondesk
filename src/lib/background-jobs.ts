import { prisma } from "./prisma";
import { verifyPendingTopup } from "./ton-verification";

let isRunning = false;

export async function verifyPendingTopups() {
  // Prevent concurrent runs
  if (isRunning) return;
  isRunning = true;

  try {
    const masterWalletAddress = process.env.NEXT_PUBLIC_MASTER_WALLET_ADDRESS;
    if (!masterWalletAddress) {
      console.warn(
        "[Jobs] NEXT_PUBLIC_MASTER_WALLET_ADDRESS not configured, skipping payment verification",
      );
      return;
    }

    // Find all pending topups
    const pendingTopups = await prisma.transaction.findMany({
      where: {
        type: "topup",
        status: "pending",
      },
      orderBy: { createdAt: "asc" },
      take: 50, // Verify up to 50 pending transactions per run
    });

    if (pendingTopups.length === 0) {
      return;
    }

    console.log(`[Jobs] Verifying ${pendingTopups.length} pending topups`);

    // Verify all pending topups in parallel
    const results = await Promise.allSettled(
      pendingTopups.map((tx) => verifyPendingTopup(tx.id, masterWalletAddress)),
    );

    let verified = 0;
    let failed = 0;

    results.forEach((result, index) => {
      if (result.status === "fulfilled") {
        if (result.value.status === "completed") {
          verified++;
        }
      } else {
        failed++;
        console.error(
          `[Jobs] Failed to verify topup ${pendingTopups[index].id}:`,
          result.reason,
        );
      }
    });

    console.log(
      `[Jobs] Verification complete: ${verified} completed, ${failed} errors`,
    );
  } catch (error) {
    console.error("[Jobs] Error in verifyPendingTopups:", error);
  } finally {
    isRunning = false;
  }
}

let jobInterval: NodeJS.Timeout | null = null;

export function startBackgroundJobs() {
  if (jobInterval) {
    console.warn("[Jobs] Background jobs already running");
    return;
  }

  console.log("[Jobs] Starting background jobs");

  // Run verification immediately on startup
  void verifyPendingTopups();

  // Then run every minute
  jobInterval = setInterval(() => {
    void verifyPendingTopups();
  }, 60 * 1000);
}

export function stopBackgroundJobs() {
  if (jobInterval) {
    clearInterval(jobInterval);
    jobInterval = null;
    console.log("[Jobs] Background jobs stopped");
  }
}
