/**
 * Bridges React premium state to synchronous `isPremiumUser()` used outside hooks.
 * Updated by PremiumEntitlementProvider whenever entitlement is refetched.
 */
let readEntitlement: () => boolean = () => false;

export function setPremiumEntitlementReader(fn: () => boolean): void {
  readEntitlement = fn;
}

export function getPremiumEntitlement(): boolean {
  return readEntitlement();
}
